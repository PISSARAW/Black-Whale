import type { ProjectileProfile } from './projectiles'
import type { ArcadeFighter, AttackKind, FightProjectile, FighterId } from './types'

/** Royal bodyguards and the two armed princes receive physical duel equipment.
 * Kurapika, Bill, Furykov, Theta and Musse explicitly carry firearms in the manga.
 * A shared pistol for the other guards is a loadout convention, not an attested model/calibre.
 */
export const BODYGUARD_FIREARMS = [
  'kurapika',
  'bill',
  'furykov',
  'rihan',
  'musse',
  'theta',
  'longhi',
  'sayird',
  'basho',
  'melody',
  'hanzo',
  'biscuit',
  'tserriednich',
  'halkenburg',
] as const satisfies readonly FighterId[]

const GUARDS: ReadonlySet<FighterId> = new Set(BODYGUARD_FIREARMS)

export function hasBodyguardFirearm(id: FighterId): boolean {
  return GUARDS.has(id)
}

export function bodyguardPhysicalShot(
  fighter: Pick<ArcadeFighter, 'id'>,
  kind: AttackKind,
): boolean {
  return kind === 'ranged' && hasBodyguardFirearm(fighter.id)
}

export function bodyguardFiring(fighter: ArcadeFighter): boolean {
  return bodyguardPhysicalShot(fighter, fighter.attack?.kind ?? 'light')
}

/** Two close strikes use the gripped service weapon as a physical contact prop. */
export function bodyguardPistolStrike(fighter: ArcadeFighter): boolean {
  if (fighter.weaponsConfiscated || fighter.attack?.kind !== 'heavy') return false
  const move = fighter.attack.moveId
  return (
    (fighter.id === 'halkenburg' && move === 'halkenburg:standingHeavy') ||
    (fighter.id === 'bill' && move === 'bill:backHeavy')
  )
}

/** Release height follows the compact bodies; the gun stays physical in either Biscuit form. */
export function bodyguardShotHeight(fighter: ArcadeFighter, fallback: number): number {
  if (fighter.id === 'biscuit') return fighter.biscuitTrueForm ? 14.4 : 5.3
  return fighter.id === 'melody' ? 9 : fallback
}

/** Gameplay ballistics; no claimed calibre, emitted aura, Shu or Hatsu damage. */
export const BODYGUARD_PISTOL: ProjectileProfile = {
  matter: 'object',
  labelFr: 'Pistolet de service',
  labelEn: 'Service handgun',
  shape: 'bullet',
  colour: '#d8c7a0',
  speed: 76,
  damage: 10,
  width: 0.55,
  height: 0.2,
  hitstun: 13,
  blockstun: 9,
  hitstop: 5,
  knockback: 2.2,
  y: 11.4,
}

export function isBodyguardBullet(
  projectile: Pick<FightProjectile, 'fighterId' | 'matter' | 'shape'>,
): boolean {
  return (
    hasBodyguardFirearm(projectile.fighterId) &&
    projectile.matter === 'object' &&
    projectile.shape === 'bullet'
  )
}
