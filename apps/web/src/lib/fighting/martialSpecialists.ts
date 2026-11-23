import type { ArcadeFighter } from './types'

const FAST_TRANSFER_MARTIALS = new Set<string>()

export const BEYOND_REN_DRAIN = -4
export const BEYOND_KO_BONUS = 0.82
export const THETA_BULLET_LETHALITY = 1
export const THETA_STEALTH_BONUS = 1
export const THETA_IN_DRAIN = 3
export const MARTIAL_KAMEO_COOLDOWN_FACTOR = 1
export const YOKOTANI_KAMEO_COOLDOWN_FACTOR = 1

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

/** No character receives an invented Kameo bonus merely for lacking a revealed duel Hatsu. */
export function kameoCooldownFactor(leader: Pick<ArcadeFighter, 'id' | 'nenOwner'>): number {
  void leader
  return 1
}

/** Theta's material handgun uses the ordinary physical-projectile damage rules. */
export function thetaBulletDamageFactor(
  attacker: ArcadeFighter,
  physicalProjectile?: boolean,
): number {
  void attacker
  void physicalProjectile
  return 1
}
