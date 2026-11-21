import type { ArcadeFighter } from './types'

/**
 * A body lying on the ground barely slides under a combo route: a hit that reaches it there
 * through an accélération or a hold (attack.accel, accelCancel.ts) pushes it at most this
 * far. Moves that natively strike a downed body keep their push. Duel tuning, not canon.
 */
export const GROUNDED_PIN_KNOCKBACK = 1.5

export function pinnedKnockback(
  defender: ArcadeFighter,
  attacker: ArcadeFighter,
  knockback: number,
): number {
  if (defender.knockdownFrames === 0 || !attacker.attack?.accel) return knockback
  return Math.min(knockback, GROUNDED_PIN_KNOCKBACK)
}
