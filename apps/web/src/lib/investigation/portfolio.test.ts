import { describe, expect, it } from 'vitest'
import {
  INVESTIGATION_PORTFOLIO_KEY,
  caseProgressStorageKey,
  forgetCaseStanding,
  freshPortfolio,
  parsePortfolio,
  recordCaseStanding,
  updateCasePortfolio,
} from './portfolio'

function memoryStorage() {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  }
}

describe('investigation portfolio', () => {
  it('uses an isolated save key for every case', () => {
    expect(caseProgressStorageKey('eleven-seconds')).toBe(
      'black-whale:investigation:case:eleven-seconds',
    )
  })

  it('does not downgrade a solved case', () => {
    let portfolio = freshPortfolio()
    portfolio = updateCasePortfolio(portfolio, {
      caseId: 'a',
      status: 'solved',
      bestConclusionId: 'canonical',
      optionalEvidenceIds: [],
    })
    portfolio = updateCasePortfolio(portfolio, {
      caseId: 'a',
      status: 'in-progress',
      bestConclusionId: null,
      optionalEvidenceIds: [],
    })
    expect(portfolio.cases.a.status).toBe('solved')
  })

  it('isolates corrupt global state', () => {
    expect(parsePortfolio('{bad')).toEqual(freshPortfolio())
  })

  it('records a case the room can read back by its slug', () => {
    const storage = memoryStorage()
    const standing = { caseId: 'eleven-seconds', conclusionId: 'hidden-nen' }
    recordCaseStanding(storage, { ...standing, started: true, solved: false })
    let portfolio = parsePortfolio(storage.getItem(INVESTIGATION_PORTFOLIO_KEY))
    expect(portfolio.cases['eleven-seconds']).toMatchObject({
      status: 'in-progress',
      bestConclusionId: null,
    })

    recordCaseStanding(storage, { ...standing, started: true, solved: true })
    recordCaseStanding(storage, { ...standing, started: true, solved: false })
    portfolio = parsePortfolio(storage.getItem(INVESTIGATION_PORTFOLIO_KEY))
    expect(portfolio.cases['eleven-seconds']).toMatchObject({
      status: 'solved',
      bestConclusionId: 'hidden-nen',
    })
  })

  it('forgets a reset case', () => {
    const storage = memoryStorage()
    recordCaseStanding(storage, {
      caseId: 'eleven-seconds',
      conclusionId: null,
      started: true,
      solved: true,
    })
    forgetCaseStanding(storage, 'eleven-seconds')
    const portfolio = parsePortfolio(storage.getItem(INVESTIGATION_PORTFOLIO_KEY))
    expect(portfolio.cases['eleven-seconds']).toBeUndefined()
  })
})
