import type { InvestigationCase } from './case'
import type { InvestigationLogEntry } from './progress'

type Reader = (investigation: InvestigationCase, ref: string[]) => string | undefined

/** How each kind of entry names its subject again from the localized case. */
const readers: Record<string, Reader> = {
  discovery: (investigation, [id]) => investigation.evidence.find((item) => item.id === id)?.title,
  hypothesis: (investigation, [id]) =>
    investigation.hypotheses.find((item) => item.id === id)?.label,
  question: (investigation, [subjectId, questionId]) =>
    investigation.subjects
      .find((item) => item.id === subjectId)
      ?.questions.find((item) => item.id === questionId)?.prompt,
}

/**
 * A notebook entry's label in the case's current language.
 *
 * Entries keep the label they were written with, which is the language the
 * visitor was using then. Discoveries, hypotheses and questions name a thing
 * the localized case still holds, so they are read back from it; anything
 * else falls back to the stored label.
 */
export function logEntryLabel(entry: InvestigationLogEntry, investigation: InvestigationCase) {
  const [kind, ...ref] = entry.id.split(':')
  return readers[kind]?.(investigation, ref) ?? entry.label
}
