import { Vector3 } from 'three'
import type { ArcadeFighter } from './types'

/** Maximum presentation-only reach correction; larger gaps must remain honest whiffs. */
export const GOLDEN_HEAVY_CONTACT_CORRECTION = 0.14

export function boundedGoldenHeavyContact(
  fighter: ArcadeFighter,
  current: Vector3,
  target: Vector3,
): Vector3 {
  if (fighter.attack?.moveId !== 'kurapika:standingHeavy') return target.clone()
  const correction = target.clone().sub(current)
  if (correction.length() <= GOLDEN_HEAVY_CONTACT_CORRECTION) return target.clone()
  return current.clone().add(correction.setLength(GOLDEN_HEAVY_CONTACT_CORRECTION))
}
