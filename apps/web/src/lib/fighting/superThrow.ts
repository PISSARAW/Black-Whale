import { voluntaryNenAvailable } from './nenAccess'
import type { AttackFrameData } from './frameData'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArcadeFighter } from './types'

/** Arcade tuning: paid on commitment, including a miss or a throw tech. */
export const SUPER_THROW_COST = 25
export const SUPER_THROW_DAMAGE = 1.5
export const THROW_RECOVERY = 54
export const SUPER_THROW_RECOVERY = 84

export function superThrowAvailable(fighter: ArcadeFighter): boolean {
  return fighter.aura >= SUPER_THROW_COST && voluntaryNenAvailable(fighter, { requireHatsu: false })
}

/** A super grab commits its own Nen; releasing Aura must not purchase Ko again. */
export function throwAttackOptions(options: AuraAttackOptions): AuraAttackOptions {
  if (options.variant !== 'throw' || !(options.superThrow || options.auraCharged)) return options
  return { ...options, superThrow: true, auraCharged: false }
}

export function superThrowFrameData(
  data: AttackFrameData,
  fighter: ArcadeFighter,
): AttackFrameData {
  if (fighter.attack?.variant !== 'throw') return data
  if (!fighter.attack.superThrow)
    return { ...data, recovery: Math.max(data.recovery, THROW_RECOVERY) }
  return {
    ...data,
    damage: data.damage * SUPER_THROW_DAMAGE,
    hitstun: data.hitstun + 6,
    hitstop: data.hitstop + 3,
    recovery: Math.max(data.recovery, SUPER_THROW_RECOVERY),
    knockback: data.knockback * 1.15,
  }
}

export function cinematicThrowKnockdown(attacker: ArcadeFighter): number {
  if (attacker.attack?.variant !== 'throw') return 48
  return attacker.attack.superThrow ? SUPER_THROW_RECOVERY + 8 : THROW_RECOVERY + 8
}
