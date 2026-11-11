import { describe, expect, it } from 'vitest'
import { combatReducer, initialCombatState } from '../../combat/reducer'
import { forkReplayAtTick } from './branch'
import { playReplay } from './player'
import { ArenaRecorder } from './recorder'

describe('interactive replay branch', () => {
  it('resumes from a selected tick and produces a valid divergent replay', () => {
    const setup = {
      playerAt: [0, 0] as [number, number],
      opponentAt: [1.5, 0] as [number, number],
      terrain: {
        id: 'branch',
        footprint: [
          [-5, -5],
          [5, -5],
          [5, 5],
          [-5, 5],
        ] as [number, number][],
        walls: [],
      },
    }
    let state = initialCombatState(setup)
    const original = new ArenaRecorder({ setup, doctrine: 'counter', difficulty: 'fighter' })
    const guard = { type: 'GUARD' as const, side: 'player' as const }
    state = combatReducer(state, guard)
    original.record(guard)
    original.advance()
    state = combatReducer(state, { type: 'TICK', dt: 1 / 60 })
    original.advance()
    const replay = original.finish(state)

    const branch = forkReplayAtTick(replay, 1)
    const ryu = { type: 'RYU' as const, side: 'player' as const, attackShare: 0.8 }
    const changed = combatReducer(branch.state, ryu)
    branch.recorder.record(ryu)
    const fork = branch.recorder.finish(changed)

    expect(fork.commands).toEqual([replay.commands[0], { tick: 1, action: ryu }])
    expect(playReplay(fork).checksum).toBe(fork.checksum)
  })
})
