import { describe, it, expect } from 'vitest'
import { buildArena } from './arena'
import { buildNavGraph, shortestPath, type NavGraph } from './navmesh'
import type { Vec2 } from '../tour/types'

/** A line of three rooms: A — B — C. */
function chain(): NavGraph {
  return {
    nodes: ['a', 'b', 'c'],
    edges: new Map([
      ['a', ['b']],
      ['b', ['a', 'c']],
      ['c', ['b']],
    ]),
    centers: new Map<string, Vec2>([
      ['a', [0, 0]],
      ['b', [10, 0]],
      ['c', [20, 0]],
    ]),
  }
}

describe('the navigation graph', () => {
  const arena = buildArena()
  const graph = buildNavGraph(arena)

  it('has a node per room and an edge per doorway', () => {
    expect(graph.nodes).toHaveLength(arena.spaces.length)
    expect(graph.edges.size).toBe(arena.spaces.length)
    for (const door of arena.doorways) {
      expect(graph.edges.get(door.a)).toContain(door.b)
      expect(graph.edges.get(door.b)).toContain(door.a)
    }
  })

  it('puts every room’s waypoint inside that room', () => {
    for (const space of arena.spaces) {
      expect(graph.centers.get(space.id)).toBeDefined()
    }
  })

  it('connects every room to every other', () => {
    for (const from of graph.nodes) {
      for (const to of graph.nodes) {
        const path = shortestPath(graph, from, to)
        expect(path, `${from} → ${to}`).not.toBeNull()
        expect(path![0]).toBe(from)
        expect(path![path!.length - 1]).toBe(to)
      }
    }
  })
})

describe('shortest path', () => {
  it('walks the rooms in between', () => {
    expect(shortestPath(chain(), 'a', 'c')).toEqual(['a', 'b', 'c'])
  })

  it('is a single room when there is nowhere to go', () => {
    expect(shortestPath(chain(), 'b', 'b')).toEqual(['b'])
  })

  it('returns null for a room that is not in the graph', () => {
    expect(shortestPath(chain(), 'a', 'nowhere')).toBeNull()
  })

  it('returns null when there is no way through', () => {
    const split: NavGraph = {
      nodes: ['a', 'b'],
      edges: new Map([
        ['a', []],
        ['b', []],
      ]),
      centers: new Map<string, Vec2>([
        ['a', [0, 0]],
        ['b', [10, 10]],
      ]),
    }
    expect(shortestPath(split, 'a', 'b')).toBeNull()
  })

  it('terminates when the start scores zero — the search used to reopen it forever', () => {
    // Regression: `gScore.get(node) || Infinity` read the start's score of 0 as
    // unset, so the start was re-entered, `cameFrom` grew a cycle, and rebuilding
    // the path never returned. This test hangs rather than fails if it comes back.
    const graph = chain()
    // Every ordering, so the start is reached as a neighbour as well as a source.
    for (const from of graph.nodes) {
      for (const to of graph.nodes) {
        expect(shortestPath(graph, from, to)).not.toBeUndefined()
      }
    }
  })
})
