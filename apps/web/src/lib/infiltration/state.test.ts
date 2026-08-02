import { describe, expect, it } from 'vitest'
import { infiltrationReducer, initialInfiltrationState, type MissionSetup } from './state'
import { reconstruction, updateInfiltration } from './loop'
import type { NavGraph } from '../hunt/navmesh'
import type { Arena } from '../hunt/arena'
import { planHatsu } from './hatsu'

const setup: MissionSetup = {
  playerAt: { position: [0, 0], spaceId: 'entry' },
  objectiveSpaceId: 'office',
  extractionSpaceId: 'entry',
  witnesses: [
    {
      id: 'guard',
      position: [1, 0],
      heading: -Math.PI / 2,
      spaceId: 'office',
      sight: 8,
      social: true,
      usesEn: false,
      route: ['office'],
    },
  ],
}

const graph: NavGraph = {
  nodes: ['entry', 'office'],
  edges: new Map([
    ['entry', ['office']],
    ['office', ['entry']],
  ]),
  centers: new Map([
    ['entry', [0, 0]],
    ['office', [1, 0]],
  ]),
}
const arena: Arena = {
  tierId: 'test',
  spaces: [],
  walls: [],
  doorways: [
    { tierId: 'test', a: 'entry', b: 'office', start: [0.45, -0.2], end: [0.45, 0.2], width: 0.4 },
  ],
}
const world = (dt: number) => ({ dt, graph, arena })

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
    state = updateInfiltration(state, world(1))
    expect(state.witnesses[0].belief.identity).toBe('intruder')
    expect(state.alert).toBe(0)
    state = updateInfiltration(state, world(3))
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
    state = updateInfiltration(state, world(5))
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

  it('turns footsteps into an investigation rather than omniscient pursuit', () => {
    let state = initialInfiltrationState(setup)
    state = infiltrationReducer(state, {
      type: 'WALKED',
      position: [0, 0],
      spaceId: 'entry',
      moving: true,
    })
    state = updateInfiltration(state, world(0.1))
    expect(state.witnesses[0].investigating).toBe('entry')
    expect(state.witnesses[0].belief.lastSpaceId).toBeNull()
  })

  it('resolves a social challenge through the chosen cover story', () => {
    let state = initialInfiltrationState(setup)
    state = infiltrationReducer(state, {
      type: 'WALKED',
      position: [1, 0],
      spaceId: 'office',
      moving: false,
    })
    state = updateInfiltration(state, world(0.1))
    expect(state.challenge?.witnessId).toBe('guard')
    state = infiltrationReducer(state, { type: 'ANSWER', answer: 'workOrder' })
    expect(state.witnesses[0].belief.identity).toBe('maintenance')
    expect(state.challenge).toBeNull()
  })

  it('uses Little Eye to confirm intelligence at an aura cost', () => {
    let state = initialInfiltrationState(setup)
    state = infiltrationReducer(state, { type: 'CAST_HATSU' })
    expect(state.authorConfirmed).toBe(true)
    expect(state.hatsu.aura).toBe(82)
    expect(state.hatsu.scouted).toBe(true)
  })

  it('projects and enforces the canonical need to hold aura', () => {
    let state = initialInfiltrationState(setup)
    state = infiltrationReducer(state, { type: 'ZETSU' })
    expect(planHatsu(state).available).toBe(false)
    state = infiltrationReducer(state, { type: 'CAST_HATSU' })
    expect(state.hatsu.aura).toBe(100)
    expect(planHatsu(state).conditions.find((condition) => condition.id === 'ten')?.met).toBe(false)
  })

  it('makes a forged work order pass a Nen guard social check', () => {
    let state = initialInfiltrationState(setup)
    state = infiltrationReducer(state, { type: 'SELECT_HATSU', id: 'texture-surprise' })
    state = infiltrationReducer(state, { type: 'CAST_HATSU' })
    state.challenge = { witnessId: 'guard', left: 5 }
    state.witnesses[0] = { ...state.witnesses[0], usesEn: true }
    state = infiltrationReducer(state, { type: 'ANSWER', answer: 'workOrder' })
    expect(state.witnesses[0].belief.identity).toBe('maintenance')
    expect(state.traces[0].kind).toBe('forgery')
  })
})
