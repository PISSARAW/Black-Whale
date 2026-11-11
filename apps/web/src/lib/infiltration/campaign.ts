import type { MissionId } from './missions/types'
import type { InfiltrationState } from './state'
import { securityPolicy } from './security'

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

/** Applies remembered operational consequences before the next mission starts. */
export function applyCampaignContext(
  state: InfiltrationState,
  campaign: CampaignState,
): InfiltrationState {
  const coverCompromised = campaign.compromisedRoles.includes(state.cover.role)
  const knownProcedure = campaign.procedures.at(-1)
  const startingLevel =
    coverCompromised || knownProcedure === 'identified'
      ? 'doubt'
      : knownProcedure === 'lockdown'
        ? 'search'
        : 'normal'
  if (!coverCompromised && startingLevel === 'normal') return state

  return {
    ...state,
    coverIntegrity: coverCompromised ? 65 : state.coverIntegrity,
    alertLevel: startingLevel,
    security: securityPolicy(startingLevel, state.extractionSpaceId),
    witnesses: state.witnesses.map((witness) => ({
      ...witness,
      belief: coverCompromised
        ? { ...witness.belief, certainty: 15, identity: 'unknown' }
        : witness.belief,
    })),
  }
}
