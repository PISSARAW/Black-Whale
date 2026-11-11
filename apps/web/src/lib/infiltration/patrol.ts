import { shortestPath, type NavGraph } from '../hunt/navmesh'
import type { Arena } from '../hunt/arena'
import { resolveMovement } from '../tour/navigation'
import type { Vec2 } from '../tour/types'
import type { Witness } from './state'

export const PATROL_SPEED = 1.25
export const WITNESS_RADIUS = 0.42
const ARRIVAL = 0.3
/** Below this share of the intended step, the witness is pushing a wall. */
const STALLED = 0.1

export interface PatrolWorld {
  graph: NavGraph
  arena: Arena
  dt: number
}

export function patrolWitness(witness: Witness, world: PatrolWorld): Witness {
  const goalId = witness.investigating ?? witness.route[witness.routeIndex]
  const hop = nextRoom(witness.spaceId, goalId, world.graph)
  const goal = hop ? waypoint(witness, hop, world) : null
  // A goal no door leads to is dropped rather than stared at forever.
  if (!hop || !goal) return witness.investigating ? { ...witness, investigating: null } : witness
  const gap = distance(witness.position, goal)
  if (gap <= ARRIVAL) return arrive(witness, hop)
  const amount = Math.min(gap, PATROL_SPEED * world.dt)
  const target: Vec2 = [
    witness.position[0] + ((goal[0] - witness.position[0]) / gap) * amount,
    witness.position[1] + ((goal[1] - witness.position[1]) / gap) * amount,
  ]
  // Patrols use the complete collision set. A proximity-filtered set can omit
  // the wall crossed by a large simulation step (for example after a stalled
  // frame), at which point resolveMovement cannot stop the witness tunnelling
  // through it. The infiltration arenas are small enough that correctness is
  // preferable to maintaining a second broad-phase here.
  const position = resolveMovement(witness.position, target, {
    walls: world.arena.walls,
    radius: WITNESS_RADIUS,
  })
  // A room's centre can fall inside its furniture (the dining table holds
  // the dining room's): pressed against it, the witness has arrived.
  if (hop === witness.spaceId && distance(position, witness.position) < amount * STALLED) {
    return arrive(witness, hop)
  }
  return {
    ...witness,
    position,
    heading: Math.atan2(goal[0] - witness.position[0], goal[1] - witness.position[1]),
  }
}

/** The next room on the shortest walk, so a goal need not share a door. */
function nextRoom(from: string, to: string, graph: NavGraph): string | null {
  if (from === to) return to
  return shortestPath(graph, from, to)?.[1] ?? null
}

function waypoint(witness: Witness, goalId: string, world: PatrolWorld): Vec2 | null {
  if (witness.spaceId === goalId) return world.graph.centers.get(goalId) ?? null
  const door = world.arena.doorways.find(
    (candidate) =>
      [candidate.a, candidate.b].includes(witness.spaceId) &&
      [candidate.a, candidate.b].includes(goalId),
  )
  return door ? [(door.start[0] + door.end[0]) / 2, (door.start[1] + door.end[1]) / 2] : null
}

function arrive(witness: Witness, goalId: string): Witness {
  if (witness.spaceId !== goalId) return { ...witness, spaceId: goalId }
  if (witness.investigating) {
    return { ...witness, spaceId: goalId, investigating: null }
  }
  return {
    ...witness,
    spaceId: goalId,
    routeIndex: (witness.routeIndex + 1) % witness.route.length,
  }
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}
