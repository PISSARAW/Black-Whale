/**
 * Room-to-room navigation, derived from the doorways the geometry already cut.
 *
 * Nothing here is authored either: two rooms are neighbours exactly when
 * `deriveDoorways` found a shared wall wide enough to walk through. The hunter
 * patrols this graph; the player walks the floor.
 */
import type { Arena } from './arena'
import { interiorPoint } from '../tour/geometry'
import type { Vec2 } from '../tour/types'

export interface NavGraph {
  nodes: string[]
  edges: Map<string, string[]>
  /** A point known to be inside the room — not the centroid, which an L-shaped
   * room can put in a wall. */
  centers: Map<string, Vec2>
}

export function buildNavGraph(arena: Arena): NavGraph {
  const nodes = arena.spaces.map((space) => space.id)
  const edges = new Map<string, string[]>(nodes.map((id) => [id, []]))
  const centers = new Map<string, Vec2>()

  for (const space of arena.spaces) centers.set(space.id, interiorPoint(space.footprint))

  for (const door of arena.doorways) {
    const a = edges.get(door.a)
    const b = edges.get(door.b)
    if (a && !a.includes(door.b)) a.push(door.b)
    if (b && !b.includes(door.a)) b.push(door.a)
  }

  return { nodes, edges, centers }
}

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

/**
 * Shortest walk between two rooms, by A* over the doorway graph. Returns null
 * when there is no way through — which, given `buildArena` checks contiguity,
 * only happens for an id that is not in the arena at all.
 *
 * The `gScore` lookups use `??` rather than `||` on purpose: the start node
 * scores zero, and treating that as "unvisited" makes the search reopen it
 * forever and then walk a cycle while rebuilding the path. That version did not
 * return a bad route, it never returned.
 */
export function shortestPath(graph: NavGraph, from: string, to: string): string[] | null {
  if (!graph.edges.has(from) || !graph.edges.has(to)) return null
  if (from === to) return [from]

  const goal = graph.centers.get(to)!
  const open = new Set<string>([from])
  const cameFrom = new Map<string, string>()
  const gScore = new Map<string, number>([[from, 0]])
  const fScore = new Map<string, number>([[from, dist(graph.centers.get(from)!, goal)]])

  while (open.size > 0) {
    let current = ''
    let best = Infinity
    for (const node of open) {
      const score = fScore.get(node) ?? Infinity
      if (score < best) {
        best = score
        current = node
      }
    }

    if (current === to) return retrace(cameFrom, current)

    open.delete(current)
    const here = graph.centers.get(current)!
    const walked = gScore.get(current) ?? Infinity

    for (const neighbour of graph.edges.get(current) ?? []) {
      const there = graph.centers.get(neighbour)!
      const tentative = walked + dist(here, there)
      if (tentative >= (gScore.get(neighbour) ?? Infinity)) continue
      cameFrom.set(neighbour, current)
      gScore.set(neighbour, tentative)
      fScore.set(neighbour, tentative + dist(there, goal))
      open.add(neighbour)
    }
  }

  return null
}

function retrace(cameFrom: Map<string, string>, goal: string): string[] {
  const path = [goal]
  let current = goal
  while (cameFrom.has(current)) {
    current = cameFrom.get(current)!
    path.unshift(current)
  }
  return path
}
