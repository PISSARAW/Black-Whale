import { describe, expect, it } from 'vitest'
import { AuthoritativeArenaMatch } from './serverMatch'

const setup = {
  playerAt: [0, 0] as [number, number],
  opponentAt: [1.5, 0] as [number, number],
  terrain: {
    id: 'pvp-room',
    footprint: [[-5, -5], [5, -5], [5, 5], [-5, 5]] as [number, number][],
    walls: [],
  },
}

describe('authoritative Arena PvP match', () => {
  it('accepts ordered commands only for the side owned by the sender', () => {
    const match = new AuthoritativeArenaMatch('match-1', setup, {
      player: 'alice',
      opponent: 'bob',
    })
    expect(
      match.submit({
        matchId: 'match-1',
        playerId: 'alice',
        sequence: 0,
        action: { type: 'GUARD', side: 'player' },
      }),
    ).toEqual({ accepted: true })
    expect(
      match.submit({
        matchId: 'match-1',
        playerId: 'alice',
        sequence: 1,
        action: { type: 'GUARD', side: 'opponent' },
      }),
    ).toEqual({ accepted: false, reason: 'WRONG_SIDE' })
  })

  it('rejects replayed packets and advances time on the server only', () => {
    const match = new AuthoritativeArenaMatch('match-2', setup, {
      player: 'alice',
      opponent: 'bob',
    })
    const command = {
      matchId: 'match-2',
      playerId: 'bob',
      sequence: 0,
      action: { type: 'RYU' as const, side: 'opponent' as const, attackShare: 0.8 },
    }
    expect(match.submit(command)).toEqual({ accepted: true })
    expect(match.submit(command)).toEqual({ accepted: false, reason: 'OUT_OF_ORDER' })
    const before = match.snapshot()
    const after = match.advance(1 / 60)
    expect(after.tick).toBe(before.tick + 1)
    expect(after.checksum).not.toBe(before.checksum)
  })

  it('returns cloned snapshots that clients cannot mutate', () => {
    const match = new AuthoritativeArenaMatch('match-3', setup, {
      player: 'alice',
      opponent: 'bob',
    })
    const snapshot = match.snapshot()
    snapshot.state.player.aura = 0
    expect(match.snapshot().state.player.aura).toBe(100)
  })
})
