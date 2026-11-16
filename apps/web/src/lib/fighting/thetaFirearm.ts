import type { AuraAttackOptions } from './auraAttackAction'
import type { ArcadeFighter, AttackKind, FightProjectile, FightNenZone } from './types'

const SHOT_HEIGHTS: Readonly<Record<string, { y: number; targetZone: FightNenZone }>> = {
  'theta:neutralSpecial': { y: 6.1, targetZone: 'torso' },
  'theta:forwardSpecial': { y: 9.5, targetZone: 'head' },
  'theta:downSpecial': { y: 2, targetZone: 'feet' },
  'theta:backSpecial': { y: 6.1, targetZone: 'torso' },
}

export function thetaShotMove(fighter: Pick<ArcadeFighter, 'id'>, moveId?: string): boolean {
  return fighter.id === 'theta' && Boolean(moveId && SHOT_HEIGHTS[moveId])
}

export function thetaPhysicalShot(fighter: Pick<ArcadeFighter, 'id'>, kind: AttackKind): boolean {
  return fighter.id === 'theta' && kind === 'ranged'
}

/** Normalize legacy special calls too: L and U fire the same physical handgun. */
export function thetaFirearmOptions(options: AuraAttackOptions): AuraAttackOptions {
  if (options.state[options.side].id !== 'theta' || options.kind !== 'special') return options
  const moveId = options.moveId ?? 'theta:neutralSpecial'
  if (!SHOT_HEIGHTS[moveId]) return options
  return { ...options, kind: 'ranged', moveId, auraCharged: false }
}

export function thetaShotAim(fighter: ArcadeFighter): { y: number; targetZone: FightNenZone } {
  return SHOT_HEIGHTS[fighter.attack?.moveId ?? ''] ?? SHOT_HEIGHTS['theta:neutralSpecial']
}

export function isThetaBullet(
  projectile: Pick<FightProjectile, 'fighterId' | 'matter' | 'shape'>,
): boolean {
  return (
    projectile.fighterId === 'theta' &&
    projectile.matter === 'object' &&
    projectile.shape === 'bullet'
  )
}
