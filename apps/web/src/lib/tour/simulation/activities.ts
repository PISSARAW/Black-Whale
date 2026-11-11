import { evolveTourSimulation, type TourSimulationV1 } from './state'

export const TOUR_ACTIVITY_HANDOFF_KEY = 'black-whale:tour:activity-handoff:v1'
export const TOUR_ACTIVITY_RESULT_KEY = 'black-whale:tour:activity-result:v1'

export type TourActivityMode = 'INVESTIGATION' | 'INFILTRATION' | 'HUNT' | 'STRATEGY'

const ROUTE_BY_MODE: Record<TourActivityMode, string> = {
  INVESTIGATION: '/investigation',
  INFILTRATION: '/infiltration',
  HUNT: '/hunt',
  STRATEGY: '/strategy',
}

export interface TourActivityHandoff {
  version: 1
  id: string
  simulationId: string
  mode: TourActivityMode
  originSpaceId: string
  aura: number
  knowledge: string[]
  incidents: string[]
}

export interface TourActivityResult {
  version: 1
  activityId: string
  completed: boolean
  auraDelta: number
  learnedFactIds: string[]
  reputationDelta: Record<string, number>
  incidentIds: string[]
  returnSpaceId?: string
}

interface ActivityStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function beginTourActivity(
  state: TourSimulationV1,
  mode: TourActivityMode,
  id = `${mode.toLowerCase()}:${state.revision}`,
): { state: TourSimulationV1; handoff: TourActivityHandoff; href: string } {
  const handoff: TourActivityHandoff = {
    version: 1,
    id,
    simulationId: state.id,
    mode,
    originSpaceId: state.player.spaceId,
    aura: state.player.aura,
    knowledge: [...state.player.knowledge],
    incidents: [...state.incidents],
  }
  const next = evolveTourSimulation(state, (draft) => {
    draft.activities[`external:${id}`] = {
      stage: mode,
      status: 'ACTIVE',
      data: { originSpaceId: draft.player.spaceId },
    }
  })
  return {
    state: next,
    handoff,
    href: `${ROUTE_BY_MODE[mode]}?tourActivity=${encodeURIComponent(id)}`,
  }
}

export function applyTourActivityResult(
  state: TourSimulationV1,
  result: TourActivityResult,
): TourSimulationV1 {
  const activity = state.activities[`external:${result.activityId}`]
  if (!activity || activity.status !== 'ACTIVE') return state
  return evolveTourSimulation(state, (draft) => {
    const current = draft.activities[`external:${result.activityId}`]
    current.status = result.completed ? 'RESOLVED' : 'FAILED'
    current.stage = result.completed ? 'RETURNED' : 'ABORTED'
    draft.player.aura = Math.max(0, Math.min(100, draft.player.aura + result.auraDelta))
    draft.player.spaceId = result.returnSpaceId ?? String(current.data.originSpaceId)
    for (const fact of result.learnedFactIds)
      if (!draft.player.knowledge.includes(fact)) draft.player.knowledge.push(fact)
    for (const [factionId, delta] of Object.entries(result.reputationDelta))
      draft.reputation[factionId] = Math.max(
        -100,
        Math.min(100, (draft.reputation[factionId] ?? 0) + delta),
      )
    draft.incidents.push(...result.incidentIds)
  })
}

export function saveTourActivityHandoff(
  storage: ActivityStorage,
  handoff: TourActivityHandoff,
): void {
  storage.setItem(TOUR_ACTIVITY_HANDOFF_KEY, JSON.stringify(handoff))
}

export function consumeTourActivityResult(storage: ActivityStorage): TourActivityResult | null {
  const serialized = storage.getItem(TOUR_ACTIVITY_RESULT_KEY)
  storage.removeItem(TOUR_ACTIVITY_RESULT_KEY)
  if (!serialized) return null
  try {
    const value = JSON.parse(serialized) as TourActivityResult
    return value.version === 1 && value.activityId ? value : null
  } catch {
    return null
  }
}
