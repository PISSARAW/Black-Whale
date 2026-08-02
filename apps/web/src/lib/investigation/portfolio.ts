import type { InvestigationMode } from './definition'

export const INVESTIGATION_PORTFOLIO_VERSION = 1
export const INVESTIGATION_PORTFOLIO_KEY = 'black-whale:investigation:portfolio'

export type CaseProgressStatus = 'available' | 'in-progress' | 'solved'

export interface CasePortfolioEntry {
  caseId: string
  status: CaseProgressStatus
  lastActiveAt: string
  bestConclusionId: string | null
  optionalEvidenceIds: string[]
}

export interface InvestigationPortfolio {
  version: number
  preferredMode: InvestigationMode
  cases: Record<string, CasePortfolioEntry>
}

export function freshPortfolio(): InvestigationPortfolio {
  return { version: INVESTIGATION_PORTFOLIO_VERSION, preferredMode: '3d', cases: {} }
}

export function caseProgressStorageKey(caseId: string) {
  return `black-whale:investigation:case:${caseId}`
}

export function updateCasePortfolio(
  portfolio: InvestigationPortfolio,
  update: Omit<CasePortfolioEntry, 'lastActiveAt'> & { lastActiveAt?: string },
): InvestigationPortfolio {
  const previous = portfolio.cases[update.caseId]
  const rank: Record<CaseProgressStatus, number> = { available: 0, 'in-progress': 1, solved: 2 }
  const status =
    previous && rank[previous.status] > rank[update.status] ? previous.status : update.status
  return {
    ...portfolio,
    cases: {
      ...portfolio.cases,
      [update.caseId]: {
        ...update,
        status,
        lastActiveAt: update.lastActiveAt ?? new Date().toISOString(),
        optionalEvidenceIds: [...new Set(update.optionalEvidenceIds)],
      },
    },
  }
}

export function parsePortfolio(raw: string | null): InvestigationPortfolio {
  if (!raw) return freshPortfolio()
  try {
    const value = JSON.parse(raw) as Partial<InvestigationPortfolio>
    if (value.version !== INVESTIGATION_PORTFOLIO_VERSION || !value.cases) return freshPortfolio()
    return {
      version: INVESTIGATION_PORTFOLIO_VERSION,
      preferredMode: value.preferredMode === '2d' ? '2d' : '3d',
      cases: value.cases,
    }
  } catch {
    return freshPortfolio()
  }
}
