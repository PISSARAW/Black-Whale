import { elevenSecondsDefinition } from './cases/elevenSeconds'
import { describe, expect, it } from 'vitest'
import {
  openingDisposition,
  resolveInterview,
  type InterviewExchange,
  type WitnessDisposition,
} from './interview'

const bill: WitnessDisposition = {
  subjectId: 'bill',
  trust: 52,
  stress: 35,
  preferredStances: ['neutral', 'empathetic'],
  resistedStances: ['accusatory'],
}

const exchange: InterviewExchange = {
  questionId: 'what-did-you-see',
  stance: 'neutral',
  leverageEvidenceIds: ['wounds'],
  requiredTrust: 50,
  baseEvidenceIds: ['bill-testimony'],
  cooperativeEvidenceIds: ['bill-angle-detail'],
}

describe('investigation V3 interviews', () => {
  it('rewards a stance suited to the witness', () => {
    const outcome = resolveInterview(bill, exchange, [])
    expect(outcome.cooperation).toBe('guarded')
    expect(outcome.revealedEvidenceIds).toEqual(['bill-testimony'])
    expect(outcome.trustDelta).toBeGreaterThan(0)
  })

  it('opens deeper disclosure when evidence provides leverage', () => {
    const outcome = resolveInterview(bill, exchange, ['wounds'])
    expect(outcome.cooperation).toBe('open')
    expect(outcome.revealedEvidenceIds).toContain('bill-angle-detail')
  })

  it('can make an accusatory approach counterproductive', () => {
    const outcome = resolveInterview(bill, { ...exchange, stance: 'accusatory' }, [])
    expect(outcome.cooperation).toBe('refused')
    expect(outcome.nextDisposition.trust).toBeLessThan(bill.trust)
    expect(outcome.nextDisposition.stress).toBeGreaterThan(bill.stress)
  })

  it('recognises the investigator by id in every language', () => {
    for (const locale of ['fr', 'en'] as const) {
      const kurapika = elevenSecondsDefinition(locale).content.subjects.find(
        (subject) => subject.id === 'kurapika',
      )!
      expect(openingDisposition(kurapika, 'kurapika').trust).toBe(80)
    }
  })
})
