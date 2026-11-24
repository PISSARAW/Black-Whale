import { describe, expect, it } from 'vitest'
import { combatReducer, initialCombatState } from '../../combat/reducer'
import type { CombatState } from '../../combat/types'
import { stateChecksum } from '../replay/checksum'
import { ArenaRollbackClient } from './rollbackClient'
import { AuthoritativeArenaMatch } from './serverMatch'
import type { ArenaPvpView } from './transport'

describe('Arena authoritative rollback client', () => {
  it('predicts local commands immediately and replays them over a newer snapshot', () => {
    const client = new ArenaRollbackClient('player')
    client.receive(view({ state: base(), tick: 0, nextSequence: 0 }))
    const command = client.predict({ type: 'GUARD', side: 'player' })
    expect(command?.sequence).toBe(0)
    expect(client.state?.player.guardWindow).toBeGreaterThan(0)

    const advanced = combatReducer(base(), { type: 'TICK', dt: 1 / 60 })
    const result = client.receive(view({ state: advanced, tick: 1, nextSequence: 0 }))
    expect(result).toMatchObject({ rolledBack: true, replayed: 1 })
    expect(result.state?.clock).toBeCloseTo(1 / 60)
    expect(result.state?.player.guardWindow).toBeGreaterThan(0)
  })

  it('drops acknowledged commands and accepts the authoritative result', () => {
    const client = new ArenaRollbackClient('player')
    const state = base()
    client.receive(view({ state, tick: 0, nextSequence: 0 }))
    client.predict({ type: 'RYU', side: 'player', attackShare: 0.8 })
    const accepted = combatReducer(state, { type: 'RYU', side: 'player', attackShare: 0.8 })

    const result = client.receive(view({ state: accepted, tick: 1, nextSequence: 1 }))
    expect(result.replayed).toBe(0)
    expect(client.pendingCommands).toBe(0)
    expect(stateChecksum(result.state!)).toBe(stateChecksum(accepted))
  })

  it('numbers rapid commands and ignores stale polling responses', () => {
    const client = new ArenaRollbackClient('opponent')
    const state = base()
    client.receive(view({ state, tick: 4, nextSequence: 0, side: 'opponent' }))
    expect(client.predict({ type: 'MODE', side: 'opponent', mode: 'ren' })?.sequence).toBe(0)
    expect(client.predict({ type: 'GYO', side: 'opponent', on: true })?.sequence).toBe(1)
    const before = stateChecksum(client.state!)

    client.receive(view({ state, tick: 3, nextSequence: 0, side: 'opponent' }))
    expect(stateChecksum(client.state!)).toBe(before)
    expect(client.pendingCommands).toBe(2)
  })

  it('discards a rejected command and every command based on it', () => {
    const client = new ArenaRollbackClient('player')
    client.receive(view({ state: base(), tick: 0, nextSequence: 0 }))
    client.predict({ type: 'MODE', side: 'player', mode: 'ren' })
    client.predict({ type: 'GYO', side: 'player', on: true })
    client.reject(0)
    expect(client.pendingCommands).toBe(0)
  })

  it('converges with the authoritative match after a rapid command queue', () => {
    const server = new AuthoritativeArenaMatch('rollback-test', setup(), {
      players: { player: 'alice', opponent: 'bob' },
    })
    const client = new ArenaRollbackClient('player')
    const opening = server.snapshot()
    client.receive(view({ state: opening.state, tick: opening.tick, nextSequence: 0 }))
    const commands = [
      client.predict({ type: 'GUARD', side: 'player' }),
      client.predict({ type: 'RYU', side: 'player', attackShare: 0.75 }),
    ]
    for (const command of commands) {
      expect(
        server.submit({
          matchId: 'rollback-test',
          playerId: 'alice',
          sequence: command!.sequence,
          action: command!.action,
        }),
      ).toEqual({ accepted: true })
    }
    const authoritative = server.snapshot()
    client.receive(
      view({
        state: authoritative.state,
        tick: authoritative.tick,
        revision: authoritative.revision,
        nextSequence: 2,
      }),
    )

    expect(client.pendingCommands).toBe(0)
    expect(stateChecksum(client.state!)).toBe(authoritative.checksum)
  })
})

function base(): CombatState {
  return initialCombatState(setup())
}

function setup() {
  return {
    playerAt: [0, 0],
    opponentAt: [2, 0],
    terrain: initialCombatState().terrain,
  } as const
}

function view(options: {
  state: CombatState
  tick: number
  nextSequence: number
  side?: ArenaPvpView['side']
  revision?: number
}): ArenaPvpView {
  const { state, tick, nextSequence, side = 'player' } = options
  return {
    matchId: 'rollback-test',
    status: 'playing',
    side,
    nextSequence,
    snapshot: {
      matchId: 'rollback-test',
      tick,
      revision: options.revision ?? tick,
      state,
      checksum: stateChecksum(state),
    },
  }
}
