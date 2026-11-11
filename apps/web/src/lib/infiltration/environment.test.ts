import { describe, expect, it } from 'vitest'
import type { NavGraph } from '../hunt/navmesh'
import { hearingStrength } from './sound'
import { canSee } from './vision'

const graph: NavGraph = {
  nodes: ['room'],
  edges: new Map([['room', []]]),
  centers: new Map([['room', [0, 0]]]),
}
const witness = {
  position: [0, 0] as [number, number],
  heading: Math.PI / 2,
  spaceId: 'room',
  sight: 10,
}
const player = {
  position: [7, 0] as [number, number],
  spaceId: 'room',
  moving: true,
  speed: 2.1,
  nen: 'ten' as const,
}

describe('shared infiltration environment', () => {
  it('shortens sight in dim rooms without defeating geometry', () => {
    expect(
      canSee(witness as never, player, [], { visibility: 1, ambientNoise: 0, surfaceNoise: 1 }),
    ).toBe(true)
    expect(
      canSee(witness as never, player, [], { visibility: 0.5, ambientNoise: 0, surfaceNoise: 1 }),
    ).toBe(false)
  })

  it('lets machinery mask a metal floor without making movement silent', () => {
    const quiet = hearingStrength(witness, player, graph, {
      visibility: 1,
      ambientNoise: 0.05,
      surfaceNoise: 1.25,
    })
    const machinery = hearingStrength(witness, player, graph, {
      visibility: 1,
      ambientNoise: 0.7,
      surfaceNoise: 1.25,
    })
    expect(machinery).toBeLessThan(quiet)
    expect(machinery).toBeGreaterThanOrEqual(0)
  })
})
