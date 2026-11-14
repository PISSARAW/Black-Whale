import { describe, expect, it } from 'vitest'
import {
  decodeTourSimulation,
  encodeTourSimulation,
  migrateLegacyTourSimulation,
} from './persistence'
import { createTourSimulation, evolveTourSimulation } from './state'

describe('persistent Tour simulation', () => {
  it('round-trips a versioned world with its consequences', () => {
    const state = evolveTourSimulation(createTourSimulation({ id: 'free-1' }), (draft) => {
      draft.reputation['mafia-xiyu'] = 20
      draft.incidents.push('warehouse-door-forced')
    })
    expect(decodeTourSimulation(encodeTourSimulation(state))).toEqual(state)
    expect(state.revision).toBe(1)
  })

  it('evolves a reactive proxy', () => {
    const reactive = new Proxy(createTourSimulation({ id: 'reactive' }), {})
    const next = evolveTourSimulation(reactive, (draft) => {
      draft.player.spaceId = 'room-1014'
    })

    expect(next.player.spaceId).toBe('room-1014')
    expect(next.revision).toBe(1)
  })

  it('rejects malformed state and migrates the previous minimal save', () => {
    expect(decodeTourSimulation('{"version":99}')).toBeNull()
    expect(migrateLegacyTourSimulation({ room: 'tier-5-warehouse', aura: 43 })).toMatchObject({
      version: 1,
      player: { spaceId: 'tier-5-warehouse', aura: 43 },
    })
  })

  it('adds a safe Nen profile to saves created before affinities existed', () => {
    const legacy = createTourSimulation({ id: 'old-save' }) as ReturnType<
      typeof createTourSimulation
    > & { player: { nenProfile?: unknown } }
    delete legacy.player.nenProfile

    expect(decodeTourSimulation(JSON.stringify(legacy))?.player.nenProfile).toMatchObject({
      version: 1,
      naturalAffinity: 'unknown',
      learnedAbilities: [],
      maintainedEffects: [],
    })
  })
})
