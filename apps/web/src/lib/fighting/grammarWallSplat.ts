import { hasCancelGrammar } from './duelComboProfiles'
import { KNOCKDOWN_KNOCKBACK } from './towerJudging'
import type { ArcadeFighter } from './types'

/**
 * Under the tiered grammar the corner never changes a normal's frame advantage: only a
 * knockdown-strength blow splats. Otherwise +5 wall hitstun turns every jab into a loop.
 */
export function grammarAllowsWallSplat(attacker: ArcadeFighter, knockback: number): boolean {
  return !hasCancelGrammar(attacker.id) || knockback >= KNOCKDOWN_KNOCKBACK
}
