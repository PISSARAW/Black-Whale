import type { InvestigationCaseDefinition } from './definition'
import type { AddIssue, CheckRefs } from './validateHypotheses'

/** What a case's Hatsu rules must satisfy. */
export interface HatsuRuleChecks {
  definition: InvestigationCaseDefinition
  evidenceIds: Set<string>
  subjectIds: Set<string>
  add: AddIssue
  checkRefs: CheckRefs
}

/**
 * A rule whose outcome is `limited` or `forbidden` says the technique cannot
 * establish anything here. It must not list evidence: the resolver would
 * still hand it to the dossier, and the finding would contradict the file.
 */
export function validateHatsuRules({
  definition,
  evidenceIds,
  subjectIds,
  add,
  checkRefs,
}: HatsuRuleChecks) {
  for (const rule of definition.hatsuRules) {
    checkRefs(rule.subjectIds, subjectIds, `hatsuRules.${rule.id}.subjects`)
    checkRefs(rule.evidenceIds, evidenceIds, `hatsuRules.${rule.id}.evidence`)
    checkRefs(rule.countermeasureEvidenceIds, evidenceIds, `hatsuRules.${rule.id}.countermeasures`)
    if (rule.auraCost < 0) add(`hatsuRules.${rule.id}.auraCost`, 'must be positive')
    const establishesNothing = rule.outcome === 'limited' || rule.outcome === 'forbidden'
    if (establishesNothing && rule.evidenceIds.length > 0) {
      add(`hatsuRules.${rule.id}.evidence`, `a ${rule.outcome} rule grants no evidence`)
    }
  }
}
