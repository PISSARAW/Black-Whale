import { describe, expect, it } from 'vitest'
import { elevenSecondsDefinition } from './cases/elevenSeconds'
import { buildNotebookGraph } from './notebookGraph'

describe('spatial and relational investigation notebook', () => {
  const definition = elevenSecondsDefinition('fr')

  it('never exposes an undiscovered evidence node', () => {
    const graph = buildNotebookGraph({
      definition,
      discoveredEvidenceIds: ['bill-testimony'],
      reviewedSubjectIds: ['bill'],
    })

    expect(graph.nodes.some((node) => node.id === 'bill-testimony')).toBe(true)
    expect(graph.nodes.some((node) => node.id === 'loberry-vision')).toBe(false)
  })

  it('links reviewed witnesses to the scene and their evidence', () => {
    const graph = buildNotebookGraph({
      definition,
      discoveredEvidenceIds: ['bill-testimony'],
      reviewedSubjectIds: ['bill'],
    })

    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 'bill', kind: 'present-at' }),
        { from: 'bill', to: 'bill-testimony', kind: 'source-of' },
      ]),
    )
  })
})
