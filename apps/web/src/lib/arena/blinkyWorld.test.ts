import { describe, expect, it } from 'vitest'
import { initialCombatState } from '../combat/types'
import { arenaBlinkyWorld } from './blinkyWorld'

describe('Arena Blinky scene projection', () => {
  it('hides stored solids and moves released ones through the Tour world', () => {
    const state = initialCombatState()
    state.physicalObjects = {
      stored: { id: 'stored', position: [1, 0], storedBy: 'player' },
      released: { id: 'released', position: [4, 2], storedBy: null },
    }

    expect(arenaBlinkyWorld(state).solids).toEqual({
      stored: { gone: true },
      released: { at: [4, 2] },
    })
  })
})
