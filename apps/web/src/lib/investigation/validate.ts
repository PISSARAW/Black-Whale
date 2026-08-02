import { INVESTIGATION_SCHEMA_VERSION, type InvestigationCaseDefinition } from './definition'

export interface ValidationIssue {
  path: string
  message: string
}

export function validateCaseDefinition(definition: InvestigationCaseDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const add = (path: string, message: string) => issues.push({ path, message })
  const evidenceIds = new Set(definition.content.evidence.map((item) => item.id))
  const subjectIds = new Set(definition.content.subjects.map((item) => item.id))
  const hypothesisIds = new Set(definition.content.hypotheses.map((item) => item.id))

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
    checkRefs(subject.evidenceIds, evidenceIds, `subjects.${subject.id}.evidenceIds`, add)
    for (const question of subject.questions) {
      checkRefs(question.requiredEvidenceIds, evidenceIds, `questions.${question.id}.required`, add)
      checkRefs(question.evidenceIds, evidenceIds, `questions.${question.id}.evidence`, add)
    }
  }
  for (const objective of definition.content.objectives) {
    checkRefs(objective.requiredEvidenceIds, evidenceIds, `objectives.${objective.id}`, add)
  }
  for (const hypothesis of definition.content.hypotheses) {
    checkRefs(
      hypothesis.requiredEvidenceIds,
      evidenceIds,
      `hypotheses.${hypothesis.id}.required`,
      add,
    )
    checkRefs(
      hypothesis.contradictionEvidenceIds,
      evidenceIds,
      `hypotheses.${hypothesis.id}.contradictions`,
      add,
    )
  }
  if (!hypothesisIds.has(definition.content.canonicalHypothesisId)) {
    add('canonicalHypothesisId', 'unknown canonical hypothesis')
  }
  if (!hypothesisIds.has(definition.report.requiredHypothesisId)) {
    add('report.requiredHypothesisId', 'unknown report hypothesis')
  }
  for (const confrontation of definition.confrontations) {
    checkRefs(
      confrontation.subjectIds,
      subjectIds,
      `confrontations.${confrontation.id}.subjects`,
      add,
    )
    checkRefs(
      confrontation.requiredEvidenceIds,
      evidenceIds,
      `confrontations.${confrontation.id}.required`,
      add,
    )
    checkRefs(
      confrontation.evidenceIds,
      evidenceIds,
      `confrontations.${confrontation.id}.evidence`,
      add,
    )
  }
  for (const rule of definition.hatsuRules) {
    checkRefs(rule.subjectIds, subjectIds, `hatsuRules.${rule.id}.subjects`, add)
    checkRefs(rule.evidenceIds, evidenceIds, `hatsuRules.${rule.id}.evidence`, add)
  }
  return issues
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

function checkRefs(
  refs: readonly string[],
  known: Set<string>,
  path: string,
  add: (path: string, message: string) => void,
) {
  for (const id of refs) if (!known.has(id)) add(`${path}.${id}`, 'unknown reference')
}

function duplicates(ids: string[]) {
  const seen = new Set<string>()
  return new Set(ids.filter((id) => (seen.has(id) ? true : !seen.add(id))))
}
