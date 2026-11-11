import { describe, expect, it } from 'vitest'
import { confrontWitnesses } from './confrontation'
import { elevenSecondsConfrontations } from './cases/elevenSecondsConfrontations'
import type { ConfrontationDefinition } from './definition'

const rules = elevenSecondsConfrontations('fr')

describe('witness confrontation', () => {
  it('deduces separate visibility rules from Loberry and Furykov', () => {
    const result = confrontWitnesses(
      ['loberry', 'furykov'],
      ['loberry-vision', 'bill-testimony'],
      rules,
    )
    expect(result.tone).toBe('deduction')
    expect(result.evidenceIds).toEqual(['visibility-split'])
    expect(result.key).toBe('furykov:loberry')
  })

  it('requires the underlying declarations first', () => {
    expect(confrontWitnesses(['loberry', 'furykov'], [], rules).tone).toBe('insufficient')
  })

  it('reads the pairs from the case, not from witness ids it knows', () => {
    const other: ConfrontationDefinition[] = [
      {
        id: 'a-b',
        subjectIds: ['a', 'b'],
        requiredEvidenceIds: ['x'],
        evidenceIds: ['y'],
        tone: 'deduction',
        title: 'T',
        finding: 'F',
        incompleteFinding: 'I',
      },
    ]
    expect(confrontWitnesses(['b', 'a'], ['x'], other)).toMatchObject({
      tone: 'deduction',
      evidenceIds: ['y'],
      title: 'T',
    })
    expect(confrontWitnesses(['b', 'a'], [], other).finding).toBe('I')
    expect(confrontWitnesses(['loberry', 'furykov'], ['loberry-vision'], other).tone).toBe(
      'insufficient',
    )
  })

  it('speaks the visitor’s language', () => {
    const result = confrontWitnesses(
      ['bill', 'sakata'],
      ['bill-testimony'],
      elevenSecondsConfrontations('en'),
    )
    expect(result).toMatchObject({ tone: 'corroboration', title: 'Corroborated observation' })
  })
})
