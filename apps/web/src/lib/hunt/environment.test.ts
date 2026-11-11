import { describe, expect, it } from 'vitest'
import {
  canSealExit,
  canSeeAtDistance,
  environmentModifiers,
  graphWithSeals,
  wallsForSeals,
} from './environment'
import type { NavGraph } from './navmesh'

const graph: NavGraph = {
  nodes: ['a', 'b', 'c'],
  edges: new Map([
    ['a', ['b']],
    ['b', ['a', 'c']],
    ['c', ['b']],
  ]),
  centers: new Map([
    ['a', [0, 0]],
    ['b', [1, 0]],
    ['c', [2, 0]],
  ]),
}

describe('Hunt V3 environment', () => {
  it('makes blackout visual rather than omniscient and reverb louder', () => {
    expect(
      environmentModifiers({ lighting: 'blackout', acoustics: 'reverberant', sealableExits: true }),
    ).toEqual({ vision: 0.15, hearing: 1.45, gyoRequired: true })
  })

  it('removes a sealed exit in both directions without mutating the graph', () => {
    const sealed = graphWithSeals(graph, [{ a: 'a', b: 'b' }])
    expect(sealed.edges.get('a')).toEqual([])
    expect(sealed.edges.get('b')).toEqual(['c'])
    expect(graph.edges.get('a')).toEqual(['b'])
  })

  it('only seals real exits when the contract permits it and the map stays connected', () => {
    expect(
      canSealExit({ lighting: 'normal', acoustics: 'clear', sealableExits: true }, graph, {
        a: 'a',
        b: 'b',
      }),
    ).toBe(false)
    const cycle = {
      ...graph,
      edges: new Map([
        ['a', ['b', 'c']],
        ['b', ['a', 'c']],
        ['c', ['a', 'b']],
      ]),
    }
    expect(
      canSealExit({ lighting: 'normal', acoustics: 'clear', sealableExits: true }, cycle, {
        a: 'a',
        b: 'b',
      }),
    ).toBe(true)
    expect(
      canSealExit({ lighting: 'normal', acoustics: 'clear', sealableExits: false }, graph, {
        a: 'a',
        b: 'b',
      }),
    ).toBe(false)
  })

  it('turns seals into player collision and makes blackout sight close-range without Gyo', () => {
    const doorway = { tierId: 't', a: 'a', b: 'b', start: [0, 0], end: [0, 2], width: 2 } as const
    expect(wallsForSeals([doorway], [{ a: 'a', b: 'b' }])).toHaveLength(1)
    const blackout = { lighting: 'blackout', acoustics: 'clear', sealableExits: true } as const
    expect(canSeeAtDistance(blackout, { distance: 3, gyo: false, targetAuraVisible: true })).toBe(
      false,
    )
    expect(canSeeAtDistance(blackout, { distance: 3, gyo: true, targetAuraVisible: true })).toBe(
      true,
    )
    expect(canSeeAtDistance(blackout, { distance: 30, gyo: true, targetAuraVisible: true })).toBe(
      false,
    )
    expect(canSeeAtDistance(blackout, { distance: 3, gyo: true, targetAuraVisible: false })).toBe(
      false,
    )
  })
})
