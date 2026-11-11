import type { InvestigationCaseDefinition } from './definition'

export type AddIssue = (path: string, message: string) => void
export type CheckRefs = (refs: readonly string[], known: Set<string>, path: string) => void

/** What the hypotheses of a case and the conclusions resting on them must satisfy. */
export interface HypothesisChecks {
  definition: InvestigationCaseDefinition
  evidenceIds: Set<string>
  add: AddIssue
  checkRefs: CheckRefs
}

/**
 * A hypothesis that requires nothing is supported by anything: any evidence
 * that does not contradict it would carry it to a verdict. Every hypothesis
 * must rest on at least one piece of evidence.
 */
export function validateHypotheses({ definition, evidenceIds, add, checkRefs }: HypothesisChecks) {
  const hypothesisIds = new Set(definition.content.hypotheses.map((item) => item.id))
  for (const hypothesis of definition.content.hypotheses) {
    if (hypothesis.requiredEvidenceIds.length === 0) {
      add(`hypotheses.${hypothesis.id}.required`, 'at least one required evidence')
    }
    checkRefs(hypothesis.requiredEvidenceIds, evidenceIds, `hypotheses.${hypothesis.id}.required`)
    checkRefs(
      hypothesis.contradictionEvidenceIds,
      evidenceIds,
      `hypotheses.${hypothesis.id}.contradictions`,
    )
  }
  if (!hypothesisIds.has(definition.content.canonicalHypothesisId)) {
    add('canonicalHypothesisId', 'unknown canonical hypothesis')
  }
  if (!hypothesisIds.has(definition.report.requiredHypothesisId)) {
    add('report.requiredHypothesisId', 'unknown report hypothesis')
  }
}
