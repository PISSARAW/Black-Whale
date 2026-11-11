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

  it('refuses a hypothesis that rests on no evidence', () => {
    const definition = elevenSecondsDefinition('fr')
    definition.content = {
      ...definition.content,
      hypotheses: definition.content.hypotheses.map((hypothesis) =>
        hypothesis.id === 'accident' ? { ...hypothesis, requiredEvidenceIds: [] } : hypothesis,
      ),
    }
    expect(validateCaseDefinition(definition)).toContainEqual({
      path: 'hypotheses.accident.required',
      message: 'at least one required evidence',
    })
  })

  it('refuses a limited Hatsu rule that hands evidence to the dossier', () => {
    const definition = elevenSecondsDefinition('fr')
    definition.hatsuRules = definition.hatsuRules.map((rule) =>
      rule.id === 'reader-truth-signature' ? { ...rule, evidenceIds: ['wounds'] } : rule,
    )
    expect(validateCaseDefinition(definition)).toContainEqual({
      path: 'hatsuRules.reader-truth-signature.evidence',
      message: 'a limited rule grants no evidence',
    })
  })
})
