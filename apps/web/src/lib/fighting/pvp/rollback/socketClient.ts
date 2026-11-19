import { decodeRollbackWire, encodeRollbackWire, type RollbackWire } from './codec'
import { RollbackSession, type RollbackSessionOptions } from './session'
import { TimeSync } from './timeSync'
import type { PvpSeatFrame } from './frameInput'

/** The part of a WebSocket this client uses: the browser's and `ws` both fit. */
export interface RollbackSocketLike {
  binaryType: string
  readyState: number
  send(data: Uint8Array): void
  close(code?: number, reason?: string): void
  onmessage: ((event: { data: unknown }) => void) | null
  onopen: (() => void) | null
  onclose: ((event: { code: number }) => void) | null
}

export interface RollbackSocketStatus {
  open: boolean
  peerConnected: boolean
  closeCode: number | null
}

const OPEN = 1
const PING_EVERY = 30
const MAX_PING_ID = 0xffffffff

function bytesOf(data: unknown): Uint8Array | null {
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  return null
}

/**
 * Lot L3: one client's rollback session on the relay socket. The caller owns the 60 Hz clock
 * and calls `tick` once per wall-clock frame with the local seat for that frame.
 */
export class RollbackSocketClient {
  readonly session: RollbackSession
  readonly time = new TimeSync()
  readonly status: RollbackSocketStatus = { open: false, peerConnected: false, closeCode: null }
  waitedFrames = 0
  private ticks = 0
  private nextPing = 0
  private readonly clock: () => number

  constructor(
    private readonly socket: RollbackSocketLike,
    options: RollbackSessionOptions & { clock?: () => number },
  ) {
    this.session = new RollbackSession(options)
    this.clock = options.clock ?? (() => performance.now())
    socket.binaryType = 'arraybuffer'
    socket.onopen = () => (this.status.open = true)
    socket.onclose = (event) => {
      this.status.open = false
      this.status.closeCode = event.code
    }
    socket.onmessage = (event) => this.receive(event.data)
  }

  /** One wall-clock frame: maybe wait for the peer, else record, simulate and send. */
  tick(seat: PvpSeatFrame): boolean {
    if (this.socket.readyState !== OPEN) return false
    this.ticks++
    if (this.ticks % PING_EVERY === 1) this.ping()
    if (this.time.shouldWait(this.session.frame)) {
      this.waitedFrames++
      return false
    }
    this.session.addLocalInput(seat)
    const advanced = this.session.advance()
    this.send({
      type: 'frame',
      frame: this.session.frame,
      advantage: this.time.advantage,
      message: this.session.outgoing(),
    })
    return advanced
  }

  close() {
    this.socket.close(1000, 'done')
  }

  private ping() {
    this.nextPing = (this.nextPing + 1) % MAX_PING_ID
    this.send({ type: 'ping', id: this.nextPing, sentAt: this.clock() })
  }

  private send(wire: RollbackWire) {
    if (this.socket.readyState === OPEN) this.socket.send(encodeRollbackWire(wire))
  }

  private receive(data: unknown) {
    const bytes = bytesOf(data)
    const wire = bytes && decodeRollbackWire(bytes)
    if (!wire) return
    if (wire.type === 'peer') this.status.peerConnected = wire.connected
    else if (wire.type === 'ping') this.send({ ...wire, type: 'pong' })
    else if (wire.type === 'pong') this.time.observePong(wire.sentAt, this.clock())
    else {
      this.status.peerConnected = true
      this.session.receive(wire.message)
      this.time.observeRemote({
        remoteFrame: wire.frame,
        remoteAdvantage: wire.advantage,
        localFrame: this.session.frame,
      })
    }
  }
}
