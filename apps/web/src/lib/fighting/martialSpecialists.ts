import type { ArcadeFighter } from './types'

const FAST_TRANSFER_MARTIALS = new Set(['cluck', 'sayird', 'yokotani'])

export const BEYOND_REN_DRAIN = -2
export const BEYOND_KO_BONUS = 1.05
export const THETA_BULLET_LETHALITY = 1.2
export const THETA_STEALTH_BONUS = 1.15
export const THETA_IN_DRAIN = 1.5
export const MARTIAL_KAMEO_COOLDOWN_FACTOR = 0.7
export const YOKOTANI_KAMEO_COOLDOWN_FACTOR = 0.65

const ownerId = (fighter: Pick<ArcadeFighter, 'id' | 'nenOwner'>) => fighter.nenOwner ?? fighter.id

export function isBeyond(fighter: Pick<ArcadeFighter, 'id' | 'nenOwner'>): boolean {
  return ownerId(fighter) === 'beyond'
}

export function isTheta(fighter: Pick<ArcadeFighter, 'id' | 'nenOwner'>): boolean {
  return ownerId(fighter) === 'theta'
}

export function hasFastMartialTransfer(fighter: Pick<ArcadeFighter, 'id' | 'nenOwner'>): boolean {
  return FAST_TRANSFER_MARTIALS.has(ownerId(fighter))
}

/** Cluck, Sayird (-30%), and Yokotani (-35%) cycle Kameo support faster to offset having no duel Hatsu. */
export function kameoCooldownFactor(leader: Pick<ArcadeFighter, 'id' | 'nenOwner'>): number {
  if (ownerId(leader) === 'yokotani') return YOKOTANI_KAMEO_COOLDOWN_FACTOR
  return hasFastMartialTransfer(leader) ? MARTIAL_KAMEO_COOLDOWN_FACTOR : 1
}

/** Theta's physical handgun ignores Emission penalties and gains stealth lethality from In/Zetsu. */
export function thetaBulletDamageFactor(attacker: ArcadeFighter, physicalProjectile?: boolean): number {
  if (!physicalProjectile || !isTheta(attacker)) return 1
  const stealth = attacker.nen.in || attacker.nen.mode === 'zetsu'
  return THETA_BULLET_LETHALITY * (stealth ? THETA_STEALTH_BONUS : 1)
}
