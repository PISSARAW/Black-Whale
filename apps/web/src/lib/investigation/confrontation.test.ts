import { describe, expect, it } from 'vitest'
import { confrontWitnesses } from './confrontation'
import { elevenSecondsConfrontations } from './cases/elevenSecondsConfrontations'
import { confrontationCopy } from './confrontationCopy'
import type { ConfrontationDefinition } from './definition'

const rules = elevenSecondsConfrontations('fr')
const copy = confrontationCopy('fr')
const confront = (
  witnessIds: string[],
  discoveredEvidenceIds: string[],
  confrontations: ConfrontationDefinition[] = rules,
  locale: 'fr' | 'en' = 'fr',
) =>
  confrontWitnesses({
    witnessIds,
    discoveredEvidenceIds,
    confrontations,
    copy: locale === 'fr' ? copy : confrontationCopy('en'),
  })

describe('witness confrontation', () => {
  it('deduces separate visibility rules from Loberry and Furykov', () => {
    const result = confront(['loberry', 'furykov'], ['loberry-vision', 'bill-testimony'])
    expect(result.tone).toBe('deduction')
    expect(result.evidenceIds).toEqual(['visibility-split'])
    expect(result.key).toBe('furykov:loberry')
  })

  it('requires the underlying declarations first', () => {
    expect(confront(['loberry', 'furykov'], []).tone).toBe('insufficient')
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
    expect(confront(['b', 'a'], ['x'], other)).toMatchObject({
      tone: 'deduction',
      evidenceIds: ['y'],
      title: 'T',
    })
    expect(confront(['b', 'a'], [], other).finding).toBe('I')
    expect(confront(['loberry', 'furykov'], ['loberry-vision'], other).tone).toBe('insufficient')
  })

  it('speaks the visitor’s language', () => {
    const result = confront(
      ['bill', 'sakata'],
      ['bill-testimony'],
      elevenSecondsConfrontations('en'),
      'en',
    )
    expect(result).toMatchObject({ tone: 'corroboration', title: 'Corroborated observation' })
  })

  it('says why nothing came of it in the visitor’s language', () => {
    expect(confront(['bill'], [], rules, 'en').title).toBe('Two statements required')
    expect(confront(['bill', 'belerainte'], [], rules, 'en').title).toBe(
      'No exploitable contradiction',
    )
    expect(
      confront(['loberry', 'furykov'], [], elevenSecondsConfrontations('en'), 'en'),
    ).toMatchObject({
      title: 'Incomplete statements',
      finding: 'First question Loberry about the doll and a witness about the creatures.',
    })
  })
})
