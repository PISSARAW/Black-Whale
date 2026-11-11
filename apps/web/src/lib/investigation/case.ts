// Mirrors the domain vocabulary while keeping this client-only vertical slice
// runnable before the workspace packages have been built.
import type { InterviewStance } from './interview'

type AcquisitionMethod =
  | 'DIRECT_OBSERVATION'
  | 'TOLD_BY_OTHER'
  | 'DEDUCTION'
  | 'NEN_ABILITY'
  | 'DOCUMENT'
  | 'RUMOR'
  | 'UNKNOWN'
type TruthStatus = 'CONFIRMED' | 'STRONGLY_IMPLIED' | 'DEDUCTION' | 'CONTESTED'

export type EvidenceKind = 'OBSERVATION' | 'TESTIMONY' | 'NEN' | 'TIMELINE'
export type InvestigationTab = 'evidence' | 'people' | 'timeline' | 'deduction'

export interface Evidence {
  id: string
  title: string
  claim: string
  source: string
  chapter: number
  kind: EvidenceKind
  method: AcquisitionMethod
  truthStatus: TruthStatus
  reliability: 'TRUSTED' | 'UNVERIFIED' | 'DECEPTIVE' | 'UNKNOWN'
  subjectId: string
  canonicalRefs: CanonicalReference[]
}

export interface CanonicalReference {
  type: 'EVENT' | 'CHAPTER'
  id: string
  label: string
  href: string
}

export interface InvestigationSubject {
  id: string
  name: string
  role: string
  status: string
  color: number
  posOffset: readonly [number, number]
  isDead?: boolean
  dialogue: string
  evidenceIds: string[]
  questions: InvestigationQuestion[]
}

export interface InvestigationQuestion {
  id: string
  prompt: string
  response: string
  cooperativeResponse: string
  preferredStances: InterviewStance[]
  resistedStances: InterviewStance[]
  requiredTrust: number
  requiredEvidenceIds: string[]
  evidenceIds: string[]
  cooperativeEvidenceIds: string[]
}

export interface Hypothesis {
  id: string
  label: string
  explanation: string
  requiredEvidenceIds: string[]
  contradictionEvidenceIds: string[]
}

export interface InvestigationCase {
  id: string
  title: string
  subtitle: string
  location: string
  chapter: number
  objective: string
  investigator: string
  subjects: InvestigationSubject[]
  evidence: Evidence[]
  hypotheses: Hypothesis[]
  canonicalHypothesisId: string
  /** What the verdict says once the canonical hypothesis is fully supported. */
  solvedSummary: string
  objectives: { id: string; label: string; requiredEvidenceIds: string[] }[]
}

/**
 * What the evidence does to a hypothesis. Facts only: the words for it are
 * the visitor's language, and `describeVerdict` in `verdictCopy` supplies them.
 */
export interface Verdict {
  status: 'insufficient' | 'plausible' | 'contradicted' | 'solved'
  supporting: Evidence[]
  missing: Evidence[]
  contradictions: Evidence[]
}

export { room1014Case } from './cases/room-1014'

export function evaluateHypothesis(
  investigation: InvestigationCase,
  hypothesisId: string,
  selectedEvidenceIds: Iterable<string>,
): Verdict {
  const hypothesis = investigation.hypotheses.find((item) => item.id === hypothesisId)
  if (!hypothesis) throw new Error(`Unknown hypothesis: ${hypothesisId}`)

  const selected = new Set(selectedEvidenceIds)
  const evidenceById = new Map(investigation.evidence.map((item) => [item.id, item]))
  const supporting = hypothesis.requiredEvidenceIds
    .filter((id) => selected.has(id))
    .map((id) => evidenceById.get(id)!)
  const missing = hypothesis.requiredEvidenceIds
    .filter((id) => !selected.has(id))
    .map((id) => evidenceById.get(id)!)
  const contradictions = hypothesis.contradictionEvidenceIds
    .filter((id) => selected.has(id))
    .map((id) => evidenceById.get(id)!)

  if (contradictions.length > 0) {
    return { status: 'contradicted', supporting, missing, contradictions }
  }
  if (missing.length > 0) {
    const status = supporting.length > 0 ? 'plausible' : 'insufficient'
    return { status, supporting, missing, contradictions }
  }
  const status = hypothesis.id === investigation.canonicalHypothesisId ? 'solved' : 'plausible'
  return { status, supporting, missing, contradictions }
}
