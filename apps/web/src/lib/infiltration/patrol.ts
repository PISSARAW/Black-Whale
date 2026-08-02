import type { NavGraph } from '../hunt/navmesh'
import type { Arena } from '../hunt/arena'
import { resolveMovement, wallsNear } from '../tour/navigation'
import type { Vec2 } from '../tour/types'
import type { Witness } from './state'

export const PATROL_SPEED = 1.25
const ARRIVAL = 0.3

export interface PatrolWorld {
  graph: NavGraph
  arena: Arena
  dt: number
}

export function patrolWitness(witness: Witness, world: PatrolWorld): Witness {
  const goalId = witness.investigating ?? witness.route[witness.routeIndex]
  const goal = waypoint(witness, goalId, world)
  if (!goal) return witness
  const gap = distance(witness.position, goal)
  if (gap <= ARRIVAL) return arrive(witness, goalId)
  const amount = Math.min(gap, PATROL_SPEED * world.dt)
  const target: Vec2 = [
    witness.position[0] + ((goal[0] - witness.position[0]) / gap) * amount,
    witness.position[1] + ((goal[1] - witness.position[1]) / gap) * amount,
  ]
  const position = resolveMovement(
    witness.position,
    target,
    wallsNear(world.arena.walls, witness.position, 2),
  )
  return { ...witness, position }
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

export function hearsMovement(witness: Witness, playerSpaceId: string | null, graph: NavGraph) {
  if (!playerSpaceId) return false
  return (
    witness.spaceId === playerSpaceId ||
    (graph.edges.get(witness.spaceId) ?? []).includes(playerSpaceId)
  )
}
