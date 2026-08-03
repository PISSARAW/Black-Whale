// Mirrors the domain vocabulary while keeping this client-only vertical slice
// runnable before the workspace packages have been built.
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
  requiredEvidenceIds: string[]
  evidenceIds: string[]
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
  objectives: { id: string; label: string; requiredEvidenceIds: string[] }[]
}

export interface Verdict {
  status: 'insufficient' | 'plausible' | 'contradicted' | 'solved'
  title: string
  summary: string
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
    return {
      status: 'contradicted',
      title: 'Hypothèse contredite',
      summary: `${contradictions.length} élément${contradictions.length > 1 ? 's' : ''} résiste à cette reconstruction.`,
      supporting,
      missing,
      contradictions,
    }
  }

  if (missing.length > 0) {
    return {
      status: supporting.length > 0 ? 'plausible' : 'insufficient',
      title: supporting.length > 0 ? 'Piste plausible, preuve incomplète' : 'Dossier insuffisant',
      summary: `Il manque ${missing.length} élément${missing.length > 1 ? 's' : ''} nécessaire${missing.length > 1 ? 's' : ''} pour soutenir cette conclusion.`,
      supporting,
      missing,
      contradictions,
    }
  }

  const isCanonical = hypothesis.id === investigation.canonicalHypothesisId
  return {
    status: isCanonical ? 'solved' : 'plausible',
    title: isCanonical ? 'Conclusion démontrée' : 'Conclusion possible',
    summary: isCanonical
      ? "Les faits établissent une attaque de Nen matérialisée et commandée à distance, mais l'identité de l'utilisateur reste inconnue à ce stade."
      : 'Cette hypothèse est compatible avec les éléments choisis, sans constituer la meilleure explication du dossier.',
    supporting,
    missing,
    contradictions,
  }
}
