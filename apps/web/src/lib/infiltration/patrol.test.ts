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
  faction: 'security',
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
  it('walks through an intermediate room to reach one that shares no door', () => {
    const line: NavGraph = {
      nodes: ['a', 'b', 'c'],
      edges: new Map([
        ['a', ['b']],
        ['b', ['a', 'c']],
        ['c', ['b']],
      ]),
      centers: new Map([
        ['a', [0, 0]],
        ['b', [2, 0]],
        ['c', [4, 0]],
      ]),
    }
    const corridor: Arena = {
      ...arena,
      doorways: [
        ...arena.doorways,
        { tierId: 'test', a: 'b', b: 'c', start: [3, -0.5], end: [3, 0.5], width: 1 },
      ],
    }
    let walker: Witness = { ...witness, route: ['c'] }
    for (let step = 0; step < 200; step++) {
      walker = patrolWitness(walker, { graph: line, arena: corridor, dt: 0.05 })
    }
    expect(walker.spaceId).toBe('c')
  })

  it('counts a centre buried in furniture as reached', () => {
    const table: Arena = {
      ...arena,
      walls: [{ spaceId: 'a', start: [-0.5, -0.5], end: [-0.5, 0.5] }],
    }
    const pinned: Witness = { ...witness, position: [-1, 0], route: ['a', 'b'], routeIndex: 0 }
    let next = pinned
    for (let step = 0; step < 5; step++)
      next = patrolWitness(next, { graph, arena: table, dt: 0.1 })
    expect(next.routeIndex).toBe(1)
  })
})
