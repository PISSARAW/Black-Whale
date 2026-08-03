import type { MissionId } from './missions/types'

export interface CampaignState {
  version: 1
  completed: MissionId[]
  knownSpaces: string[]
  compromisedRoles: string[]
  procedures: string[]
  sources: string[]
}

export interface MissionConsequences {
  missionId: MissionId
  discoveredSpaces: string[]
  compromisedRole?: string
  learnedProcedure?: string
  recruitedSource?: string
}

export const initialCampaign = (): CampaignState => ({
  version: 1,
  completed: [],
  knownSpaces: [],
  compromisedRoles: [],
  procedures: [],
  sources: [],
})
const unique = <T>(values: T[]) => [...new Set(values)]

export function applyConsequences(
  campaign: CampaignState,
  result: MissionConsequences,
): CampaignState {
  return {
    ...campaign,
    completed: unique([...campaign.completed, result.missionId]),
    knownSpaces: unique([...campaign.knownSpaces, ...result.discoveredSpaces]),
    compromisedRoles: unique([
      ...campaign.compromisedRoles,
      ...(result.compromisedRole ? [result.compromisedRole] : []),
    ]),
    procedures: unique([
      ...campaign.procedures,
      ...(result.learnedProcedure ? [result.learnedProcedure] : []),
    ]),
    sources: unique([
      ...campaign.sources,
      ...(result.recruitedSource ? [result.recruitedSource] : []),
    ]),
  }
}
