import type { Arena } from '../hunt/arena'
import type { NavGraph } from '../hunt/navmesh'
import { applyCampaignContext, type CampaignState } from './campaign'
import { selectMission } from './missions/definitions'
import { missionSetup } from './missions/setup'
import type { MissionId } from './missions/types'
import { initialInfiltrationState } from './state'

interface MissionGameOptions {
  missionId: MissionId
  seed: number
  arena: Arena
  graph: NavGraph
  campaign: CampaignState
}

/** Shared initialization for a fresh mission and an explicit restart. */
export function createMissionGame(options: MissionGameOptions) {
  const selection = selectMission(options.missionId, options.seed)
  return applyCampaignContext(
    initialInfiltrationState(
      missionSetup({ selection, arena: options.arena, graph: options.graph }),
    ),
    options.campaign,
  )
}
