import { describe, expect, it } from 'vitest'
import { selectMission } from './missions/definitions'
import { decodeSave, encodeSave } from './persistence'
import { infiltrationReducer, initialInfiltrationState } from './state'

const state = initialInfiltrationState({
  playerAt: { position: [0, 0], spaceId: 'a' },
  objectiveSpaceId: 'b',
  extractionSpaceId: 'a',
  witnesses: [],
  selection: selectMission('courier', 42),
})
describe('versioned infiltration saves', () => {
  it('round-trips a V2 mission', () =>
    expect(decodeSave(encodeSave(state, '2026-01-01T00:00:00Z'))?.state).toEqual(state))
  it('rejects corrupt saves and migrates V2', () => {
    expect(decodeSave('{')).toBeNull()
    expect(decodeSave('{"version":1}')).toBeNull()
    const legacy = JSON.parse(encodeSave(state))
    legacy.version = 2
    delete legacy.state.journal
    expect(decodeSave(JSON.stringify(legacy))?.version).toBe(3)
  })
  it('keeps the walk out of the journal, and out of the save', () => {
    let walked = state
    for (let frame = 0; frame < 600; frame++) {
      walked = infiltrationReducer(walked, {
        type: 'WALKED',
        position: [frame / 100, 0],
        spaceId: 'a',
        moving: true,
      })
    }
    expect(walked.journal).toHaveLength(0)
    const bloated = { ...state, journal: [{ id: 'w', at: 0, type: 'WALKED', actor: 'player' }] }
    expect(decodeSave(encodeSave(bloated as typeof state))?.state.journal).toEqual([])
  })
})
