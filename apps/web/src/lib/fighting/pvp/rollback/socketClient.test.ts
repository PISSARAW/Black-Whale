import { describe, expect, it, vi } from 'vitest'
import { decodeRollbackWire, encodeRollbackWire, MAX_ROLLBACK_PAYLOAD } from './codec'
import { IDLE_SEAT } from './frameInput'
import { longDuel } from './sessionFixture'
import { RollbackSocketClient, type RollbackSocketLike } from './socketClient'
import type { PvpCommand } from '../types'

function transport() {
  const socket: RollbackSocketLike = {
    binaryType: '',
    readyState: 1,
    send: vi.fn(),
    close: vi.fn(),
    onopen: null,
    onclose: null,
    onmessage: null,
  }
  const client = new RollbackSocketClient(socket, {
    initial: longDuel('kurapika', 'hisoka'),
    local: 'player',
    inputDelay: 0,
    maxRollback: 8,
  })
  return { socket, client }
}

const light = { kind: 'move', action: 'light', input: 0 } satisfies PvpCommand
const heavy = { kind: 'move', action: 'heavy', input: 0 } satisfies PvpCommand

describe('rollback command buffer', () => {
  it('keeps each press once and in order through a full prediction window', () => {
    const { client } = transport()
    for (let frame = 0; frame < 8; frame++) expect(client.tick(IDLE_SEAT)).toBe(true)
    expect(client.tick(IDLE_SEAT)).toBe(false)
    expect(client.tick({ input: 0, commands: [light] })).toBe(false)
    expect(client.tick({ input: 0, commands: [heavy] })).toBe(false)
    client.session.receive({ inputs: [{ frame: 0, seat: IDLE_SEAT }], ack: -1, checksums: [] })
    expect(client.tick(IDLE_SEAT)).toBe(true)
    client.session.receive({ inputs: [{ frame: 1, seat: IDLE_SEAT }], ack: -1, checksums: [] })
    expect(client.tick(IDLE_SEAT)).toBe(true)
    expect(client.session.outgoing().inputs.filter(({ seat }) => seat.commands.length)).toEqual([
      { frame: 9, seat: { input: 0, commands: [light, heavy] } },
    ])
  })

  it('retains the press when the clock waits for the other seat', () => {
    const { client } = transport()
    vi.spyOn(client.time, 'shouldWait').mockReturnValueOnce(true)
    expect(client.tick({ input: 2, commands: [light] })).toBe(false)
    expect(client.tick({ input: 4, commands: [heavy] })).toBe(true)
    expect(client.session.outgoing().inputs).toEqual([
      { frame: 0, seat: { input: 4, commands: [light, heavy] } },
    ])
  })

  it('keeps the oldest input prefix when commands fill a datagram', () => {
    const poem = { kind: 'poem', text: '字'.repeat(240) } satisfies PvpCommand
    const inputs = Array.from({ length: 32 }, (_, frame) => ({
      frame,
      seat: { input: 0, commands: [poem, poem] },
    }))
    const bytes = encodeRollbackWire({
      type: 'frame',
      frame: 31,
      advantage: 0,
      message: { ack: -1, checksums: [], inputs },
    })
    expect(bytes.length).toBeLessThanOrEqual(MAX_ROLLBACK_PAYLOAD)
    const wire = decodeRollbackWire(bytes)
    expect(wire?.type).toBe('frame')
    if (wire?.type !== 'frame') throw Error('Frame could not be decoded')
    expect(wire.message.inputs.length).toBeLessThan(inputs.length)
    expect(wire.message.inputs).toEqual(inputs.slice(0, wire.message.inputs.length))
  })
})
