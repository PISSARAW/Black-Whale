import { describe, expect, it } from 'vitest'
import { evaluateHypothesis, room1014Case } from './case'
import { localizedRoom1014Case } from './localizedCase'
import { describeVerdict } from './verdictCopy'

const english = localizedRoom1014Case('en')

describe('verdict copy', () => {
  it('agrees in number in French', () => {
    const verdict = evaluateHypothesis(room1014Case, 'ordinary-weapon', [
      'wounds',
      'death-window',
      'nen-residue',
    ])
    expect(describeVerdict(verdict, room1014Case, 'fr').summary).toBe(
      '2 éléments résistent à cette reconstruction.',
    )
  })

  it('writes plain English rather than a machine translation', () => {
    const missing = evaluateHypothesis(english, 'hidden-nen', ['wounds'])
    expect(describeVerdict(missing, english, 'en')).toEqual({
      title: 'Plausible lead, incomplete evidence',
      summary: '5 pieces of evidence still missing to support this conclusion.',
    })
    const insufficient = evaluateHypothesis(english, 'accident', ['six-nen-users'])
    expect(describeVerdict(insufficient, english, 'en').title).toBe('Insufficient case')
  })

  it('takes the solved summary from the case, in its language', () => {
    const solved = evaluateHypothesis(
      english,
      'hidden-nen',
      english.evidence.map((evidence) => evidence.id),
    )
    expect(describeVerdict(solved, english, 'en')).toEqual({
      title: 'Conclusion demonstrated',
      summary: english.solvedSummary,
    })
  })
})
