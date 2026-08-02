import { describe, expect, it } from 'vitest'
import { INFILTRATION_HATSU, type InfiltrationHatsuId } from './hatsu'
import { infiltrationReducer, initialInfiltrationState, type MissionSetup } from './state'

const setup: MissionSetup = {
  playerAt: { position: [0, 0], spaceId: 'entry' }, objectiveSpaceId: 'office', extractionSpaceId: 'entry',
  witnesses: [{ id: 'guard', position: [1, 0], heading: 0, spaceId: 'office', sight: 8, social: true, usesEn: false, route: ['office'] }],
}
const cast = (id: InfiltrationHatsuId) => {
  let state = initialInfiltrationState(setup)
  state = infiltrationReducer(state, { type: 'SELECT_HATSU', id })
  if (['secret-window', 'bloody-mary', 'body-and-soul'].includes(id)) {
    state = infiltrationReducer(state, { type: 'WALKED', position: [1, 0], spaceId: 'office', moving: false })
    state = infiltrationReducer(state, { type: 'TARGET_HATSU', witnessId: 'guard' })
  }
  return infiltrationReducer(state, { type: 'CAST_HATSU' })
}

describe('Black Whale infiltration Hatsu', () => {
  it('exposes only the thirteen supported onboard abilities', () => {
    expect(INFILTRATION_HATSU.map((ability) => ability.id)).toEqual(expect.arrayContaining([
      'secret-window', 'biohazard-hinrigh', 'surveillance-paper-dolls', 'bloody-mary',
      'body-and-soul', 'dowsing-chain', 'blinky', 'bungee-gum', 'skill-hunter', 'stealth-dolphin',
    ]))
    expect(INFILTRATION_HATSU).toHaveLength(13)
  })
  it('keeps surveillance, tracking, interrogation and analysis distinct', () => {
    expect(cast('secret-window').hatsu.effect?.kind).toBe('attached-owl')
    expect(cast('surveillance-paper-dolls').hatsu.effect?.kind).toBe('paper-network')
    expect(cast('bloody-mary').hatsu.effect?.kind).toBe('blood-tracker')
    expect(cast('body-and-soul')).toMatchObject({ authorConfirmed: true, coverIntegrity: 65 })
    expect(cast('dowsing-chain').hatsu.effect?.kind).toBe('dowsing-result')
  })
  it('cleans only non-aura traces with Blinky', () => {
    let state = initialInfiltrationState(setup)
    state = { ...state, traces: [
      { kind: 'document', spaceId: 'entry', strength: 20 },
      { kind: 'aura', spaceId: 'entry', strength: 20 },
    ] }
    state = infiltrationReducer(state, { type: 'SELECT_HATSU', id: 'blinky' })
    state = infiltrationReducer(state, { type: 'CAST_HATSU' })
    expect(state.traces.map((trace) => trace.kind)).toEqual(['aura'])
  })
})
