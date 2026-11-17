import { comboScale } from './combatDamage'
import { schemeDamageFactor } from './controlScheme'
import { hasCancelGrammar } from './duelComboProfiles'
import { moveById } from './movesets'
import type { ArcadeFighter } from './types'

/** Tiered grammar: two full hits, then −10 points per hit; supers keep half their damage. */
export const TIERED_FULL_HITS = 2
export const TIERED_SCALE_STEP = 0.1
export const TIERED_SCALE_FLOOR = 0.1
export const TIERED_SUPER_FLOOR = 0.5

export function tieredComboScale(comboHits: number, superMove: boolean): number {
  const scale = 1 - Math.max(0, comboHits - TIERED_FULL_HITS) * TIERED_SCALE_STEP
  return Math.max(superMove ? TIERED_SUPER_FLOOR : TIERED_SCALE_FLOOR, scale)
}

/**
 * Damage scaling for a contact; fighters without the tiered grammar keep comboScale.
 * Grammar supers also carry the simplified-command penalty (controlScheme.ts).
 */
export function attackerComboScale(attacker: ArcadeFighter, comboHits: number): number {
  if (!hasCancelGrammar(attacker.id)) return comboScale(comboHits)
  const category = moveById(attacker.attack?.moveId)?.category
  const superMove = category === 'special' || category === 'finisher'
  return tieredComboScale(comboHits, superMove) * schemeDamageFactor(attacker, superMove)
}
