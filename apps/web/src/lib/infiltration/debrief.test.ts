import { describe, expect, it } from 'vitest'
import { debriefAxes } from './debrief'
import { selectMission } from './missions/definitions'
import { initialInfiltrationState } from './state'

describe('causal debrief', () => {
  it('keeps material success, information and cover independent', () => {
    const state = initialInfiltrationState({ playerAt: { position: [0, 0], spaceId: 'a' }, objectiveSpaceId: 'b', extractionSpaceId: 'a', witnesses: [], selection: selectMission('missing-report', 1) })
    const axes = debriefAxes({ ...state, documentCopied: true, objectives: state.objectives.map((objective) => objective.kind === 'copy' ? { ...objective, state: 'believed' } : objective) })
    expect(axes).toEqual({ material: 'complete', information: 'uncertain', cover: 'intact' })
  })
})
