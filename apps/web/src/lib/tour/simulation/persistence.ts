import { createTourSimulation, type TourSimulationV1 } from './state'

export const TOUR_SIMULATION_KEY = 'black-whale:tour:simulation:v1'
export const MAX_TOUR_SIMULATION_BYTES = 500_000

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function encodeTourSimulation(state: TourSimulationV1): string {
  return JSON.stringify(state)
}

export function decodeTourSimulation(serialized: string | null): TourSimulationV1 | null {
  if (!serialized || new TextEncoder().encode(serialized).length > MAX_TOUR_SIMULATION_BYTES)
    return null
  try {
    const value = JSON.parse(serialized) as Partial<TourSimulationV1>
    if (
      value.version !== 1 ||
      typeof value.id !== 'string' ||
      (value.mode !== 'FREE_LIFE' && value.mode !== 'ALTERNATE_SIMULATION') ||
      !Number.isInteger(value.revision) ||
      typeof value.clock !== 'number' ||
      !value.player ||
      typeof value.actors !== 'object' ||
      typeof value.reputation !== 'object' ||
      !Array.isArray(value.permissions) ||
      !Array.isArray(value.witnesses) ||
      !Array.isArray(value.incidents)
      || typeof value.activities !== 'object'
      || typeof value.shipSystems !== 'object'
    )
      return null
    return value as TourSimulationV1
  } catch {
    return null
  }
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
