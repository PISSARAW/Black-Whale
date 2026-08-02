import { describe, expect, it } from 'vitest'
import { MIN_SEPARATION } from '../combat/reducer'
import { initialCombatState } from '../combat/types'
import { advanceArena } from './ai'

describe('the arena opponent', () => {
  it('closes distance without walking through the other fighter', () => {
    let state = initialCombatState()
    for (let elapsed = 0; elapsed < 5 && state.outcome === 'playing'; elapsed += 1 / 60) {
      state = advanceArena(state, 1 / 60)
    }

    expect(
      Math.hypot(
        state.player.position[0] - state.opponent.position[0],
        state.player.position[1] - state.opponent.position[1],
      ),
    ).toBeGreaterThanOrEqual(MIN_SEPARATION)
  })

  it('obeys the referee while the other fighter is down', () => {
    let state = initialCombatState()
    state = {
      ...state,
      clock: 0.44,
      player: { ...state.player, condition: 'down', recovery: 1 },
      opponent: { ...state.opponent, movement: [-1, 0] },
    }

    state = advanceArena(state, 0.02)
    expect(state.opponent.movement).toEqual([0, 0])
    expect(state.lastEvent).toBeNull()
  })
})
