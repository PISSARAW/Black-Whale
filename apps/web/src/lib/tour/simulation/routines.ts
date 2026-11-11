import { evolveTourSimulation, type TourSimulationV1 } from './state'

export type TourNavigationGraph = Readonly<Record<string, readonly string[]>>

export interface NPCRoutineStop {
  at: number
  spaceId: string
  activity: string
}

export interface NPCRoutine {
  actorId: string
  repeatsEvery: number
  stops: NPCRoutineStop[]
}

export function routeBetweenSpaces(
  graph: TourNavigationGraph,
  from: string,
  to: string,
): string[] | null {
  if (from === to) return [from]
  const queue: string[][] = [[from]]
  const visited = new Set([from])
  while (queue.length) {
    const route = queue.shift()!
    for (const next of graph[route.at(-1)!] ?? []) {
      if (visited.has(next)) continue
      const candidate = [...route, next]
      if (next === to) return candidate
      visited.add(next)
      queue.push(candidate)
    }
  }
  return null
}

function scheduledStop(routine: NPCRoutine, clock: number): NPCRoutineStop | null {
  if (!routine.stops.length) return null
  const local = ((clock % routine.repeatsEvery) + routine.repeatsEvery) % routine.repeatsEvery
  return [...routine.stops].reverse().find(({ at }) => at <= local) ?? routine.stops.at(-1)!
}

/** Move every actor by one room per simulation step toward their scheduled activity. */
export function advanceNPCRoutines(
  state: TourSimulationV1,
  routines: readonly NPCRoutine[],
  graph: TourNavigationGraph,
  dt: number,
): TourSimulationV1 {
  return evolveTourSimulation(state, (draft) => {
    draft.clock += Math.max(0, dt)
    for (const routine of routines) {
      const actor = draft.actors[routine.actorId]
      const stop = scheduledStop(routine, draft.clock)
      if (!actor || !stop || actor.nextDecisionAt > draft.clock) continue
      const route = routeBetweenSpaces(graph, actor.spaceId, stop.spaceId)
      if (route?.[1]) actor.spaceId = route[1]
      actor.objective = stop.activity
      actor.nextDecisionAt = draft.clock + 1
    }
  })
}

export function interruptNPCRoutine(
  state: TourSimulationV1,
  actorId: string,
  incidentId: string,
  responseSpaceId: string,
): TourSimulationV1 {
  return evolveTourSimulation(state, (draft) => {
    const actor = draft.actors[actorId]
    if (!actor) return
    actor.objective = `respond:${incidentId}`
    actor.memory.push(incidentId)
    actor.spaceId = responseSpaceId
    actor.nextDecisionAt = draft.clock + 5
  })
}
