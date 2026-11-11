import { describe, expect, it } from 'vitest'
import { beginTourActivity, applyTourActivityResult } from './activities'
import { advanceDynamicEvents, scheduleWorldEvent } from './events'
import { decodeTourSimulation, encodeTourSimulation } from './persistence'
import { createTourSimulation } from './state'
import { actOnTier5Parcel, startTier5ParcelLoop } from './tier5Loop'

describe('complete Free Tour simulation journey', () => {
  it('explores, reacts, changes activity and returns to an evolved persistent world', () => {
    let world = startTier5ParcelLoop(createTourSimulation({ id: 'journey' }))
    world = actOnTier5Parcel(world, 'HEAR_DISPUTE')
    world = actOnTier5Parcel(world, 'INSPECT_WITH_GYO')
    world = actOnTier5Parcel(world, 'SENSE_WITH_EN')
    world.incidents.push('witness-report')
    world = scheduleWorldEvent(world, {
      id: 'report-rumor',
      kind: 'RUMOR_SPREAD',
      dueAt: 2,
      spaceId: 'tier-5',
      requiresIncident: 'witness-report',
    })
    world = advanceDynamicEvents(world, 3)
    const launched = beginTourActivity(world, 'INVESTIGATION', 'parcel-investigation')
    world = applyTourActivityResult(launched.state, {
      version: 1,
      activityId: 'parcel-investigation',
      completed: true,
      auraDelta: -5,
      learnedFactIds: ['parcel-route'],
      reputationDelta: { hunters: 5 },
      incidentIds: [],
      returnSpaceId: 'tier-5-warehouse',
    })
    const restored = decodeTourSimulation(encodeTourSimulation(world))!
    expect(restored.player.spaceId).toBe('tier-5-warehouse')
    expect(restored.player.knowledge).toEqual(
      expect.arrayContaining(['medical-parcel-missing', 'parcel-aura-trace', 'parcel-route']),
    )
    expect(restored.player.knowledge).toContain('rumor:tier-5')
  })
})
