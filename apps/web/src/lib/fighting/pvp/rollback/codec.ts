import type { PvpCommand } from '../types'
import type { RollbackMessage } from './session'

/** Wire format version; any layout change bumps it and old peers are refused. */
export const ROLLBACK_WIRE_VERSION = 1
const MAX_INPUTS = 32
const MAX_CHECKSUMS = 4
const MAX_COMMAND_BYTES = 2048

/** Everything that crosses the relay socket (plan, lot L3). */
export type RollbackWire =
  | { type: 'frame'; message: RollbackMessage; frame: number; advantage: number }
  | { type: 'ping'; id: number; sentAt: number }
  | { type: 'pong'; id: number; sentAt: number }
  | { type: 'peer'; connected: boolean }

const TYPES = ['frame', 'ping', 'pong', 'peer'] as const
const encoder = new TextEncoder()
const decoder = new TextDecoder()

class Writer {
  private bytes = new Uint8Array(256)
  private view = new DataView(this.bytes.buffer)
  length = 0
  private room(size: number) {
    if (this.length + size <= this.bytes.length) return
    const next = new Uint8Array(Math.max(this.bytes.length * 2, this.length + size))
    next.set(this.bytes)
    this.bytes = next
    this.view = new DataView(next.buffer)
  }
  u8(value: number) {
    this.room(1)
    this.view.setUint8(this.length++, value)
  }
  i32(value: number) {
    this.room(4)
    this.view.setInt32(this.length, value)
    this.length += 4
  }
  u32(value: number) {
    this.room(4)
    this.view.setUint32(this.length, value)
    this.length += 4
  }
  f64(value: number) {
    this.room(8)
    this.view.setFloat64(this.length, value)
    this.length += 8
  }
  blob(data: Uint8Array) {
    this.room(2 + data.length)
    this.view.setUint16(this.length, data.length)
    this.bytes.set(data, this.length + 2)
    this.length += 2 + data.length
  }
  done(): Uint8Array {
    return this.bytes.slice(0, this.length)
  }
}

/** Throws on any overrun; `decodeRollbackWire` turns that into `null`. */
class Reader {
  private offset = 0
  private readonly view: DataView
  constructor(private readonly bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  }
  u8() {
    return this.view.getUint8(this.offset++)
  }
  i32() {
    const value = this.view.getInt32(this.offset)
    this.offset += 4
    return value
  }
  u32() {
    const value = this.view.getUint32(this.offset)
    this.offset += 4
    return value
  }
  f64() {
    const value = this.view.getFloat64(this.offset)
    this.offset += 8
    return value
  }
  blob(): Uint8Array {
    const size = this.view.getUint16(this.offset)
    if (size > MAX_COMMAND_BYTES || this.offset + 2 + size > this.bytes.length) throw Error('blob')
    const data = this.bytes.subarray(this.offset + 2, this.offset + 2 + size)
    this.offset += 2 + size
    return data
  }
  get finished() {
    return this.offset === this.bytes.length
  }
}

function writeMessage(out: Writer, message: RollbackMessage) {
  out.i32(message.ack)
  out.u8(Math.min(message.inputs.length, MAX_INPUTS))
  for (const { frame, seat } of message.inputs.slice(0, MAX_INPUTS)) {
    out.i32(frame)
    out.u32(seat.input)
    out.blob(
      seat.commands.length ? encoder.encode(JSON.stringify(seat.commands)) : new Uint8Array(),
    )
  }
  const checksums = message.checksums.slice(-MAX_CHECKSUMS)
  out.u8(checksums.length)
  for (const [frame, hash] of checksums) {
    out.i32(frame)
    out.u32(Number.parseInt(hash, 16) >>> 0)
  }
}

function readCommands(data: Uint8Array): PvpCommand[] {
  if (!data.length) return []
  const value: unknown = JSON.parse(decoder.decode(data))
  if (!Array.isArray(value)) throw Error('commands')
  return value as PvpCommand[]
}

function readMessage(input: Reader): RollbackMessage {
  const ack = input.i32()
  const count = input.u8()
  if (count > MAX_INPUTS) throw Error('inputs')
  const inputs = Array.from({ length: count }, () => ({
    frame: input.i32(),
    seat: { input: input.u32(), commands: readCommands(input.blob()) },
  }))
  const sums = input.u8()
  if (sums > MAX_CHECKSUMS) throw Error('checksums')
  const checksums = Array.from(
    { length: sums },
    () => [input.i32(), input.u32().toString(16).padStart(8, '0')] as [number, string],
  )
  return { inputs, ack, checksums }
}

export function encodeRollbackWire(wire: RollbackWire): Uint8Array {
  const out = new Writer()
  out.u8(ROLLBACK_WIRE_VERSION)
  out.u8(TYPES.indexOf(wire.type))
  if (wire.type === 'frame') {
    out.i32(wire.frame)
    out.i32(Math.round(wire.advantage * 100))
    writeMessage(out, wire.message)
  } else if (wire.type === 'peer') out.u8(Number(wire.connected))
  else {
    out.u32(wire.id)
    out.f64(wire.sentAt)
  }
  return out.done()
}

function readWire(input: Reader, type: (typeof TYPES)[number]): RollbackWire {
  if (type === 'frame') {
    const frame = input.i32()
    const advantage = input.i32() / 100
    return { type, frame, advantage, message: readMessage(input) }
  }
  if (type === 'peer') return { type, connected: input.u8() === 1 }
  return { type, id: input.u32(), sentAt: input.f64() }
}

/** Shape only: the relay still validates frames and commands before trusting them. */
export function decodeRollbackWire(bytes: Uint8Array): RollbackWire | null {
  try {
    const input = new Reader(bytes)
    if (input.u8() !== ROLLBACK_WIRE_VERSION) return null
    const type = TYPES[input.u8()]
    if (!type) return null
    const wire = readWire(input, type)
    return input.finished ? wire : null
  } catch {
    return null
  }
}
