import type { PreparedEntity } from './preparationTypes'

/** Upper bound of the manga's 3–5 seconds, at 60 simulation steps per second. */
export const SUN_MOON_FULL_CONTACT = 5 * 60
/** Damage, radius and partial interpolation are duel calibration, not manga measurements. */
export function sunMoonBlastPower(sun: PreparedEntity, moon: PreparedEntity) {
  const contact = Math.max(sun.arena?.sunCharge ?? 0, moon.arena?.moonCharge ?? 0)
  const ratio = Math.min(1, Math.max(0, contact / SUN_MOON_FULL_CONTACT))
  return {
    damage: 20 + Math.floor(40 * ratio),
    guardDamage: 5 + Math.floor(10 * ratio),
    radius: 12 + 6 * ratio,
  }
}
