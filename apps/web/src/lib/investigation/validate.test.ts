import { describe, expect, it } from 'vitest'
import { elevenSecondsDefinition } from './cases/elevenSeconds'
import { assertValidCaseDefinition, validateCaseDefinition } from './validate'

describe('investigation editorial validator', () => {
  it('accepts the complete Eleven seconds definition', () => {
    expect(validateCaseDefinition(elevenSecondsDefinition('fr'))).toEqual([])
  })

  it('names broken cross-references', () => {
    const definition = elevenSecondsDefinition('fr')
    definition.content.objectives[0].requiredEvidenceIds.push('missing-evidence')
    expect(validateCaseDefinition(definition)).toContainEqual({
      path: 'objectives.inspect-victim.missing-evidence',
      message: 'unknown reference',
    })
  })

  it('throws with the case slug in CI-style assertions', () => {
    const definition = elevenSecondsDefinition('fr')
    definition.report.requiredHypothesisId = 'missing'
    expect(() => assertValidCaseDefinition(definition)).toThrow('eleven-seconds')
  })
})
