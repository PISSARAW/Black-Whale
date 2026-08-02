import { describe, expect, it } from 'vitest'
import { canSealExit, environmentModifiers, graphWithSeals } from './environment'
import type { NavGraph } from './navmesh'

const graph: NavGraph = {
  nodes: ['a', 'b', 'c'],
  edges: new Map([['a', ['b']], ['b', ['a', 'c']], ['c', ['b']]]),
  centers: new Map([['a', [0, 0]], ['b', [1, 0]], ['c', [2, 0]]]),
}

describe('Hunt V3 environment', () => {
  it('makes blackout visual rather than omniscient and reverb louder', () => {
    expect(environmentModifiers({ lighting: 'blackout', acoustics: 'reverberant', sealableExits: true }))
      .toEqual({ vision: 0.15, hearing: 1.45, gyoRequired: true })
  })

  it('removes a sealed exit in both directions without mutating the graph', () => {
    const sealed = graphWithSeals(graph, [{ a: 'a', b: 'b' }])
    expect(sealed.edges.get('a')).toEqual([])
    expect(sealed.edges.get('b')).toEqual(['c'])
    expect(graph.edges.get('a')).toEqual(['b'])
  })

  it('only seals real exits when the contract permits it', () => {
    expect(canSealExit({ lighting: 'normal', acoustics: 'clear', sealableExits: true }, graph, { a: 'a', b: 'b' })).toBe(true)
    expect(canSealExit({ lighting: 'normal', acoustics: 'clear', sealableExits: false }, graph, { a: 'a', b: 'b' })).toBe(false)
  })
})
