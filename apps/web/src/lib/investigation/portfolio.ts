import type { InvestigationMode } from './definition'

export const INVESTIGATION_PORTFOLIO_VERSION = 2
export const INVESTIGATION_PORTFOLIO_KEY = 'black-whale:investigation:portfolio'

export type CaseProgressStatus = 'available' | 'in-progress' | 'solved'

export interface CasePortfolioEntry {
  caseId: string
  status: CaseProgressStatus
  lastActiveAt: string
  bestConclusionId: string | null
  optionalEvidenceIds: string[]
  consequenceIds: string[]
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
  update: Omit<CasePortfolioEntry, 'lastActiveAt' | 'consequenceIds'> & {
    lastActiveAt?: string
    consequenceIds?: string[]
  },
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
        consequenceIds: [
          ...new Set([...(previous?.consequenceIds ?? []), ...(update.consequenceIds ?? [])]),
        ],
      },
    },
  }
}

type PortfolioStorage = Pick<Storage, 'getItem' | 'setItem'>

/** Where one visitor's passage through a case stands, as the case room reads it. */
export interface CaseStanding {
  /** The catalogue slug — the key the case room looks entries up by. */
  caseId: string
  started: boolean
  solved: boolean
  conclusionId: string | null
  consequenceIds?: string[]
}

/** Records a case's standing in the device's portfolio, never downgrading a solved case. */
export function recordCaseStanding(storage: PortfolioStorage, standing: CaseStanding) {
  const portfolio = parsePortfolio(storage.getItem(INVESTIGATION_PORTFOLIO_KEY))
  const status: CaseProgressStatus = standing.solved
    ? 'solved'
    : standing.started
      ? 'in-progress'
      : 'available'
  const next = updateCasePortfolio(portfolio, {
    caseId: standing.caseId,
    status,
    bestConclusionId: standing.solved
      ? standing.conclusionId
      : (portfolio.cases[standing.caseId]?.bestConclusionId ?? null),
    optionalEvidenceIds: portfolio.cases[standing.caseId]?.optionalEvidenceIds ?? [],
    consequenceIds: standing.solved ? standing.consequenceIds : undefined,
  })
  storage.setItem(INVESTIGATION_PORTFOLIO_KEY, JSON.stringify(next))
}

/** Drops a case from the portfolio, so a reset case reads as available again. */
export function forgetCaseStanding(storage: PortfolioStorage, caseId: string) {
  const portfolio = parsePortfolio(storage.getItem(INVESTIGATION_PORTFOLIO_KEY))
  if (!portfolio.cases[caseId]) return
  const cases = { ...portfolio.cases }
  delete cases[caseId]
  storage.setItem(INVESTIGATION_PORTFOLIO_KEY, JSON.stringify({ ...portfolio, cases }))
}

export function parsePortfolio(raw: string | null): InvestigationPortfolio {
  if (!raw) return freshPortfolio()
  try {
    const value = JSON.parse(raw) as Partial<InvestigationPortfolio>
    if ((value.version !== 1 && value.version !== INVESTIGATION_PORTFOLIO_VERSION) || !value.cases)
      return freshPortfolio()
    return {
      version: INVESTIGATION_PORTFOLIO_VERSION,
      preferredMode: value.preferredMode === '2d' ? '2d' : '3d',
      cases: Object.fromEntries(
        Object.entries(value.cases).map(([caseId, entry]) => [
          caseId,
          { ...entry, consequenceIds: entry.consequenceIds ?? [] },
        ]),
      ),
    }
  } catch {
    return freshPortfolio()
  }
}
