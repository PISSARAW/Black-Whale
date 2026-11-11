import { describe, expect, it } from 'vitest'
import { elevenSecondsDefinition } from './cases/elevenSeconds'
import { caseIsUnlocked, portfolioConsequenceIds } from './continuity'
import { freshPortfolio, updateCasePortfolio } from './portfolio'

describe('linked investigation cases', () => {
  const sequel = {
    ...elevenSecondsDefinition('fr').metadata,
    slug: 'next-case',
    prerequisiteCaseIds: ['eleven-seconds'],
  }

  it('keeps a linked case locked until every prerequisite is solved', () => {
    const fresh = freshPortfolio()
    expect(caseIsUnlocked(sequel, fresh)).toBe(false)

    const solved = updateCasePortfolio(fresh, {
      caseId: 'eleven-seconds',
      status: 'solved',
      bestConclusionId: 'hidden-nen',
      optionalEvidenceIds: [],
      consequenceIds: ['silent-majority-mechanism-established'],
    })
    expect(caseIsUnlocked(sequel, solved)).toBe(true)
  })

  it('carries solved-case consequences into later investigations', () => {
    const portfolio = updateCasePortfolio(freshPortfolio(), {
      caseId: 'eleven-seconds',
      status: 'solved',
      bestConclusionId: 'hidden-nen',
      optionalEvidenceIds: [],
      consequenceIds: ['silent-majority-mechanism-established'],
    })
    expect(portfolioConsequenceIds(portfolio)).toEqual(['silent-majority-mechanism-established'])
  })
})
