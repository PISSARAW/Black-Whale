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

function gyoObservations(action: NenTechniqueAction<string>, context: TourNenContext): string[] {
  if (action.type !== 'GYO' || !action.on) return []
  return (context.traces ?? []).map((trace) => `aura-trace:${trace.id}`)
}

function enObservations(action: NenTechniqueAction<string>, context: TourNenContext): string[] {
  if (action.type !== 'EN' || action.radius === null) return []
  return (context.presences ?? [])
    .filter((presence) => presence.distance <= action.radius!)
    .map((presence) => `presence:${presence.id}:unidentified`)
}

function zetsuObservations(action: NenTechniqueAction<string>, context: TourNenContext): string[] {
  if (action.type !== 'ZETSU') return []
  return (context.presences ?? [])
    .filter((presence) => presence.physicallyVisible)
    .map((presence) => `visible-body:${presence.id}`)
}

function observationsFor(action: NenTechniqueAction<string>, context: TourNenContext): string[] {
  return [
    ...gyoObservations(action, context),
    ...enObservations(action, context),
    ...zetsuObservations(action, context),
  ]
}

/** Apply shared Nen rules, then project only information the technique can justify. */
export function useSystemicNen(
  state: TourSimulationV1,
  action: NenTechniqueAction<string>,
  context: TourNenContext = {},
): TourNenResolution {
  const transition = transitionNen(state.player.nen, action)
  if (!transition.accepted)
    return { state, accepted: false, observations: [], reason: transition.reason }
  const cost = ACTION_COST[action.type] ?? 0
  if (state.player.aura < cost)
    return { state, accepted: false, observations: [], reason: 'INSUFFICIENT_AURA' }
  const observations = observationsFor(action, context)

  const next = evolveTourSimulation(state, (draft) => {
    draft.player.nen = transition.state
    draft.player.aura -= cost
    for (const observation of observations)
      if (!draft.player.knowledge.includes(observation)) draft.player.knowledge.push(observation)
  })
  return { state: next, accepted: true, observations }
}
