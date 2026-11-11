import type { Evidence, Verdict } from './case'
import type { InvestigationCaseDefinition } from './definition'

export interface FinalReport {
  title: string
  /** The human name of the incident, shown where an internal id used to be. */
  subtitle: string
  disposition: string
  mechanism: string[]
  established: Evidence[]
  deductions: Evidence[]
  testimony: Evidence[]
  rejectedHypotheses: string[]
  unknowns: string[]
}

/** The solved case's report; every word of it comes from the localized case definition. */
export function buildFinalReport(
  definition: InvestigationCaseDefinition,
  verdict: Verdict,
): FinalReport {
  const investigation = definition.content
  const supporting = verdict.supporting
  return {
    title: investigation.title,
    subtitle: investigation.subtitle,
    disposition: definition.report.disposition,
    mechanism: [...definition.report.mechanism],
    established: supporting.filter((evidence) => evidence.truthStatus === 'CONFIRMED'),
    deductions: supporting.filter((evidence) => evidence.truthStatus === 'DEDUCTION'),
    testimony: supporting.filter((evidence) => evidence.truthStatus === 'STRONGLY_IMPLIED'),
    rejectedHypotheses: investigation.hypotheses
      .filter((hypothesis) => hypothesis.id !== investigation.canonicalHypothesisId)
      .map((hypothesis) => hypothesis.label),
    unknowns: [...definition.report.unknowns],
  }
}
