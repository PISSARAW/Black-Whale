import type { Evidence, Hypothesis } from './case'
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

function confidenceFor(evidence: Evidence) {
  if (evidence.truthStatus === 'CONFIRMED') return 0.95
  if (evidence.truthStatus === 'STRONGLY_IMPLIED') return 0.8
  if (evidence.truthStatus === 'DEDUCTION') return 0.7
  return 0.8
}
