import { tieredComboScale } from '../fighting/comboDamageScale'
import type { FighterMove } from '../fighting/movesetTypes'
import { clashAttackFactor, clashDamageFactor, clashZone, criticalAuraStrike } from './clashNen'
import type { BodyZone, FighterState, Impact } from './types'

/**
 * Damage Clash would deal, after its Nen factors and combo scaling, that a move
 * needs for each impact. Higher than the raw-damage tiers because a Ren attacker
 * multiplies authored damage by roughly 1.2 to 1.5.
 */
export const CLASH_CLEAN_BELOW = 12
export const CLASH_CRITICAL_BELOW = 20

export type ExchangeGrade = (
  attacker: FighterState,
  defender: FighterState,
  zone: BodyZone,
) => Impact

/**
 * Grades a Clash move the way Clash deals it: the guard command blocks (throws
 * clear it first), otherwise the authored damage is multiplied by the
 * attacker's Nen on the striking limb and by what the defender's aura lets
 * through on the struck zone. A Ko on the striking limb makes it critical; the
 * finisher, Arena's combo ender, knocks out.
 */
export function clashGrade(move: FighterMove, hitsBefore: number): ExchangeGrade {
  return (attacker, defender, zone) => {
    if (defender.guardWindow > 0) return 'blocked'
    if (move.category === 'finisher') return 'ko'
    const auraZone = move.tuning.auraZone
    const damage =
      move.tuning.damage *
      tieredComboScale(hitsBefore, move.category === 'special') *
      clashAttackFactor(attacker, auraZone) *
      clashDamageFactor(defender, clashZone(zone))
    const tier = damageTier(damage)
    return tier === 'clean' && criticalAuraStrike(attacker, auraZone) ? 'critical' : tier
  }
}

function damageTier(damage: number): Impact {
  if (damage < CLASH_CLEAN_BELOW) return 'clean'
  return damage < CLASH_CRITICAL_BELOW ? 'critical' : 'knockdown'
}
