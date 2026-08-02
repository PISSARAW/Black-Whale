import { describe, expect, it } from 'vitest'
import { patrolWitness, WITNESS_RADIUS } from './patrol'
import type { Arena } from '../hunt/arena'
import type { NavGraph } from '../hunt/navmesh'
import type { Witness } from './state'

const graph: NavGraph = {
  nodes: ['a', 'b'],
  edges: new Map([
    ['a', ['b']],
    ['b', ['a']],
  ]),
  centers: new Map([
    ['a', [0, 0]],
    ['b', [2, 0]],
  ]),
}
const arena: Arena = {
  id: 'tserriednich',
  tierId: 'test',
  spaces: [],
  walls: [],
  doorways: [{ tierId: 'test', a: 'a', b: 'b', start: [1, -0.5], end: [1, 0.5], width: 1 }],
}
const witness: Witness = {
  id: 'guard',
  position: [0, 0],
  heading: 0,
  spaceId: 'a',
  sight: 8,
  social: false,
  usesEn: false,
  belief: { identity: 'unknown', certainty: 0, lastSpaceId: null, reported: false },
  route: ['b'],
  routeIndex: 0,
  investigating: null,
  challenged: false,
}

describe('infiltration patrol', () => {
  it('walks to the shared doorway before entering the next room', () => {
    const moved = patrolWitness(witness, { graph, arena, dt: 0.4 })
    expect(moved.position[0]).toBeCloseTo(0.5)
    expect(moved.spaceId).toBe('a')
  })

  it('crosses only after reaching the doorway', () => {
    const atDoor = { ...witness, position: [1, 0] as [number, number] }
    expect(patrolWitness(atDoor, { graph, arena, dt: 0.1 }).spaceId).toBe('b')
  })

  it('never tunnels through a wall, even after a long simulation step', () => {
    const blockedArena: Arena = {
      ...arena,
      walls: [{ spaceId: 'a', start: [1, -2], end: [1, 2] }],
    }
    const moved = patrolWitness(witness, { graph, arena: blockedArena, dt: 10 })

    expect(moved.position[0]).toBeCloseTo(1 - WITNESS_RADIUS)
    expect(moved.position[0]).toBeLessThan(1)
    expect(moved.spaceId).toBe('a')
  })
})
