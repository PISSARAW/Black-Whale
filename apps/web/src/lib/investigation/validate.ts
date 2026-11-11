import { INVESTIGATION_SCHEMA_VERSION, type InvestigationCaseDefinition } from './definition'
import type { InvestigationQuestion } from './case'
import { validateHypotheses, type AddIssue } from './validateHypotheses'
import { validateHatsuRules } from './validateHatsuRules'

export interface ValidationIssue {
  path: string
  message: string
}

export function validateCaseDefinition(definition: InvestigationCaseDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const add = (path: string, message: string) => issues.push({ path, message })
  const checkRefs = referenceChecker(add)
  const evidenceIds = new Set(definition.content.evidence.map((item) => item.id))
  const subjectIds = new Set(definition.content.subjects.map((item) => item.id))
  const questionChecks = { evidenceIds, add, checkRefs }

  if (definition.schemaVersion !== INVESTIGATION_SCHEMA_VERSION) {
    add('schemaVersion', `expected ${INVESTIGATION_SCHEMA_VERSION}`)
  }
  duplicates(definition.content.evidence.map((item) => item.id)).forEach((id) =>
    add(`evidence.${id}`, 'duplicate evidence id'),
  )
  duplicates(definition.content.subjects.map((item) => item.id)).forEach((id) =>
    add(`subjects.${id}`, 'duplicate subject id'),
  )

  for (const evidence of definition.content.evidence) {
    if (!subjectIds.has(evidence.subjectId))
      add(`evidence.${evidence.id}.subjectId`, 'unknown subject')
    if (evidence.canonicalRefs.length === 0)
      add(`evidence.${evidence.id}.canonicalRefs`, 'source required')
  }
  for (const subject of definition.content.subjects) {
    checkRefs(subject.evidenceIds, evidenceIds, `subjects.${subject.id}.evidenceIds`)
    for (const question of subject.questions) {
      validateQuestion(question, questionChecks)
    }
  }
  for (const objective of definition.content.objectives) {
    checkRefs(objective.requiredEvidenceIds, evidenceIds, `objectives.${objective.id}`)
  }
  validateHypotheses({ definition, evidenceIds, add, checkRefs })
  validateConclusion(definition, add, checkRefs)
  for (const confrontation of definition.confrontations) {
    checkRefs(confrontation.subjectIds, subjectIds, `confrontations.${confrontation.id}.subjects`)
    checkRefs(
      confrontation.requiredEvidenceIds,
      evidenceIds,
      `confrontations.${confrontation.id}.required`,
    )
    checkRefs(confrontation.evidenceIds, evidenceIds, `confrontations.${confrontation.id}.evidence`)
  }
  validateHatsuRules({ definition, evidenceIds, subjectIds, add, checkRefs })
  return issues
}

function validateConclusion(
  definition: InvestigationCaseDefinition,
  add: AddIssue,
  checkRefs: ReturnType<typeof referenceChecker>,
) {
  const hypothesisIds = new Set(definition.content.hypotheses.map((item) => item.id))
  if (definition.conclusion.dimensions.length === 0) add('conclusion', 'dimension required')
  for (const dimension of definition.conclusion.dimensions) {
    if (dimension.options.length === 0) add(`conclusion.${dimension.id}`, 'option required')
    for (const option of dimension.options) {
      checkRefs(option.hypothesisIds, hypothesisIds, `conclusion.${dimension.id}.${option.id}`)
    }
  }
}

function validateQuestion(
  question: InvestigationQuestion,
  {
    evidenceIds,
    add,
    checkRefs,
  }: {
    evidenceIds: Set<string>
    add: AddIssue
    checkRefs: ReturnType<typeof referenceChecker>
  },
) {
  checkRefs(question.requiredEvidenceIds, evidenceIds, `questions.${question.id}.required`)
  checkRefs(question.evidenceIds, evidenceIds, `questions.${question.id}.evidence`)
  checkRefs(
    question.cooperativeEvidenceIds,
    evidenceIds,
    `questions.${question.id}.cooperativeEvidence`,
  )
  if (question.preferredStances.length === 0)
    add(`questions.${question.id}.preferredStances`, 'at least one useful approach is required')
  if (question.requiredTrust < 0 || question.requiredTrust > 100)
    add(`questions.${question.id}.requiredTrust`, 'must be between 0 and 100')
}

export function assertValidCaseDefinition(
  definition: InvestigationCaseDefinition,
): InvestigationCaseDefinition {
  const issues = validateCaseDefinition(definition)
  if (issues.length) {
    throw new Error(
      `Invalid investigation case ${definition.metadata.slug}: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')}`,
    )
  }
  return definition
}

/**
 * Bound to a collector once rather than handed one at each of the fourteen call
 * sites: the collector is the same object every time, and passing it around was
 * the only reason this took four arguments.
 */
function referenceChecker(add: AddIssue) {
  return (refs: readonly string[], known: Set<string>, path: string) => {
    for (const id of refs) if (!known.has(id)) add(`${path}.${id}`, 'unknown reference')
  }
}

function duplicates(ids: string[]) {
  const seen = new Set<string>()
  return new Set(ids.filter((id) => (seen.has(id) ? true : !seen.add(id))))
}
