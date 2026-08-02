import { describe, expect, it } from 'vitest'
import {
  caseProgressStorageKey,
  freshPortfolio,
  parsePortfolio,
  updateCasePortfolio,
} from './portfolio'

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
})
