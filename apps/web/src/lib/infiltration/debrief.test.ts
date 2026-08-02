import { describe, expect, it } from 'vitest'
import { causalTimeline, debriefAxes } from './debrief'
import { selectMission } from './missions/definitions'
import { initialInfiltrationState } from './state'

describe('causal debrief', () => {
  it('keeps material success, information and cover independent', () => {
    const state = initialInfiltrationState({ playerAt: { position: [0, 0], spaceId: 'a' }, objectiveSpaceId: 'b', extractionSpaceId: 'a', witnesses: [], selection: selectMission('missing-report', 1) })
    const axes = debriefAxes({ ...state, documentCopied: true, objectives: state.objectives.map((objective) => objective.kind === 'copy' ? { ...objective, state: 'believed' } : objective) })
    expect(axes).toEqual({ material: 'complete', information: 'uncertain', cover: 'intact' })
  })
  it('keeps player actions in deterministic causal order', () => {
    let state = initialInfiltrationState({ playerAt: { position: [0, 0], spaceId: 'a' }, objectiveSpaceId: 'b', extractionSpaceId: 'a', witnesses: [] })
    state = { ...state, journal: [{ id: 'one', at: 2, type: 'ZETSU', actor: 'player' }, { id: 'two', at: 1, type: 'DIVERT', actor: 'player' }] }
    expect(causalTimeline(state).map((event) => event.detail)).toEqual(['DIVERT', 'ZETSU'])
  })
})
