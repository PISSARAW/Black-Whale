import type { NavGraph } from '../hunt/navmesh'
import type { Witness, InfiltrationState } from './state'

const DOOR_ATTENUATION = 0.48
const MAX_DOORS = 2

export function hearingStrength(
  witness: Pick<Witness, 'position' | 'spaceId'>,
  player: InfiltrationState['player'],
  graph: NavGraph,
): number {
  if (!player.moving || !player.spaceId) return 0
  const doors = doorDistance(graph, witness.spaceId, player.spaceId)
  if (doors === null || doors > MAX_DOORS) return 0
  const distance = Math.max(
    1,
    Math.hypot(player.position[0] - witness.position[0], player.position[1] - witness.position[1]),
  )
  const pace = Math.min(1.5, player.speed / 2.1)
  return Math.min(1, (pace * Math.pow(DOOR_ATTENUATION, doors)) / Math.sqrt(distance / 3))
}

function doorDistance(graph: NavGraph, from: string, to: string): number | null {
  if (from === to) return 0
  const reached = new Set([from])
  let frontier = [from]
  for (let depth = 1; depth <= MAX_DOORS; depth += 1) {
    const next: string[] = []
    for (const room of frontier) {
      for (const neighbour of graph.edges.get(room) ?? []) {
        if (neighbour === to) return depth
        if (!reached.has(neighbour)) {
          reached.add(neighbour)
          next.push(neighbour)
        }
      }
    }
    frontier = next
  }
  return null
}
