import { describe, expect, it } from 'vitest'
import { initialCombatState } from '../combat/types'
import { TIER5_PARCEL_ACTIVITY } from '../tour/simulation/tier5Loop'
import {
  captureArenaSector,
  createArenaSectorSnapshot,
  parseArenaSector,
  restoreArenaSector,
  serializeArenaSector,
} from './sectorPersistence'

function combat() {
  return initialCombatState({
    playerAt: [0, 0],
    opponentAt: [2, 0],
    terrain: {
      id: 'tier-5-warehouse',
      footprint: [
        [-10, -10],
        [10, -10],
        [10, 10],
        [-10, 10],
      ],
      walls: [],
    },
  })
}

describe('persistent Arena sector', () => {
  it('turns a witnessed duel into Tour knowledge and a parcel-loop lead', () => {
    const state = combat()
    state.clock = 12
    state.outcome = 'won'
    state.environment.witnesses = 2
    state.environment.securityAlert = 1
    state.physicalObjects.crate = { id: 'crate', position: [3, 4], storedBy: null }

    const snapshot = captureArenaSector(state, createArenaSectorSnapshot(), 'tier-5-warehouse')

    expect(snapshot.fights).toBe(1)
    expect(snapshot.simulation.witnesses).toContain('warehouse-worker')
    expect(snapshot.simulation.activities[TIER5_PARCEL_ACTIVITY].stage).toBe('INVESTIGATING')
    expect(snapshot.simulation.incidents).toContain('arena-scenery-altered:1')
  })

  it('restores physical and social consequences into the next fight', () => {
    const snapshot = createArenaSectorSnapshot()
    snapshot.witnesses = 3
    snapshot.securityAlert = 2
    snapshot.physicalObjects.crate = { id: 'crate', position: [7, 2], storedBy: 'player' }

    const restored = restoreArenaSector(combat(), parseArenaSector(serializeArenaSector(snapshot)))

    expect(restored.environment).toMatchObject({
      context: 'CLANDESTINE',
      witnesses: 3,
      securityAlert: 2,
    })
    expect(restored.physicalObjects.crate).toEqual(snapshot.physicalObjects.crate)
  })
})
