import { describe, expect, it } from 'vitest'
import { combatReducer, initialCombatState } from '../combat/reducer'
import { actionForArenaControl, type ArenaJourneyControl } from './journey'
import { ArenaRecorder } from './replay/recorder'
import { playReplay } from './replay/player'

describe.each(['desktop-strike', 'mobile-strike'] as ArenaJourneyControl[])(
  'Arena %s journey',
  (control) => {
    it('plays, records and deterministically replays a complete bout', () => {
      const setup = {
        playerAt: [0, 0] as [number, number],
        opponentAt: [0, -1.4] as [number, number],
        terrain: {
          id: 'journey-room',
          footprint: [
            [-10, -10],
            [10, -10],
            [10, 10],
            [-10, 10],
          ] as [number, number][],
          walls: [],
        },
      }
      let state = initialCombatState(setup)
      const recorder = new ArenaRecorder({ setup, doctrine: 'counter', difficulty: 'initiate' })
      for (let tick = 0; tick < 3_600 && state.outcome === 'playing'; tick += 1) {
        const pursue = {
          type: 'SYNC_POSITION' as const,
          side: 'opponent' as const,
          position: [0, -1.4] as [number, number],
        }
        state = combatReducer(state, pursue)
        recorder.record(pursue)
        if (state.player.condition === 'ready' && state.player.cooldown === 0) {
          const action = actionForArenaControl(control, state)
          state = combatReducer(state, action)
          recorder.record(action)
        }
        state = combatReducer(state, { type: 'TICK', dt: 1 / 60 })
        recorder.advance()
      }
      const replay = recorder.finish(state)
      expect(state.outcome).toBe('won')
      expect(playReplay(replay).state.outcome).toBe('won')
    })
  },
)

describe('Arena journey controls', () => {
  it('maps desktop and mobile guard to the same authoritative action', () => {
    const state = initialCombatState()
    expect(actionForArenaControl('desktop-guard', state)).toEqual(
      actionForArenaControl('mobile-guard', state),
    )
  })
})
