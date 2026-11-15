import type { TourWorldMode } from './mode'
import { createNenTechniqueState, type NenTechniqueState } from '@black-whale/nen-engine'
import type { NenCategory } from '@black-whale/domain'
import { createTourNenEnvironment, type TourNenEnvironment } from './nenEnvironment'

export const TOUR_NEN_PROFILE_VERSION = 1 as const

export type TrainableNenCategory = Exclude<NenCategory, 'unknown'>

export interface TourNenProfile {
  version: typeof TOUR_NEN_PROFILE_VERSION
  naturalAffinity: NenCategory
  mastery: Record<TrainableNenCategory, number>
  learnedAbilities: string[]
  maintainedEffects: Array<{
    abilityId: string
    targetId: string
    upkeep: number
    startedAt: number
  }>
}

export function createTourNenProfile(affinity: NenCategory = 'unknown'): TourNenProfile {
  return {
    version: TOUR_NEN_PROFILE_VERSION,
    naturalAffinity: affinity,
    mastery: {
      enhancer: 0,
      emitter: 0,
      transmuter: 0,
      conjurer: 0,
      manipulator: 0,
      specialist: 0,
    },
    learnedAbilities: [],
    maintainedEffects: [],
  }
}

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
    nenProfile: TourNenProfile
  }
  actors: Record<string, SimulatedActorState>
  reputation: Record<string, number>
  permissions: string[]
  witnesses: string[]
  witnessKnowledge: Record<string, string[]>
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
  nenEnvironment: TourNenEnvironment
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
      nenProfile: createTourNenProfile(),
    },
    actors: {},
    reputation: {},
    permissions: [],
    witnesses: [],
    witnessKnowledge: {},
    incidents: [],
    activities: {},
    shipSystems: {},
    nenEnvironment: createTourNenEnvironment(),
  }
}

export function evolveTourSimulation(
  state: TourSimulationV1,
  update: (draft: TourSimulationV1) => void,
): TourSimulationV1 {
  // Svelte wraps assigned objects in reactive proxies. The simulation is a
  // JSON persistence contract, so this also safely unwraps those proxies.
  const next = JSON.parse(JSON.stringify(state)) as TourSimulationV1
  update(next)
  next.revision = state.revision + 1
  return next
}
