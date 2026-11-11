import type { TourWorldMode } from './mode'
import { createNenTechniqueState, type NenTechniqueState } from '@black-whale/nen-engine'

export interface SimulatedActorState {
  spaceId: string
  objective: string
  memory: string[]
  nextDecisionAt: number
}

export interface TourSimulationV1 {
  version: 1
  id: string
  mode: Exclude<TourWorldMode, 'CANONICAL_VISIT'>
  revision: number
  clock: number
  player: {
    spaceId: string
    aura: number
    inventory: string[]
    knowledge: string[]
    nen: NenTechniqueState<string>
  }
  actors: Record<string, SimulatedActorState>
  reputation: Record<string, number>
  permissions: string[]
  witnesses: string[]
  incidents: string[]
  activities: Record<
    string,
    {
      stage: string
      status: 'AVAILABLE' | 'ACTIVE' | 'RESOLVED' | 'FAILED'
      data: Record<string, string | number | boolean>
    }
  >
  shipSystems: Record<
    string,
    {
      power: number
      lighting: number
      ventilation: number
      noise: number
      circulation: number
      doorsLocked: boolean
      fire: boolean
    }
  >
}

export function createTourSimulation(input: {
  id: string
  mode?: TourSimulationV1['mode']
  spaceId?: string
}): TourSimulationV1 {
  if (!input.id.trim()) throw new Error('A simulation id is required')
  return {
    version: 1,
    id: input.id,
    mode: input.mode ?? 'FREE_LIFE',
    revision: 0,
    clock: 0,
    player: {
      spaceId: input.spaceId ?? 'tier-5-main-corridor',
      aura: 100,
      inventory: [],
      knowledge: [],
      nen: createNenTechniqueState<string>(),
    },
    actors: {},
    reputation: {},
    permissions: [],
    witnesses: [],
    incidents: [],
    activities: {},
    shipSystems: {},
  }
}

export function evolveTourSimulation(
  state: TourSimulationV1,
  update: (draft: TourSimulationV1) => void,
): TourSimulationV1 {
  const next = structuredClone(state)
  update(next)
  next.revision = state.revision + 1
  return next
}
