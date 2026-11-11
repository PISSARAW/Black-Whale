import { transitionNen, type NenTechniqueAction } from '@black-whale/nen-engine'
import { evolveTourSimulation, type TourSimulationV1 } from './state'

export interface TourNenPresence {
  id: string
  distance: number
  physicallyVisible: boolean
  auraConcealed: boolean
}

export interface TourNenTrace {
  id: string
  hiddenWithIn: boolean
}

export interface TourNenContext {
  presences?: TourNenPresence[]
  traces?: TourNenTrace[]
}

export interface TourNenResolution {
  state: TourSimulationV1
  accepted: boolean
  observations: string[]
  reason?: string
}

const ACTION_COST: Partial<Record<NenTechniqueAction['type'], number>> = {
  GYO: 2,
  EN: 5,
  SHU: 3,
  KEN: 4,
  KO: 12,
  REN: 2,
}

/** Apply shared Nen rules, then project only information the technique can justify. */
export function useSystemicNen(
  state: TourSimulationV1,
  action: NenTechniqueAction<string>,
  context: TourNenContext = {},
): TourNenResolution {
  const transition = transitionNen(state.player.nen, action)
  if (!transition.accepted) return { state, accepted: false, observations: [], reason: transition.reason }
  const cost = ACTION_COST[action.type] ?? 0
  if (state.player.aura < cost)
    return { state, accepted: false, observations: [], reason: 'INSUFFICIENT_AURA' }
  const observations: string[] = []

  if (action.type === 'GYO' && action.on)
    for (const trace of context.traces ?? []) observations.push(`aura-trace:${trace.id}`)

  if (action.type === 'EN' && action.radius !== null) {
    for (const presence of context.presences ?? []) {
      if (presence.distance > action.radius) continue
      // En establishes a presence, not an identity or exact intention.
      observations.push(`presence:${presence.id}:unidentified`)
    }
  }

  // Zetsu erases the aura signature, never the physically visible body.
  if (action.type === 'ZETSU')
    for (const presence of context.presences ?? [])
      if (presence.physicallyVisible) observations.push(`visible-body:${presence.id}`)

  const next = evolveTourSimulation(state, (draft) => {
    draft.player.nen = transition.state
    draft.player.aura -= cost
    for (const observation of observations)
      if (!draft.player.knowledge.includes(observation)) draft.player.knowledge.push(observation)
  })
  return { state: next, accepted: true, observations }
}
