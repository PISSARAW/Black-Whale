import { hasCancelGrammar } from './duelComboProfiles'
import { moveById } from './movesets'
import type { ArcadeFighter } from './types'

/** Arcade hitstun decay; no new escape, invulnerability or change to a Hatsu condition. */
export const FULL_GROUNDED_COMBO_HITS = 3
export const GROUNDED_STUN_DECAY = 4

export function groundedComboStun(options: {
  attacker: ArcadeFighter
  defender: ArcadeFighter
  hitstun: number
  comboHits: number
}): number {
  if (options.defender.y > 0) return options.hitstun
  // The tiered grammar bounds combos by damage scaling and an acyclic cancel graph.
  if (hasCancelGrammar(options.attacker.id)) return options.hitstun
  const move = moveById(options.attacker.attack?.moveId)
  if (!move || (move.category !== 'normal' && move.category !== 'command')) return options.hitstun
  const extraHits = Math.max(0, options.comboHits - FULL_GROUNDED_COMBO_HITS)
  return Math.max(1, options.hitstun - extraHits * GROUNDED_STUN_DECAY)
}
