import { hasCancelGrammar } from './duelComboProfiles'
import { moveById } from './movesets'
import type { ArcadeFighter } from './types'

/**
 * Hitstun applied to a grounded combo contact. The universal CancelTier bounds combos by
 * damage scaling and an acyclic cancel graph, and corner pushback transfers the distance the
 * wall refused to the attacker, so hitstun no longer decays (STEP3 retired).
 */
export function groundedComboStun(options: {
  attacker: ArcadeFighter
  defender: ArcadeFighter
  hitstun: number
  comboHits: number
}): number {
  if (options.defender.y > 0) return options.hitstun
  if (hasCancelGrammar(options.attacker.id)) return options.hitstun
  const move = moveById(options.attacker.attack?.moveId)
  if (!move || (move.category !== 'normal' && move.category !== 'command')) return options.hitstun
  return options.hitstun
}
