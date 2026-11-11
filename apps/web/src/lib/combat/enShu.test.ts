import { describe, expect, it } from 'vitest'
import { readAura } from './perception'
import { combatReducer, initialCombatState } from './reducer'

describe('Arena En and Shu', () => {
  it('detects a concealed presence inside En without revealing its Ryu', () => {
    let state = initialCombatState()
    state = {
      ...state,
      player: { ...state.player, position: [0, 0] },
      opponent: { ...state.opponent, position: [3, 0], in: true },
    }
    state = combatReducer(state, { type: 'EN', side: 'player', radius: 4 })
    expect(readAura(state.player, state.opponent)).toMatchObject({
      presenceDetected: true,
      guard: null,
      concealed: true,
    })
  })

  it('maintains Shu on a real object at a continuous aura cost', () => {
    let state = initialCombatState()
    state = combatReducer(state, {
      type: 'SHU',
      side: 'player',
      objectId: 'casino-chip',
      on: true,
    })
    state = combatReducer(state, { type: 'TICK', dt: 2 })
    expect(state.player.shuObjectId).toBe('casino-chip')
    expect(state.player.aura).toBe(96)
  })
})
