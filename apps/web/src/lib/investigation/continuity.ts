import type { CaseMetadata } from './definition'
import type { InvestigationPortfolio } from './portfolio'

export function missingPrerequisiteCaseIds(
  metadata: CaseMetadata,
  portfolio: InvestigationPortfolio,
): string[] {
  return metadata.prerequisiteCaseIds.filter(
    (caseId) => portfolio.cases[caseId]?.status !== 'solved',
  )
}

export function caseIsUnlocked(metadata: CaseMetadata, portfolio: InvestigationPortfolio): boolean {
  return missingPrerequisiteCaseIds(metadata, portfolio).length === 0
}

/** Consequences form the compact context later cases can import. */
export function portfolioConsequenceIds(portfolio: InvestigationPortfolio): string[] {
  return [
    ...new Set(
      Object.values(portfolio.cases)
        .filter((entry) => entry.status === 'solved')
        .flatMap((entry) => entry.consequenceIds),
    ),
  ]
}
