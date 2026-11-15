import { describe, expect, it } from 'vitest'
import { combatReducer, initialCombatState } from './reducer'

describe('reactive Arena environment', () => {
  it('alerts witnesses and schedules guards after noisy clandestine Hatsu', () => {
    let state = initialCombatState({
      playerAt: [0, 0],
      opponentAt: [2, 0],
      terrain: {
        id: 'casino',
        footprint: [
          [-5, -5],
          [5, -5],
          [5, 5],
          [-5, 5],
        ],
        walls: [],
      },
      context: 'CLANDESTINE',
    })
    for (let cast = 0; cast < 3; cast += 1) {
      state = { ...state, player: { ...state.player, cooldown: 0 } }
      state = combatReducer(state, {
        type: 'HATSU',
        side: 'player',
        effect: 'enhance',
        zone: 'arms',
        cost: 0,
      })
    }
    expect(state.environment).toMatchObject({ noise: 9, witnesses: 3, securityAlert: 2 })
    expect(state.environment.interventionIn).toBe(8)
  })

  it('lets security intervention end an undiscovered clandestine duel', () => {
    const state = {
      ...initialCombatState(),
      environment: {
        context: 'CLANDESTINE' as const,
        noise: 8,
        witnesses: 3,
        securityAlert: 3,
        interventionIn: 0.5,
        intervened: false,
      },
    }
    const next = combatReducer(state, { type: 'TICK', dt: 0.6 })
    expect(next.environment.intervened).toBe(true)
    expect(next.outcome).toBe('lost')
  })
})
