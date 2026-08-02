export type InterviewStance = 'neutral' | 'empathetic' | 'pressing' | 'accusatory'

export interface WitnessDisposition {
  subjectId: string
  trust: number
  stress: number
  preferredStances: InterviewStance[]
  resistedStances: InterviewStance[]
}

export interface InterviewExchange {
  questionId: string
  stance: InterviewStance
  leverageEvidenceIds: string[]
  requiredTrust: number
  baseEvidenceIds: string[]
  cooperativeEvidenceIds: string[]
}

export interface InterviewOutcome {
  cooperation: 'refused' | 'guarded' | 'open'
  trustDelta: number
  stressDelta: number
  revealedEvidenceIds: string[]
  nextDisposition: WitnessDisposition
}

export function resolveInterview(
  disposition: WitnessDisposition,
  exchange: InterviewExchange,
  discoveredEvidenceIds: Iterable<string>,
): InterviewOutcome {
  const discovered = new Set(discoveredEvidenceIds)
  const leverage = exchange.leverageEvidenceIds.filter((id) => discovered.has(id)).length
  const preferred = disposition.preferredStances.includes(exchange.stance)
  const resisted = disposition.resistedStances.includes(exchange.stance)
  const trustDelta = clampDelta((preferred ? 12 : 0) - (resisted ? 18 : 0) + leverage * 4)
  const stressDelta = clampDelta(
    exchange.stance === 'accusatory' ? 18 : exchange.stance === 'pressing' ? 10 : -4,
  )
  const trust = clamp(disposition.trust + trustDelta)
  const stress = clamp(disposition.stress + stressDelta)
  const effectiveTrust = trust + leverage * 8 - Math.max(0, stress - 70) / 2
  const cooperation =
    effectiveTrust >= exchange.requiredTrust + 20
      ? 'open'
      : effectiveTrust >= exchange.requiredTrust
        ? 'guarded'
        : 'refused'
  const revealedEvidenceIds =
    cooperation === 'open'
      ? [...new Set([...exchange.baseEvidenceIds, ...exchange.cooperativeEvidenceIds])]
      : cooperation === 'guarded'
        ? [...exchange.baseEvidenceIds]
        : []

  return {
    cooperation,
    trustDelta,
    stressDelta,
    revealedEvidenceIds,
    nextDisposition: { ...disposition, trust, stress },
  }
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function clampDelta(value: number) {
  return Math.max(-25, Math.min(25, Math.round(value)))
}
