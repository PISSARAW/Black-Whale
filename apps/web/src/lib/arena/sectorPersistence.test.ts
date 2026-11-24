import { describe, expect, it } from 'vitest'
import { initialCombatState } from '../combat/types'
import { TIER5_PARCEL_ACTIVITY } from '../tour/simulation/tier5Loop'
import {
  captureArenaSector,
  connectArenaSectorToTour,
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
    snapshot.opponentMemory.zones.head = 4
    snapshot.opponentMemory.hypothesis = {
      preferredZone: 'head',
      confidence: 1,
      concealedAttacks: 0,
      knownHatsuIds: ['judgment-chain'],
    }

    const restored = restoreArenaSector(combat(), parseArenaSector(serializeArenaSector(snapshot)))

    expect(restored.environment).toMatchObject({
      context: 'CLANDESTINE',
      witnesses: 3,
      securityAlert: 2,
    })
    expect(restored.physicalObjects.crate).toEqual(snapshot.physicalObjects.crate)
    expect(restored.opponentMemory).toMatchObject({
      observedEventAt: null,
      zones: { head: 4 },
      hypothesis: { preferredZone: 'head', knownHatsuIds: ['judgment-chain'] },
    })
    expect(restored.environment.interventionIn).toBe(8)
  })

  it('adopts the active Tour world and returns combat aura and incidents to it', () => {
    const snapshot = createArenaSectorSnapshot()
    snapshot.simulation.incidents.push('arena-history')
    const tour = createArenaSectorSnapshot().simulation
    tour.id = 'free-life:tour'
    tour.mode = 'FREE_LIFE'
    tour.player.aura = 64
    tour.incidents.push('tour-history')

    const connected = connectArenaSectorToTour(snapshot, tour)
    const restored = restoreArenaSector(combat(), connected)
    restored.player.aura = 41
    restored.outcome = 'won'
    const captured = captureArenaSector(restored, connected, 'tier-5-transverse-corridor')

    expect(captured.simulation.mode).toBe('FREE_LIFE')
    expect(captured.simulation.incidents).toEqual(
      expect.arrayContaining(['arena-history', 'tour-history', 'arena-duel:1:won']),
    )
    expect(captured.simulation.player).toMatchObject({
      aura: 41,
      spaceId: 'tier-5-transverse-corridor',
    })
  })

  it('records whether the fighter controlled, exposed, or lost the sector', () => {
    const previous = createArenaSectorSnapshot()
    const controlled = combat()
    controlled.outcome = 'won'

    const first = captureArenaSector(controlled, previous, 'tier-5-warehouse')
    expect(first.lastResolution).toBe('controlled')

    const exposed = combat()
    exposed.outcome = 'won'
    exposed.environment.witnesses = 1
    const second = captureArenaSector(exposed, first, 'tier-5-warehouse')
    expect(second.lastResolution).toBe('exposed')

    const intercepted = combat()
    intercepted.outcome = 'lost'
    intercepted.environment.intervened = true
    const third = captureArenaSector(intercepted, second, 'tier-5-warehouse')
    expect(third.lastResolution).toBe('intercepted')
    expect(third.simulation.incidents).toContain('arena-sector:3:intercepted')
  })
})
