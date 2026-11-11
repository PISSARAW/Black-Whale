import { theShip } from '$lib/tour/blueprint'

export type StrategyMovementGraph = ReadonlyMap<string, readonly string[]>
export interface StrategyRouteRequest {
  from: string
  to: string
  blocked?: ReadonlySet<string>
}

/** Breadth-first route through authored doors and vertical links. */
export function findStrategyRoute(
  graph: StrategyMovementGraph,
  request: StrategyRouteRequest,
): string[] | null {
  const { from, to, blocked = new Set() } = request
  if (from === to) return [from]
  if (!routeEndpointsAreOpen(graph, request)) return null
  const previous = new Map<string, string | null>([[from, null]])
  const queue = [from]
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]
    for (const next of graph.get(current) ?? []) {
      if (blocked.has(next) || previous.has(next)) continue
      previous.set(next, current)
      if (next === to) return reconstructRoute(previous, current, to)
      queue.push(next)
    }
  }
  return null
}

function routeEndpointsAreOpen(
  graph: StrategyMovementGraph,
  request: StrategyRouteRequest,
): boolean {
  const blocked = request.blocked ?? new Set()
  return (
    !blocked.has(request.from) &&
    !blocked.has(request.to) &&
    graph.has(request.from) &&
    graph.has(request.to)
  )
}

function reconstructRoute(
  previous: ReadonlyMap<string, string | null>,
  beforeDestination: string,
  destination: string,
): string[] {
  const route = [destination]
  let cursor: string | null = beforeDestination
  while (cursor) {
    route.push(cursor)
    cursor = previous.get(cursor) ?? null
  }
  return route.reverse()
}

/**
 * Share the Tour ship topology with Strategy. Scenario-level aggregate places
 * (a tier or sector) are linked to the most specific authored spaces beneath
 * them, without inventing a second map.
 */
export function strategyMovementGraph(locationIds: readonly string[]): StrategyMovementGraph {
  const shipGraph = theShip().adjacency
  const graph = new Map<string, string[]>(
    [...shipGraph].map(([id, neighbours]) => [id, [...neighbours]]),
  )
  const aggregateIds = [...new Set(locationIds)].filter((id) => !graph.has(id))

  const connect = (left: string, right: string) => {
    const leftNeighbours = graph.get(left) ?? []
    if (!leftNeighbours.includes(right)) leftNeighbours.push(right)
    graph.set(left, leftNeighbours)
    const rightNeighbours = graph.get(right) ?? []
    if (!rightNeighbours.includes(left)) rightNeighbours.push(left)
    graph.set(right, rightNeighbours)
  }

  for (const aggregateId of aggregateIds) graph.set(aggregateId, [])
  for (const spaceId of shipGraph.keys()) {
    const parent = aggregateIds
      .filter((id) => spaceId.startsWith(`${id}-`))
      .sort((left, right) => right.length - left.length)[0]
    if (parent) connect(parent, spaceId)
  }
  return graph
}
