import { hasCancelGrammar } from './duelComboProfiles'
import { KNOCKDOWN_KNOCKBACK } from './knockdownRules'
import type { ArcadeFighter } from './types'

/**
 * Under the tiered grammar the corner never changes a normal's frame advantage: only a
 * knockdown-strength blow splats. A genuine counter hit is the finite exception used by the
 * authored corner-counter routes; an ordinary jab at the wall still cannot start a loop.
 */
export function grammarAllowsWallSplat(
  attacker: ArcadeFighter,
  knockback: number,
  counterHit = false,
): boolean {
  return counterHit || !hasCancelGrammar(attacker.id) || knockback >= KNOCKDOWN_KNOCKBACK
}
