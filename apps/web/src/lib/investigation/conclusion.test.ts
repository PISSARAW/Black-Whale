import { describe, expect, it } from 'vitest'
import { elevenSecondsDefinition } from './cases/elevenSeconds'
import { assessComposedConclusion } from './conclusion'

describe('composed investigation conclusions', () => {
  const definition = elevenSecondsDefinition('fr')

  it('resolves a coherent set of independent facets', () => {
    const result = assessComposedConclusion({
      investigation: definition.content,
      definition: definition.conclusion,
      selections: {
        mechanism: 'nen-constructs',
        operation: 'remote-coordination',
        attribution: 'unknown-user',
      },
      evidenceIds: definition.content.evidence.map((item) => item.id),
    })

    expect(result.hypothesisId).toBe('hidden-nen')
    expect(result.verdict?.status).toBe('solved')
  })

  it('keeps an internally inconsistent reconstruction out of the verdict engine', () => {
    const result = assessComposedConclusion({
      investigation: definition.content,
      definition: definition.conclusion,
      selections: {
        mechanism: 'nen-constructs',
        operation: 'direct-assault',
        attribution: 'unknown-user',
      },
      evidenceIds: [],
    })

    expect(result.complete).toBe(true)
    expect(result.hypothesisId).toBeNull()
    expect(result.conflictingOptionIds).toHaveLength(3)
  })
})
