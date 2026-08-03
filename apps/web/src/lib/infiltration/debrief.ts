import type { InfiltrationState } from './state'

export type InformationVerdict = 'true' | 'false' | 'uncertain'
export interface DebriefAxis {
  material: 'complete' | 'incomplete'
  information: InformationVerdict
  cover: 'intact' | 'compromised'
}
export interface CausalStep {
  at: number
  actor: string
  kind: 'trace' | 'report' | 'claim' | 'action' | 'alert'
  detail: string
  sourceId?: string
}

export function debriefAxes(state: InfiltrationState): DebriefAxis {
  const required = state.objectives.filter(
    (objective) => objective.required && objective.kind !== 'extract',
  )
  const material = required.every(
    (objective) => objective.state === 'believed' || objective.state === 'confirmed',
  )
    ? 'complete'
    : 'incomplete'
  const informed = state.objectives.filter((objective) => objective.kind === 'identify')
  const information =
    informed.length === 0 || informed.some((objective) => objective.state === 'confirmed')
      ? 'true'
      : informed.some((objective) => objective.state === 'invalidated')
        ? 'false'
        : 'uncertain'
  return {
    material,
    information,
    cover:
      state.alertLevel === 'identified' || state.coverIntegrity === 0 ? 'compromised' : 'intact',
  }
}

export function causalTimeline(state: InfiltrationState): CausalStep[] {
  return [
    ...state.traces.map((trace) => ({
      at: trace.at ?? 0,
      actor: trace.allegedAuthor ?? 'unknown',
      kind: 'trace' as const,
      detail: `${trace.kind}:${trace.spaceId}`,
    })),
    ...state.claims.map((claim) => ({
      at: claim.at,
      actor: 'player',
      kind: 'claim' as const,
      detail: claim.answer,
    })),
    ...state.reports.map((report) => ({
      at: report.at,
      actor: report.witnessId,
      kind: 'report' as const,
      detail: `${report.certainty}`,
    })),
    ...state.journal.map((event) => ({
      at: event.at,
      actor: event.actor,
      kind: event.type === 'ALERT_CHANGED' ? ('alert' as const) : ('action' as const),
      detail: event.payload ?? event.type,
      sourceId: event.sourceId,
    })),
  ].sort((a, b) => a.at - b.at)
}

export function witnessPerspective(
  state: InfiltrationState,
  witnessId: keyof InfiltrationState['memories'],
) {
  return state.memories[witnessId].observations.map((observation) => ({
    at: observation.at,
    perceived: observation.value,
    certainty: observation.certainty,
    sourceId: observation.sourceId ?? observation.id,
  }))
}
