import type { HuntTerrainId } from './arena'
import type { HuntTrace } from './traces'

export type HuntFactionId = 'royal-security' | 'mafia' | 'passengers'

export interface HuntWitness {
  id: string
  factionId: HuntFactionId
  terrain: HuntTerrainId | null
  spaceId: string
  reliability: number
}

export interface WitnessReport {
  witnessId: string
  factionId: HuntFactionId
  traceKind: HuntTrace['kind']
  terrain: HuntTerrainId | null
  spaceId: string
  observedAt: number
  confidence: number
}

export interface HuntSocialState {
  witnesses: HuntWitness[]
  alertByFaction: Record<HuntFactionId, number>
  reports: WitnessReport[]
}

export function initialHuntSocial(witnesses: readonly HuntWitness[] = []): HuntSocialState {
  return {
    witnesses: witnesses.map((witness) => ({ ...witness })),
    alertByFaction: { 'royal-security': 0, mafia: 0, passengers: 0 },
    reports: [],
  }
}

export function reactToTrace(state: HuntSocialState, trace: HuntTrace): HuntSocialState {
  const observers = state.witnesses.filter(
    (witness) => witness.terrain === trace.terrain && witness.spaceId === trace.spaceId,
  )
  if (observers.length === 0) return state
  const reports = observers.map((witness): WitnessReport => ({
    witnessId: witness.id,
    factionId: witness.factionId,
    traceKind: trace.kind,
    terrain: trace.terrain,
    spaceId: trace.spaceId,
    observedAt: trace.createdAt,
    confidence: Math.max(0, Math.min(1, witness.reliability * trace.strength)),
  }))
  const alertByFaction = { ...state.alertByFaction }
  for (const report of reports) {
    const severity = trace.kind === 'trap' ? 3 : trace.kind === 'aura' ? 2 : 0.25
    alertByFaction[report.factionId] = Math.min(
      10,
      alertByFaction[report.factionId] + severity * report.confidence,
    )
  }
  return { ...state, alertByFaction, reports: [...state.reports, ...reports].slice(-64) }
}
