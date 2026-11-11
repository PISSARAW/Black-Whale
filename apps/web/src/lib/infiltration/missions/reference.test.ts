import { describe, expect, it } from 'vitest'
import { buildArena } from '../../hunt/arena'
import { buildNavGraph } from '../../hunt/navmesh'
import { infiltrationReducer, initialInfiltrationState } from '../state'
import { selectMission } from './definitions'
import { missionSetup } from './setup'
import { referenceMissionIssues, referenceMissionReady } from './reference'

describe('reference infiltration mission', () => {
  it('covers every core system and offers multiple routes', () => {
    expect(referenceMissionIssues()).toEqual([])
    expect(referenceMissionReady()).toBe(true)
  })

  it('plays from briefing to a successful extraction through the public reducer', () => {
    const arena = buildArena()
    const setup = missionSetup({
      selection: selectMission('missing-report', 0x5eed),
      arena,
      graph: buildNavGraph(arena),
    })
    let state = initialInfiltrationState({ ...setup, witnesses: [] })
    state = infiltrationReducer(state, {
      type: 'WALKED',
      position: arena.spaces[7].footprint[0],
      spaceId: state.objectiveSpaceId,
      moving: false,
    })
    state = infiltrationReducer(state, { type: 'COPY' })
    state = infiltrationReducer(state, { type: 'VERIFY' })
    state = infiltrationReducer(state, {
      type: 'WALKED',
      position: arena.spaces[0].footprint[0],
      spaceId: state.extractionSpaceId,
      moving: false,
    })
    state = infiltrationReducer(state, { type: 'EXTRACT' })

    expect(state.outcome).toBe('escaped')
    expect(
      state.objectives
        .filter((objective) => objective.required)
        .every((objective) => objective.state !== 'unknown'),
    ).toBe(true)
  })
})
