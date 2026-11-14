import {
  createTourNenProfile,
  createTourSimulation,
  TOUR_NEN_PROFILE_VERSION,
  type TourNenProfile,
  type TourSimulationV1,
  type TrainableNenCategory,
} from './state'
import type { NenCategory } from '@black-whale/domain'
import { createTourNenEnvironment } from './nenEnvironment'

export const TOUR_SIMULATION_KEY = 'black-whale:tour:simulation:v1'
export const MAX_TOUR_SIMULATION_BYTES = 500_000

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function encodeTourSimulation(state: TourSimulationV1): string {
  return JSON.stringify(state)
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function hasSimulationIdentity(value: UnknownRecord): boolean {
  const mode = value.mode
  return (
    value.version === 1 &&
    typeof value.id === 'string' &&
    (mode === 'FREE_LIFE' || mode === 'ALTERNATE_SIMULATION') &&
    Number.isInteger(value.revision) &&
    typeof value.clock === 'number'
  )
}

function hasSimulationCollections(value: UnknownRecord): boolean {
  return (
    isRecord(value.actors) &&
    isRecord(value.reputation) &&
    Array.isArray(value.permissions) &&
    Array.isArray(value.witnesses) &&
    Array.isArray(value.incidents)
  )
}

function hasSimulationWorld(value: UnknownRecord): boolean {
  return isRecord(value.player) && isRecord(value.activities) && isRecord(value.shipSystems)
}

function isTourSimulation(value: unknown): value is TourSimulationV1 {
  return (
    isRecord(value) &&
    hasSimulationIdentity(value) &&
    hasSimulationCollections(value) &&
    hasSimulationWorld(value)
  )
}

export function decodeTourSimulation(serialized: string | null): TourSimulationV1 | null {
  if (!serialized || new TextEncoder().encode(serialized).length > MAX_TOUR_SIMULATION_BYTES)
    return null
  try {
    const value: unknown = JSON.parse(serialized)
    if (!isTourSimulation(value)) return null
    const state = value
    state.player.nenProfile = normaliseNenProfile(state.player.nenProfile)
    state.nenEnvironment ??= createTourNenEnvironment()
    state.nenEnvironment.targets ??= {}
    state.nenEnvironment.traces ??= {}
    return state
  } catch {
    return null
  }
}

const CATEGORIES: TrainableNenCategory[] = [
  'enhancer',
  'emitter',
  'transmuter',
  'conjurer',
  'manipulator',
  'specialist',
]

const AFFINITIES: NenCategory[] = [...CATEGORIES, 'unknown']

function normaliseNenProfile(value: Partial<TourNenProfile> | undefined): TourNenProfile {
  const affinity = AFFINITIES.includes(value?.naturalAffinity as NenCategory)
    ? (value?.naturalAffinity as NenCategory)
    : 'unknown'
  const profile = createTourNenProfile(affinity)
  profile.version = TOUR_NEN_PROFILE_VERSION
  for (const category of CATEGORIES) {
    const mastery = value?.mastery?.[category]
    profile.mastery[category] =
      typeof mastery === 'number' && Number.isFinite(mastery)
        ? Math.max(0, Math.min(100, mastery))
        : 0
  }
  profile.learnedAbilities = Array.isArray(value?.learnedAbilities)
    ? [...new Set(value.learnedAbilities.filter((id): id is string => typeof id === 'string'))]
    : []
  profile.maintainedEffects = Array.isArray(value?.maintainedEffects)
    ? value.maintainedEffects.filter(
        (effect) =>
          typeof effect?.abilityId === 'string' &&
          typeof effect.targetId === 'string' &&
          typeof effect.upkeep === 'number' &&
          typeof effect.startedAt === 'number',
      )
    : []
  return profile
}

export function loadTourSimulation(storage: StorageLike): TourSimulationV1 | null {
  return decodeTourSimulation(storage.getItem(TOUR_SIMULATION_KEY))
}

export function saveTourSimulation(storage: StorageLike, state: TourSimulationV1): boolean {
  try {
    storage.setItem(TOUR_SIMULATION_KEY, encodeTourSimulation(state))
    return true
  } catch {
    return false
  }
}

export function migrateLegacyTourSimulation(value: {
  id?: string
  room?: string
  aura?: number
}): TourSimulationV1 {
  const state = createTourSimulation({ id: value.id ?? 'migrated-tour', spaceId: value.room })
  state.player.aura = Math.max(0, Math.min(100, value.aura ?? 100))
  return state
}
