import { evolveTourSimulation, type TourSimulationV1 } from './state'

export type SocialActionKind = 'HELP' | 'TRADE' | 'INTIMIDATE' | 'TRESPASS' | 'ASSAULT'

export interface SocialAction {
  kind: SocialActionKind
  factionId: string
  rivalFactionIds?: string[]
  witnessIds?: string[]
  permissionId?: string
}

const REPUTATION_DELTA: Record<SocialActionKind, number> = {
  HELP: 12,
  TRADE: 6,
  INTIMIDATE: -10,
  TRESPASS: -15,
  ASSAULT: -35,
}

export function resolveSocialAction(
  state: TourSimulationV1,
  action: SocialAction,
): TourSimulationV1 {
  return evolveTourSimulation(state, (draft) => {
    const witnessed = Boolean(action.witnessIds?.length)
    const delta = REPUTATION_DELTA[action.kind]
    draft.reputation[action.factionId] = clampReputation(
      (draft.reputation[action.factionId] ?? 0) + (delta < 0 && !witnessed ? Math.ceil(delta / 3) : delta),
    )
    if (delta > 0) {
      for (const rivalId of action.rivalFactionIds ?? [])
        draft.reputation[rivalId] = clampReputation((draft.reputation[rivalId] ?? 0) - Math.ceil(delta / 2))
    }
    for (const witnessId of action.witnessIds ?? []) {
      if (!draft.witnesses.includes(witnessId)) draft.witnesses.push(witnessId)
    }
    if (action.permissionId) {
      if (delta > 0 && !draft.permissions.includes(action.permissionId))
        draft.permissions.push(action.permissionId)
      if (delta < 0 && witnessed)
        draft.permissions = draft.permissions.filter((id) => id !== action.permissionId)
    }
    if (witnessed && (action.kind === 'TRESPASS' || action.kind === 'ASSAULT'))
      draft.incidents.push(`${action.kind.toLowerCase()}:${action.factionId}`)
  })
}

export function mayEnterRestrictedSpace(
  state: TourSimulationV1,
  input: { permissionId?: string; factionId?: string; minimumReputation?: number },
): boolean {
  if (input.permissionId && state.permissions.includes(input.permissionId)) return true
  if (!input.factionId) return false
  return (state.reputation[input.factionId] ?? 0) >= (input.minimumReputation ?? 25)
}

function clampReputation(value: number): number {
  return Math.max(-100, Math.min(100, value))
}
