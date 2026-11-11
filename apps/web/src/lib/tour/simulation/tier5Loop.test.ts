import { describe, expect, it } from 'vitest'
import { createTourSimulation } from './state'
import {
  actOnTier5Parcel,
  advanceTier5ParcelLoop,
  startTier5ParcelLoop,
  TIER5_PARCEL_ACTIVITY,
} from './tier5Loop'

describe('playable Tier 5 free-life loop', () => {
  it('supports discovery, Nen investigation, a social choice and persistent return', () => {
    let state = startTier5ParcelLoop(createTourSimulation({ id: 'tier5-loop' }))
    for (const action of [
      'HEAR_DISPUTE',
      'INSPECT_WITH_GYO',
      'SENSE_WITH_EN',
      'LEAVE_TIER',
      'RETURN_TO_TIER5',
      'REPORT_TO_POLICE',
    ] as const)
      state = actOnTier5Parcel(state, action)

    expect(state.activities[TIER5_PARCEL_ACTIVITY]).toMatchObject({
      stage: 'POLICE_RESOLUTION',
      status: 'RESOLVED',
      data: { auraTrace: true, hiddenPresence: true, leftTier: true },
    })
    expect(state.permissions).toContain('tier-3-police-contact')
    expect(state.player.spaceId).toBe('tier-5-warehouse')
  })

  it('continues without the player and can be missed', () => {
    let state = startTier5ParcelLoop(createTourSimulation({ id: 'missed-loop' }))
    state = advanceTier5ParcelLoop(state, 16)
    expect(state.activities[TIER5_PARCEL_ACTIVITY].status).toBe('FAILED')
    expect(state.incidents).toContain('tier5-parcel-disappeared-unobserved')
  })
})
