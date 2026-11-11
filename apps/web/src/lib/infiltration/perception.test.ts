import { describe, expect, it } from 'vitest'
import { infiltrationReducer, initialInfiltrationState, type MissionSetup } from './state'
import { updateInfiltration } from './loop'
import type { NavGraph } from '../hunt/navmesh'
import type { Arena } from '../hunt/arena'

const graph: NavGraph = {
  nodes: ['entry', 'office'],
  edges: new Map([
    ['entry', ['office']],
    ['office', ['entry']],
  ]),
  centers: new Map([
    ['entry', [0, 0]],
    ['office', [4, 0]],
  ]),
}
const arena: Arena = {
  id: 'tserriednich',
  tierId: 'test',
  spaces: [],
  walls: [],
  doorways: [
    { tierId: 'test', a: 'entry', b: 'office', start: [2, -0.5], end: [2, 0.5], width: 1 },
  ],
}
const world = (dt: number) => ({ dt, graph, arena })

const witness = (id: 'steward' | 'nenGuard', spaceId: string, usesEn: boolean, social = true) => ({
  id,
  position: [0, 1] as [number, number],
  heading: Math.PI,
  spaceId,
  sight: 8,
  social,
  usesEn,
  route: [spaceId],
})

const setup = (witnesses: MissionSetup['witnesses']): MissionSetup => ({
  playerAt: { position: [0, 0], spaceId: 'entry' },
  objectiveSpaceId: 'office',
  extractionSpaceId: 'entry',
  witnesses,
})

const run = (state: ReturnType<typeof initialInfiltrationState>, seconds: number) => {
  let next = state
  for (let t = 0; t < seconds * 10 && next.outcome === 'playing'; t++) {
    next = updateInfiltration(next, world(0.1))
  }
  return next
}

describe('infiltration perception', () => {
  it('does not raise the alarm on an aide seen doing nothing wrong', () => {
    const state = run(
      initialInfiltrationState(setup([witness('steward', 'entry', false, false)])),
      30,
    )
    expect(state.witnesses[0].belief.identity).toBe('maintenance')
    expect(state.witnesses[0].belief.reported).toBe(false)
    expect(state.alert).toBe(0)
    expect(state.alertLevel).toBe('normal')
  })

  it('ends the mission once the visitor is identified', () => {
    const state = run(initialInfiltrationState(setup([witness('nenGuard', 'entry', true)])), 30)
    expect(state.outcome).toBe('identified')
  })
})

describe('cover checks', () => {
  it('answers each witness as it expects without contradicting itself', () => {
    let state = initialInfiltrationState(
      setup([witness('steward', 'entry', false), witness('nenGuard', 'entry', true)]),
    )
    state = { ...state, challenge: { witnessId: 'steward', left: 7 } }
    state = infiltrationReducer(state, { type: 'ANSWER', answer: 'workOrder' })
    state = { ...state, challenge: { witnessId: 'nenGuard', left: 7 } }
    state = infiltrationReducer(state, { type: 'ANSWER', answer: 'bluff' })
    expect(state.metrics.contradictions).toBe(0)
    expect(state.witnesses.map((item) => item.belief.identity)).toEqual([
      'maintenance',
      'maintenance',
    ])
  })

  it('holds the visitor to a story a reporting witness passed on', () => {
    let state = initialInfiltrationState(
      setup([witness('steward', 'entry', false), witness('nenGuard', 'entry', true)]),
    )
    state = { ...state, challenge: { witnessId: 'steward', left: 7 } }
    state = infiltrationReducer(state, { type: 'ANSWER', answer: 'workOrder' })
    state = {
      ...state,
      witnesses: state.witnesses.map((item) =>
        item.id === 'steward' ? { ...item, belief: { ...item.belief, reported: true } } : item,
      ),
      challenge: { witnessId: 'nenGuard', left: 7 },
    }
    state = infiltrationReducer(state, { type: 'ANSWER', answer: 'bluff' })
    expect(state.metrics.contradictions).toBe(1)
  })
})
