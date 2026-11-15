import type { AttackFrameData } from './frameData'
import type { ArcadeFighter, AttackKind, AttackVariant } from './types'

export function selectedVariant(fighter: ArcadeFighter): AttackVariant {
  if (fighter.y > 0) return 'air'
  return fighter.crouching ? 'low' : 'standing'
}

export function variantData(options: {
  fighter: ArcadeFighter
  kind: AttackKind
  data: AttackFrameData
}): AttackFrameData {
  const { fighter, kind } = options
  const data = comboData(options)
  const variant = fighter.attack?.variant
  if (variant === 'throw')
    return {
      ...data,
      startup: 7,
      active: 2,
      recovery: 25,
      damage: 14,
      hitstun: 30,
      knockback: 7,
      lunge: 0,
      cancelEnd: 0,
      box: { left: 0, right: 6, bottom: 0, top: 10 },
    }
  if (kind !== 'light' && kind !== 'heavy') return data
  if (variant === 'low')
    return {
      ...data,
      targetZone: 'feet',
      auraZone: 'feet',
      damage: data.damage * 0.85,
      box: { ...data.box, bottom: 0, top: 4.5 },
    }
  if (variant === 'air')
    return { ...data, targetZone: 'head', box: { ...data.box, bottom: -5, top: 5 } }
  return data
}

export function canCancel(fighter: ArcadeFighter, kind: AttackKind): boolean {
  const attack = fighter.attack
  if (!attack?.confirmedHit || attack.variant === 'throw') return false
  const routes: Partial<Record<AttackKind, AttackKind[]>> = {
    light: ['heavy'],
    heavy: ['special'],
  }
  return Boolean(routes[attack.kind]?.includes(kind))
}

export function blocksAttack(defender: ArcadeFighter, attacker: ArcadeFighter): boolean {
  if (!defender.blocking || defender.y > 0) return false
  if (attacker.attack?.variant === 'throw') return false
  if (attacker.attack?.variant === 'low') return Boolean(defender.crouching)
  if (attacker.attack?.variant === 'air') return !defender.crouching
  return true
}

function comboData(options: {
  fighter: ArcadeFighter
  kind: AttackKind
  data: AttackFrameData
}): AttackFrameData {
  if (!['kurapika', 'hisoka'].includes(options.fighter.id)) return options.data
  if (options.kind === 'light') return { ...options.data, hitstun: 18 }
  if (options.kind === 'heavy') return { ...options.data, hitstun: 24 }
  return options.data
}

export function attackVariant(options: {
  fighter: ArcadeFighter
  kind: AttackKind
  variant?: AttackVariant
}): AttackVariant {
  if (options.kind !== 'light' && options.kind !== 'heavy') return 'standing'
  return options.variant ?? selectedVariant(options.fighter)
}
