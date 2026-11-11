import type { Evidence, Hypothesis, InvestigationCase, Verdict } from './case'
import { freshKnowledgeLedger, recordClaim } from './knowledge'
import { assessConclusion, type ConclusionAssessment } from './reasoning'

/** What the case holds, and how much of it this viewer has actually found. */
export interface EvidenceAssessment {
  hypotheses: Hypothesis[]
  evidence: Evidence[]
  discoveredEvidenceIds: Iterable<string>
  viewerId: string
}

export function assessHypothesesFromEvidence({
  hypotheses,
  evidence,
  discoveredEvidenceIds,
  viewerId,
}: EvidenceAssessment): Record<string, ConclusionAssessment> {
  const discovered = new Set(discoveredEvidenceIds)
  const ledger = evidence
    .filter((item) => discovered.has(item.id))
    .reduce(
      (current, item, index) =>
        recordClaim(current, {
          id: `evidence:${item.id}`,
          propositionId: item.id,
          subjectId: viewerId,
          nature: item.kind === 'TESTIMONY' ? 'testimony' : 'fact',
          supports: item.truthStatus !== 'CONTESTED',
          confidence: confidenceFor(item),
          sourceEvidenceIds: [item.id],
          learnedAt: index,
        }),
      freshKnowledgeLedger(),
    )

  return Object.fromEntries(
    hypotheses.map((hypothesis) => [
      hypothesis.id,
      assessConclusion(
        ledger,
        {
          id: hypothesis.id,
          canonical: false,
          refutedBy: hypothesis.contradictionEvidenceIds,
          paths: [
            {
              id: `${hypothesis.id}:evidence-path`,
              allOf: hypothesis.requiredEvidenceIds,
              weight: 1,
            },
          ],
        },
        viewerId,
      ),
    ]),
  )
}

/**
 * Translates the epistemic runtime's assessment into the stable verdict shape
 * consumed by the playable case, report and localized verdict copy.
 */
export function assessPlayableHypothesis(
  investigation: InvestigationCase,
  hypothesisId: string,
  selectedEvidenceIds: Iterable<string>,
): Verdict {
  const hypothesis = investigation.hypotheses.find((item) => item.id === hypothesisId)
  if (!hypothesis) throw new Error(`Unknown hypothesis: ${hypothesisId}`)

  const selected = new Set(selectedEvidenceIds)
  const assessment = assessHypothesesFromEvidence({
    hypotheses: investigation.hypotheses,
    evidence: investigation.evidence,
    discoveredEvidenceIds: selected,
    viewerId: investigation.investigator,
  })[hypothesisId]
  const evidenceById = new Map(investigation.evidence.map((item) => [item.id, item]))
  const evidenceFor = (ids: string[]) => ids.map((id) => evidenceById.get(id)).filter(isEvidence)
  const supporting = evidenceFor(hypothesis.requiredEvidenceIds.filter((id) => selected.has(id)))
  const missing = evidenceFor(assessment.missingPropositionIds)
  const contradictions = evidenceFor(assessment.conflictingPropositionIds)

  if (assessment.status === 'refuted') {
    return { status: 'contradicted', supporting, missing, contradictions }
  }
  if (
    assessment.status === 'established' &&
    hypothesis.id === investigation.canonicalHypothesisId
  ) {
    return { status: 'solved', supporting, missing, contradictions }
  }
  return {
    status: assessment.status === 'unexplored' ? 'insufficient' : 'plausible',
    supporting,
    missing,
    contradictions,
  }
}

function confidenceFor(evidence: Evidence) {
  if (evidence.truthStatus === 'CONFIRMED') return 0.95
  if (evidence.truthStatus === 'STRONGLY_IMPLIED') return 0.8
  if (evidence.truthStatus === 'DEDUCTION') return 0.7
  return 0.8
}

function isEvidence(evidence: Evidence | undefined): evidence is Evidence {
  return evidence !== undefined
}
