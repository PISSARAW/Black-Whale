import { nenDefenceFactor } from '@black-whale/nen-engine'
import { voluntaryNenAvailable } from '../nenAccess'
import { weaponUsesShu } from '../nenAdvanced'
import type { ArcadeFighter, FightNenZone } from '../types'
/** Numeric multipliers are duel tuning; the zero outside Ko is the actual aura commitment. */
export function regionalDefence(fighter: ArcadeFighter, zone: FightNenZone): number {
  if (fighter.nen.ko) {
    if (!voluntaryNenAvailable(fighter, { requireHatsu: false, requireReserve: true })) return 0
    return fighter.nen.ko === zone ? 1.6 : 0
  }
  return nenDefenceFactor(fighter.nen, zone)
}
/** Reinforced equipment helps an already successful guard; it grants no ballistic immunity. */
export function shuGuardFactor(
  fighter: ArcadeFighter,
  blocked: boolean,
  ballistic = false,
): number {
  return blocked &&
    !ballistic &&
    weaponUsesShu(fighter) &&
    voluntaryNenAvailable(fighter, { requireHatsu: false, requireReserve: true })
    ? 0.85
    : 1
}
