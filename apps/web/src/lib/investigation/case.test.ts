import { describe, expect, it } from 'vitest'
import { evaluateHypothesis, room1014Case } from './case'

describe('investigation verdict', () => {
  it('includes the central witnesses and declared Nen users', () => {
    expect(room1014Case.subjects.map((subject) => subject.id)).toEqual(
      expect.arrayContaining(['loberry', 'furykov', 'belerainte', 'sakata', 'body']),
    )
  })

  it('requires every decisive clue before solving the case', () => {
    const verdict = evaluateHypothesis(room1014Case, 'hidden-nen', ['wounds', 'bill-testimony'])

    expect(verdict.status).toBe('plausible')
    expect(verdict.missing.map((evidence) => evidence.id)).toEqual([
      'death-window',
      'loberry-vision',
      'nen-residue',
    ])
  })

  it('solves the case when the hidden Nen hypothesis is fully supported', () => {
    const verdict = evaluateHypothesis(
      room1014Case,
      'hidden-nen',
      room1014Case.evidence.map((evidence) => evidence.id),
    )

    expect(verdict.status).toBe('solved')
    expect(verdict.contradictions).toHaveLength(0)
  })

  it('surfaces evidence that contradicts an ordinary weapon', () => {
    const verdict = evaluateHypothesis(room1014Case, 'ordinary-weapon', [
      'wounds',
      'bill-testimony',
      'loberry-vision',
    ])

    expect(verdict.status).toBe('contradicted')
    expect(verdict.contradictions).toHaveLength(1)
  })
})
