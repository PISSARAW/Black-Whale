import type { InvestigationSubject } from './case'

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
  preferredStances: InterviewStance[]
  resistedStances: InterviewStance[]
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
  const trustDelta = clampDelta(stanceTrustDelta(disposition, exchange) + leverage * 4)
  const stressDelta = stressDeltaFor(exchange.stance)
  const trust = clamp(disposition.trust + trustDelta)
  const stress = clamp(disposition.stress + stressDelta)
  const effectiveTrust = trust + leverage * 8 - Math.max(0, stress - 70) / 2
  const cooperation = cooperationAt(effectiveTrust, exchange.requiredTrust)
  const revealedEvidenceIds = evidenceFor(cooperation, exchange)

  return {
    cooperation,
    trustDelta,
    stressDelta,
    revealedEvidenceIds,
    nextDisposition: { ...disposition, trust, stress },
  }
}

function stanceTrustDelta(disposition: WitnessDisposition, exchange: InterviewExchange) {
  const affinity =
    (disposition.preferredStances.includes(exchange.stance) ? 4 : 0) +
    (exchange.preferredStances.includes(exchange.stance) ? 12 : 0)
  const resistance =
    (disposition.resistedStances.includes(exchange.stance) ? 18 : 0) +
    (exchange.resistedStances.includes(exchange.stance) ? 12 : 0)
  return affinity - resistance
}

function stressDeltaFor(stance: InterviewStance) {
  if (stance === 'accusatory') return 18
  if (stance === 'pressing') return 10
  return -4
}

function cooperationAt(
  effectiveTrust: number,
  requiredTrust: number,
): InterviewOutcome['cooperation'] {
  if (effectiveTrust >= requiredTrust + 20) return 'open'
  if (effectiveTrust >= requiredTrust) return 'guarded'
  return 'refused'
}

function evidenceFor(
  cooperation: InterviewOutcome['cooperation'],
  exchange: InterviewExchange,
): string[] {
  if (cooperation === 'open')
    return [...new Set([...exchange.baseEvidenceIds, ...exchange.cooperativeEvidenceIds])]
  if (cooperation === 'guarded') return [...exchange.baseEvidenceIds]
  return []
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function clampDelta(value: number) {
  return Math.max(-25, Math.min(25, Math.round(value)))
}

/**
 * How a witness stands before the first question is put to them.
 *
 * The investigator trusts the investigation; a body trusts nothing and feels
 * nothing; everyone else starts halfway and under some strain. Nobody answers
 * an accusation well. The investigator is recognised by id, never by the role
 * label, which changes with the language.
 */
export function openingDisposition(
  subject: InvestigationSubject,
  investigatorId: string,
): WitnessDisposition {
  const investigator = subject.id === investigatorId
  return {
    subjectId: subject.id,
    trust: subject.isDead ? 0 : investigator ? 80 : 50,
    stress: subject.isDead ? 0 : 35,
    preferredStances: investigator ? ['neutral'] : ['neutral', 'empathetic'],
    resistedStances: ['accusatory'],
  }
}
