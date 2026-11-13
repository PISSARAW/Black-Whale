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

function appliedDelta(delta: number, witnessed: boolean): number {
  return delta < 0 && !witnessed ? Math.ceil(delta / 3) : delta
}

function updateRivals(state: TourSimulationV1, action: SocialAction, delta: number): void {
  if (delta <= 0) return
  for (const rivalId of action.rivalFactionIds ?? [])
    state.reputation[rivalId] = clampReputation(
      (state.reputation[rivalId] ?? 0) - Math.ceil(delta / 2),
    )
}

function rememberWitnesses(state: TourSimulationV1, witnessIds: readonly string[]): void {
  for (const witnessId of witnessIds)
    if (!state.witnesses.includes(witnessId)) state.witnesses.push(witnessId)
}

function updatePermission(
  state: TourSimulationV1,
  action: SocialAction,
  outcome: { delta: number; witnessed: boolean },
): void {
  if (!action.permissionId) return
  if (outcome.delta > 0 && !state.permissions.includes(action.permissionId))
    state.permissions.push(action.permissionId)
  if (outcome.delta < 0 && outcome.witnessed)
    state.permissions = state.permissions.filter((id) => id !== action.permissionId)
}

function recordIncident(state: TourSimulationV1, action: SocialAction, witnessed: boolean): void {
  const reportable = action.kind === 'TRESPASS' || action.kind === 'ASSAULT'
  if (witnessed && reportable)
    state.incidents.push(`${action.kind.toLowerCase()}:${action.factionId}`)
}

export function resolveSocialAction(
  state: TourSimulationV1,
  action: SocialAction,
): TourSimulationV1 {
  return evolveTourSimulation(state, (draft) => {
    const witnessIds = action.witnessIds ?? []
    const witnessed = witnessIds.length > 0
    const delta = REPUTATION_DELTA[action.kind]
    draft.reputation[action.factionId] = clampReputation(
      (draft.reputation[action.factionId] ?? 0) + appliedDelta(delta, witnessed),
    )
    updateRivals(draft, action, delta)
    rememberWitnesses(draft, witnessIds)
    updatePermission(draft, action, { delta, witnessed })
    recordIncident(draft, action, witnessed)
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
