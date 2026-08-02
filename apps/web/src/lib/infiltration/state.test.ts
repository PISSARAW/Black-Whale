import { describe, expect, it } from 'vitest'
import { infiltrationReducer, initialInfiltrationState, type MissionSetup } from './state'
import { reconstruction, updateInfiltration } from './loop'

const setup: MissionSetup = {
  playerAt: { position: [0, 0], spaceId: 'entry' },
  objectiveSpaceId: 'office',
  extractionSpaceId: 'entry',
  witnesses: [
    { id: 'guard', position: [1, 0], spaceId: 'office', sight: 8, social: true, usesEn: false },
  ],
}

describe('infiltration', () => {
  it('requires the document before extraction', () => {
    const state = initialInfiltrationState(setup)
    expect(infiltrationReducer(state, { type: 'EXTRACT' }).outcome).toBe('playing')
  })

  it('keeps witness belief local until it is reported', () => {
    let state = initialInfiltrationState(setup)
    state = infiltrationReducer(state, {
      type: 'WALKED',
      position: [0, 0],
      spaceId: 'office',
      moving: false,
    })
    state = updateInfiltration(state, 1)
    expect(state.witnesses[0].belief.identity).toBe('intruder')
    expect(state.alert).toBe(0)
    state = updateInfiltration(state, 3)
    expect(state.witnesses[0].belief.reported).toBe(true)
    expect(state.alert).toBeGreaterThan(0)
  })

  it('lets a diversion prevent observation in its room', () => {
    let state = initialInfiltrationState(setup)
    state = infiltrationReducer(state, {
      type: 'WALKED',
      position: [0, 0],
      spaceId: 'office',
      moving: false,
    })
    state = infiltrationReducer(state, { type: 'DIVERT' })
    state = updateInfiltration(state, 5)
    expect(state.witnesses[0].belief.certainty).toBe(0)
  })

  it('extracts with a reconstruction rather than erasing traces', () => {
    let state = initialInfiltrationState(setup)
    state = infiltrationReducer(state, {
      type: 'WALKED',
      position: [0, 0],
      spaceId: 'office',
      moving: false,
    })
    state = infiltrationReducer(state, { type: 'COPY' })
    state = infiltrationReducer(state, {
      type: 'WALKED',
      position: [0, 0],
      spaceId: 'entry',
      moving: false,
    })
    state = infiltrationReducer(state, { type: 'EXTRACT' })
    expect(state.outcome).toBe('escaped')
    expect(reconstruction(state).traces).toHaveLength(1)
  })
})
