import type { InvestigationQuestion, InvestigationSubject } from './case'

export function questionIsAvailable(
  question: InvestigationQuestion,
  discoveredEvidenceIds: Iterable<string>,
): boolean {
  const discovered = new Set(discoveredEvidenceIds)
  return question.requiredEvidenceIds.every((id) => discovered.has(id))
}

export function questionsFor(
  subject: InvestigationSubject,
  discoveredEvidenceIds: Iterable<string>,
): { question: InvestigationQuestion; available: boolean; missingEvidenceIds: string[] }[] {
  const discovered = new Set(discoveredEvidenceIds)
  return subject.questions.map((question) => ({
    question,
    available: questionIsAvailable(question, discovered),
    missingEvidenceIds: question.requiredEvidenceIds.filter((id) => !discovered.has(id)),
  }))
}
