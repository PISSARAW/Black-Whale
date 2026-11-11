import { resolveSocialAction } from './social'
import { evolveTourSimulation, type TourSimulationV1 } from './state'

export const TIER5_PARCEL_ACTIVITY = 'tier5-missing-medical-parcel'

export type Tier5ParcelAction =
  | 'HEAR_DISPUTE'
  | 'INSPECT_WITH_GYO'
  | 'SENSE_WITH_EN'
  | 'ACCEPT_MAFIA_OFFER'
  | 'REPORT_TO_POLICE'
  | 'RETURN_TO_OWNER'
  | 'LEAVE_TIER'
  | 'RETURN_TO_TIER5'

export function startTier5ParcelLoop(state: TourSimulationV1): TourSimulationV1 {
  return evolveTourSimulation(state, (draft) => {
    draft.activities[TIER5_PARCEL_ACTIVITY] ??= {
      stage: 'UNNOTICED',
      status: 'AVAILABLE',
      data: { parcelSpaceId: 'tier-5-warehouse', elapsed: 0, leftTier: false },
    }
    draft.actors['warehouse-worker'] ??= {
      spaceId: 'tier-5-warehouse',
      objective: 'find-medical-parcel',
      memory: [],
      nextDecisionAt: 0,
    }
  })
}

export function actOnTier5Parcel(
  state: TourSimulationV1,
  action: Tier5ParcelAction,
): TourSimulationV1 {
  const activity = state.activities[TIER5_PARCEL_ACTIVITY]
  if (!activity || activity.status === 'RESOLVED' || activity.status === 'FAILED') return state
  let next = evolveTourSimulation(state, (draft) => {
    const current = draft.activities[TIER5_PARCEL_ACTIVITY]
    if (action === 'HEAR_DISPUTE' && current.stage === 'UNNOTICED') {
      current.stage = 'INVESTIGATING'
      current.status = 'ACTIVE'
      draft.player.knowledge.push('medical-parcel-missing')
    }
    if (action === 'INSPECT_WITH_GYO' && current.stage === 'INVESTIGATING') {
      current.data.auraTrace = true
      draft.player.knowledge.push('parcel-aura-trace')
    }
    if (action === 'SENSE_WITH_EN' && current.data.auraTrace === true) {
      current.stage = 'CONTACT'
      current.data.hiddenPresence = true
      draft.player.knowledge.push('presence-behind-warehouse-wall')
    }
    if (action === 'LEAVE_TIER') {
      current.data.leftTier = true
      draft.player.spaceId = 'tier-3-central-police-station'
    }
    if (action === 'RETURN_TO_TIER5') draft.player.spaceId = 'tier-5-warehouse'
    if (action === 'ACCEPT_MAFIA_OFFER' && current.stage === 'CONTACT')
      current.stage = 'MAFIA_CONTRACT'
    if (action === 'REPORT_TO_POLICE' && current.stage === 'CONTACT') {
      current.stage = 'POLICE_RESOLUTION'
      current.status = 'RESOLVED'
      draft.permissions.push('tier-3-police-contact')
    }
    if (action === 'RETURN_TO_OWNER' && current.stage === 'CONTACT') {
      current.stage = 'OWNER_RESOLUTION'
      current.status = 'RESOLVED'
      draft.permissions.push('tier-5-medical-supply-access')
    }
  })
  if (action === 'ACCEPT_MAFIA_OFFER' && activity.stage === 'CONTACT')
    next = resolveSocialAction(next, {
      kind: 'HELP',
      factionId: 'mafia-xiyu',
      rivalFactionIds: ['royal-army'],
    })
  if (action === 'REPORT_TO_POLICE' && activity.stage === 'CONTACT')
    next = resolveSocialAction(next, { kind: 'HELP', factionId: 'royal-army' })
  return next
}

export function advanceTier5ParcelLoop(state: TourSimulationV1, dt: number): TourSimulationV1 {
  return evolveTourSimulation(state, (draft) => {
    const activity = draft.activities[TIER5_PARCEL_ACTIVITY]
    if (!activity || activity.status !== 'AVAILABLE') return
    activity.data.elapsed = Number(activity.data.elapsed) + Math.max(0, dt)
    if (Number(activity.data.elapsed) >= 15) {
      activity.status = 'FAILED'
      activity.stage = 'PARCEL_MOVED'
      draft.incidents.push('tier5-parcel-disappeared-unobserved')
    }
  })
}
