import type { PreparedEntity } from './preparationTypes'
import type { FightState } from './types'

/** Damage to a carrier is not the detonation that consumes its indelible marks. */
export function hasSunMoonMark(entry: PreparedEntity): boolean {
  return Boolean(entry.arena?.sun || entry.arena?.moon)
}
export function hasMarkedTerrain(state: FightState): boolean {
  return Boolean(state.battlefield?.entities.some(hasSunMoonMark))
}
