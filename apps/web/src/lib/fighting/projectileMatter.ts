import type { FightProjectile } from './types'

/** Conjured physical pieces are solid matter too; an emitted beam is not an object to grip.
 * Blinky still uses the separate Nen-material prohibition. */
export function physicalProjectile(shot: FightProjectile): boolean {
  return shot.matter === 'object' || Boolean(shot.materialCopyId)
}
