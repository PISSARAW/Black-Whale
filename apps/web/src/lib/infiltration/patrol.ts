import type { NavGraph } from '../hunt/navmesh'
import type { Vec2 } from '../tour/types'
import type { Witness } from './state'

export const PATROL_SPEED = 1.25
const ARRIVAL = 0.3

export function patrolWitness(witness: Witness, graph: NavGraph, dt: number): Witness {
  const goalId = witness.investigating ?? witness.route[witness.routeIndex]
  const goal = graph.centers.get(goalId)
  if (!goal) return witness
  const gap = distance(witness.position, goal)
  if (gap <= ARRIVAL) return arrive(witness, goalId)
  const amount = Math.min(gap, PATROL_SPEED * dt)
  const position: Vec2 = [
    witness.position[0] + ((goal[0] - witness.position[0]) / gap) * amount,
    witness.position[1] + ((goal[1] - witness.position[1]) / gap) * amount,
  ]
  return { ...witness, position }
}

function arrive(witness: Witness, goalId: string): Witness {
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
