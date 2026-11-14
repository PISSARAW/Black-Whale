import { describe, expect, it } from 'vitest'
import { combatReducer, initialCombatState } from './reducer'

describe('persistent Nen effects', () => {
  it('keeps transformed objects in the duel after Biohazard resolves', () => {
    const state = initialCombatState({
      playerAt: [0, 0],
      opponentAt: [2, 0],
      terrain: {
        id: 'room',
        footprint: [
          [-5, -5],
          [5, -5],
          [5, 5],
          [-5, 5],
        ],
        walls: [],
      },
    })
    const next = combatReducer(state, {
      type: 'HATSU',
      side: 'player',
      effect: 'bind',
      zone: 'torso',
      hatsuId: 'biohazard-hinrigh',
      cost: 0,
    })
    expect(next.nenEffects).toEqual([
      expect.objectContaining({ kind: 'TRANSFORMED_OBJECT', sourceHatsuId: 'biohazard-hinrigh' }),
    ])
  })

  it('expires temporary traps but preserves captured abilities', () => {
    const state = {
      ...initialCombatState(),
      nenEffects: [
        {
          id: 'trap',
          kind: 'HIDDEN_TRAP' as const,
          owner: 'player' as const,
          target: 'opponent' as const,
          sourceHatsuId: 'silent-majority',
          remaining: 1,
          detail: null,
        },
        {
          id: 'capture',
          kind: 'CAPTURED_ABILITY' as const,
          owner: 'player' as const,
          target: 'opponent' as const,
          sourceHatsuId: 'steal-chain',
          remaining: null,
          detail: 'secret-window',
        },
      ],
    }
    const next = combatReducer(state, { type: 'TICK', dt: 1.1 })
    expect(next.nenEffects.map(({ id }) => id)).toEqual(['capture'])
  })
})
