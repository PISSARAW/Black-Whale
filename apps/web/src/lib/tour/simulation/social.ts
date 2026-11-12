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

function applyReputation(
  state: TourSimulationV1,
  action: SocialAction,
  witnessed: boolean,
): number {
  const delta = REPUTATION_DELTA[action.kind]
  const effectiveDelta = delta < 0 && !witnessed ? Math.ceil(delta / 3) : delta
  state.reputation[action.factionId] = clampReputation(
    (state.reputation[action.factionId] ?? 0) + effectiveDelta,
  )
  return delta
}

function applyRivalReputation(state: TourSimulationV1, action: SocialAction, delta: number): void {
  if (delta <= 0) return
  for (const rivalId of action.rivalFactionIds ?? []) {
    state.reputation[rivalId] = clampReputation(
      (state.reputation[rivalId] ?? 0) - Math.ceil(delta / 2),
    )
  }
}

function rememberWitnesses(state: TourSimulationV1, witnessIds: readonly string[]): void {
  for (const witnessId of witnessIds) {
    if (!state.witnesses.includes(witnessId)) state.witnesses.push(witnessId)
  }
}

function updatePermission(
  state: TourSimulationV1,
  action: SocialAction,
  input: { delta: number; witnessed: boolean },
): void {
  if (!action.permissionId) return
  if (input.delta > 0 && !state.permissions.includes(action.permissionId)) {
    state.permissions.push(action.permissionId)
  }
  if (input.delta < 0 && input.witnessed) {
    state.permissions = state.permissions.filter((id) => id !== action.permissionId)
  }
}

function recordIncident(state: TourSimulationV1, action: SocialAction, witnessed: boolean): void {
  if (!witnessed) return
  if (!['TRESPASS', 'ASSAULT'].includes(action.kind)) return
  state.incidents.push(`${action.kind.toLowerCase()}:${action.factionId}`)
}

export function resolveSocialAction(
  state: TourSimulationV1,
  action: SocialAction,
): TourSimulationV1 {
  return evolveTourSimulation(state, (draft) => {
    const witnessed = Boolean(action.witnessIds?.length)
    const delta = applyReputation(draft, action, witnessed)
    applyRivalReputation(draft, action, delta)
    rememberWitnesses(draft, action.witnessIds ?? [])
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
