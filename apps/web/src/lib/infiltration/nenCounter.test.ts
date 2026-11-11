import { describe, expect, it } from 'vitest'
import { infiltrationReducer, initialInfiltrationState } from './state'
import { counterNenManifestation } from './nenCounter'

const stateWithNenGuard = () =>
  initialInfiltrationState({
    playerAt: { position: [0, 0], spaceId: 'entry' },
    objectiveSpaceId: 'office',
    extractionSpaceId: 'entry',
    witnesses: [
      {
        id: 'nenGuard',
        position: [2, 0],
        heading: 0,
        spaceId: 'office',
        sight: 10,
        social: true,
        usesEn: true,
        route: ['office'],
      },
    ],
  })

describe('Nen counter-infiltration', () => {
  it('lets En neutralize a scout in range without locating its user', () => {
    let state = infiltrationReducer(stateWithNenGuard(), { type: 'CAST_HATSU' })
    state = infiltrationReducer(state, {
      type: 'SCOUT_MOVE',
      position: [2, 0],
      spaceId: 'office',
      visibleToGuard: false,
    })
    const result = counterNenManifestation(state, 'nenGuard')
    expect(result.countered).toBe('scout')
    expect(result.state.hatsu.scout?.active).toBe(false)
    expect(result.state.witnesses[0].belief.lastSpaceId).toBe('office')
    expect(result.state.witnesses[0].belief.lastSpaceId).not.toBe(state.player.spaceId)
  })

  it('cannot counter a manifestation outside the guard En space', () => {
    const state = infiltrationReducer(stateWithNenGuard(), { type: 'CAST_HATSU' })
    expect(counterNenManifestation(state, 'nenGuard').countered).toBeNull()
  })
})
