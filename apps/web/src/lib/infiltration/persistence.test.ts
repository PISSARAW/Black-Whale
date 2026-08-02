import { describe, expect, it } from 'vitest'
import { selectMission } from './missions/definitions'
import { decodeSave, encodeSave } from './persistence'
import { initialInfiltrationState } from './state'

const state = initialInfiltrationState({ playerAt: { position: [0, 0], spaceId: 'a' }, objectiveSpaceId: 'b', extractionSpaceId: 'a', witnesses: [], selection: selectMission('courier', 42) })
describe('versioned infiltration saves', () => {
  it('round-trips a V2 mission', () => expect(decodeSave(encodeSave(state, '2026-01-01T00:00:00Z'))?.state).toEqual(state))
  it('rejects corrupt saves and migrates V2', () => {
    expect(decodeSave('{')).toBeNull()
    expect(decodeSave('{"version":1}')).toBeNull()
    const legacy = JSON.parse(encodeSave(state))
    legacy.version = 2
    delete legacy.state.journal
    expect(decodeSave(JSON.stringify(legacy))?.version).toBe(3)
  })
})
