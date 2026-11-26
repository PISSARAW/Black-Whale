import { moveById } from './movesets'
import type { ArcadeFighter } from './types'

/**
 * A body lying on the ground barely slides under a combo route: a hit that reaches it there
 * through an accélération or a hold (attack.accel, accelCancel.ts) pushes it at most this
 * far. Moves that natively strike a downed body keep their push. Duel tuning, not canon.
 */
export const GROUNDED_PIN_KNOCKBACK = 1.5

export function pinnedKnockback(
  hit: { fighter: ArcadeFighter; attacker: ArcadeFighter; melee?: boolean },
  knockback: number,
): number {
  if (hit.fighter.knockdownFrames === 0 || !hit.attacker.attack?.accel) return knockback
  // A shot that holds the lying body (pinnedKnockdown below) does not push it out of the cone.
  return hit.melee ? Math.min(knockback, GROUNDED_PIN_KNOCKBACK) : 0
}

/**
 * Feu de suppression (SIGNATURE_COMBOS.md): a shot that extends a combo out of an accélération
 * and reaches a body on the ground keeps it there for at least the hitstun of its volley. The volley aims
 * at the lying body (culdceptHold.ts comboShotHeight), so the body never stands up mid-volley.
 */
export function pinnedKnockdown(
  options: { fighter: ArcadeFighter; attacker: ArcadeFighter; melee?: boolean; blocked: boolean },
  hitstun: number,
): number {
  const { fighter, attacker } = options
  if (options.blocked || fighter.knockdownFrames === 0) return fighter.knockdownFrames
  // Keep a body down through the active reaction when a grounded strike lands.
  if (options.melee) return Math.max(fighter.knockdownFrames, hitstun)
  if (!attacker.attack?.accel) return fighter.knockdownFrames
  // The hold lasts the volley's own hitstun, not the single bullet's.
  const volley = moveById(attacker.attack.moveId)?.tuning.hitstun ?? 0
  return Math.max(fighter.knockdownFrames, hitstun, volley)
}
