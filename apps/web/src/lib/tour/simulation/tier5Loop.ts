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

type ParcelActivity = TourSimulationV1['activities'][string]
type ParcelActionHandler = (state: TourSimulationV1, activity: ParcelActivity) => void

const PARCEL_ACTIONS: Record<Tier5ParcelAction, ParcelActionHandler> = {
  HEAR_DISPUTE(state, activity) {
    if (activity.stage !== 'UNNOTICED') return
    activity.stage = 'INVESTIGATING'
    activity.status = 'ACTIVE'
    state.player.knowledge.push('medical-parcel-missing')
  },
  INSPECT_WITH_GYO(state, activity) {
    if (activity.stage !== 'INVESTIGATING') return
    activity.data.auraTrace = true
    state.player.knowledge.push('parcel-aura-trace')
  },
  SENSE_WITH_EN(state, activity) {
    if (activity.data.auraTrace !== true) return
    activity.stage = 'CONTACT'
    activity.data.hiddenPresence = true
    state.player.knowledge.push('presence-behind-warehouse-wall')
  },
  ACCEPT_MAFIA_OFFER(_state, activity) {
    if (activity.stage === 'CONTACT') activity.stage = 'MAFIA_CONTRACT'
  },
  REPORT_TO_POLICE(state, activity) {
    if (activity.stage !== 'CONTACT') return
    activity.stage = 'POLICE_RESOLUTION'
    activity.status = 'RESOLVED'
    state.permissions.push('tier-3-police-contact')
  },
  RETURN_TO_OWNER(state, activity) {
    if (activity.stage !== 'CONTACT') return
    activity.stage = 'OWNER_RESOLUTION'
    activity.status = 'RESOLVED'
    state.permissions.push('tier-5-medical-supply-access')
  },
  LEAVE_TIER(state, activity) {
    activity.data.leftTier = true
    state.player.spaceId = 'tier-3-central-police-station'
  },
  RETURN_TO_TIER5(state) {
    state.player.spaceId = 'tier-5-warehouse'
  },
}

function applySocialConsequence(
  state: TourSimulationV1,
  action: Tier5ParcelAction,
  previousStage: string,
): TourSimulationV1 {
  if (previousStage !== 'CONTACT') return state
  if (action === 'ACCEPT_MAFIA_OFFER')
    return resolveSocialAction(state, {
      kind: 'HELP',
      factionId: 'mafia-xiyu',
      rivalFactionIds: ['royal-army'],
    })
  if (action === 'REPORT_TO_POLICE')
    return resolveSocialAction(state, { kind: 'HELP', factionId: 'royal-army' })
  return state
}

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
  const previousStage = activity.stage
  const next = evolveTourSimulation(state, (draft) => {
    const current = draft.activities[TIER5_PARCEL_ACTIVITY]
    PARCEL_ACTIONS[action](draft, current)
  })
  return applySocialConsequence(next, action, previousStage)
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
