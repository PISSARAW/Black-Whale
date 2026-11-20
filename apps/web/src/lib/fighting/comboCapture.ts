import type { ArcadeFighter } from './types'

/**
 * A combo capture (a throw that ends an accélération, throwRules.ts) holds its target
 * instead of throwing it away. Kept free of runtime imports: frameData.ts reads it.
 */
export function throwKnockback(
  move: { variant?: string },
  attacker: ArcadeFighter,
  base: number,
): number {
  return move.variant === 'throw' && attacker.attack?.accel ? 0 : base
}
