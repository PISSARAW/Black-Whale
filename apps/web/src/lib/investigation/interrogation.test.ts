import { describe, expect, it } from 'vitest'
import { room1014Case } from './case'
import { questionsFor } from './interrogation'

describe('investigation interrogations', () => {
  it('offers opening questions immediately', () => {
    const bill = room1014Case.subjects.find((subject) => subject.id === 'bill')!
    expect(questionsFor(bill, [])[0].available).toBe(true)
  })

  it('unlocks follow-up questions from collected evidence', () => {
    const bill = room1014Case.subjects.find((subject) => subject.id === 'bill')!
    expect(questionsFor(bill, [])[1].available).toBe(false)
    expect(questionsFor(bill, ['wounds'])[1].available).toBe(true)
  })
})
