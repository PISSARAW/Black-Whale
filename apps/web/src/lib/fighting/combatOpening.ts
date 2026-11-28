import { attackPhase } from './frameData'
import type { ArcadeFighter } from './types'
import { comboRestraintHeld } from './comboRestraintHold'
import type { ImpactDefence } from './combatDamage'

export function openingType(
  defender: ArcadeFighter,
  blocked: boolean,
): { counterHit: boolean; punish: boolean } {
  if (blocked || !defender.attack) return { counterHit: false, punish: false }
  const phase = attackPhase(defender)
  return {
    counterHit: phase === 'startup' || phase === 'active',
    punish: phase === 'recovery',
  }
}

export function openingDamageMultiplier(opening: { counterHit: boolean; punish: boolean }): number {
  if (opening.counterHit) return 1.1
  if (opening.punish) return 1.15
  return 1
}

export function nextComboHits(defender: ArcadeFighter, defence: ImpactDefence): number {
  if (defence.blocked || defence.avoided) return 0
  const continuing =
    comboRestraintHeld(defender) ||
    defender.hitStun > 0 ||
    defender.knockdownFrames > 0 ||
    defender.y > 0 ||
    defender.juggleCount > 0
  return continuing ? Math.max(1, defender.comboHits + 1) : 1
}

export function comboScale(comboHits: number): number {
  return comboHits <= 1 ? 1 : Math.max(0.4, 1 - (comboHits - 1) * 0.1)
}
