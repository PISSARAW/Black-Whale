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
  preferredStances: ['neutral'],
  resistedStances: ['accusatory'],
  leverageEvidenceIds: ['wounds'],
  requiredTrust: 48,
  baseEvidenceIds: ['bill-testimony'],
  cooperativeEvidenceIds: ['bill-angle-detail'],
}

describe('investigation V3 interviews', () => {
  it('rewards a stance suited to the witness', () => {
    const outcome = resolveInterview(bill, exchange, [])
    expect(outcome.cooperation).toBe('open')
    expect(outcome.revealedEvidenceIds).toEqual(['bill-testimony', 'bill-angle-detail'])
    expect(outcome.trustDelta).toBeGreaterThan(0)
  })

  it('distinguishes question-specific approaches for the same witness', () => {
    const neutral = resolveInterview(bill, exchange, [])
    const empathetic = resolveInterview(bill, { ...exchange, stance: 'empathetic' }, [])
    const pressing = resolveInterview(
      bill,
      { ...exchange, stance: 'pressing', preferredStances: ['pressing'] },
      [],
    )

    expect(neutral.cooperation).toBe('open')
    expect(empathetic.cooperation).toBe('guarded')
    expect(pressing.cooperation).toBe('guarded')
    expect(pressing.stressDelta).toBeGreaterThan(empathetic.stressDelta)
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

  it('gives every question a useful approach and a deeper bilingual answer', () => {
    for (const locale of ['fr', 'en'] as const) {
      const definition = elevenSecondsDefinition(locale)
      const allEvidence = definition.content.evidence.map((item) => item.id)
      for (const subject of definition.content.subjects) {
        for (const question of subject.questions) {
          const outcome = resolveInterview(
            openingDisposition(subject, definition.metadata.investigatorId),
            {
              questionId: question.id,
              stance: question.preferredStances[0],
              preferredStances: question.preferredStances,
              resistedStances: question.resistedStances,
              leverageEvidenceIds: question.requiredEvidenceIds,
              requiredTrust: question.requiredTrust,
              baseEvidenceIds: question.evidenceIds,
              cooperativeEvidenceIds: question.cooperativeEvidenceIds,
            },
            allEvidence,
          )

          expect(question.cooperativeResponse).not.toBe(question.response)
          expect(outcome.cooperation, `${locale}:${question.id}`).toBe('open')
        }
      }
    }
  })
})
