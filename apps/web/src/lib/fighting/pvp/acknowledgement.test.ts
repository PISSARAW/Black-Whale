import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from '../engine'
import { AuthoritativeClashMatch } from './serverMatch'

function match() {
  return new AuthoritativeClashMatch(
    beginFight(createFight('kurapika', 'hisoka', { mode: 'versus-local' })),
  )
}
const command = { kind: 'move', action: 'light', input: 0 } as const

describe('received and applied input acknowledgements', () => {
  it('acknowledges complete packets only after their commands leave the authoritative queue', () => {
    const server = match()
    for (let sequence = 0; sequence < 2; sequence++)
      expect(
        server.submit('player', { sequence, input: 0, commands: Array(8).fill(command) }, 0),
      ).toBe('accepted')
    expect(server.submit('player', { sequence: 2, input: 0, commands: [] }, 0)).toBe('accepted')
    expect(server.nextSequence('player')).toBe(3)
    expect(server.acknowledgement('player')).toEqual({
      inputEpoch: 0,
      appliedSequence: 0,
      appliedAtTick: 0,
    })
    server.advance(17)
    expect(server.acknowledgement('player')).toEqual({
      inputEpoch: 0,
      appliedSequence: 1,
      appliedAtTick: 1,
    })
    server.advance(34)
    expect(server.acknowledgement('player')).toEqual({
      inputEpoch: 0,
      appliedSequence: 3,
      appliedAtTick: 2,
    })
    server.advance(51)
    expect(server.acknowledgement('player')).toEqual({
      inputEpoch: 0,
      appliedSequence: 3,
      appliedAtTick: 2,
    })
  })
  it('acknowledges discarded commands on interruption without executing them', () => {
    const server = match()
    const reference = new AuthoritativeClashMatch(server.snapshot())
    server.submit('player', { sequence: 0, input: 1, commands: [command] }, 0)
    server.release()
    expect(server.acknowledgement('player')).toEqual({
      inputEpoch: 1,
      appliedSequence: 1,
      appliedAtTick: 0,
    })
    server.advance(17)
    expect(server.snapshot().player.attack).toBeNull()
    reference.advance(17)
    expect(server.snapshot()).toEqual(reference.snapshot())
  })
})
