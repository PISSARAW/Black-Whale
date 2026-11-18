import type { ProjectileProfile } from './projectiles'
import type { ArcadeFighter } from './types'

/** Finite magazine shown in ch. 373. Its capacity here is duel tuning, not a claimed calibre. */
export const CAMILLA_MAGAZINE_ROUNDS = 12
export function camillaRounds(fighter: ArcadeFighter): number {
  return fighter.camillaRounds ?? CAMILLA_MAGAZINE_ROUNDS
}
export function camillaCanFire(fighter: ArcadeFighter): boolean {
  return (fighter.nenOwner ?? fighter.id) !== 'camilla' || camillaRounds(fighter) > 0
}
export function spendCamillaRound(fighter: ArcadeFighter): ArcadeFighter {
  return (fighter.nenOwner ?? fighter.id) === 'camilla'
    ? { ...fighter, camillaRounds: Math.max(0, camillaRounds(fighter) - 1) }
    : fighter
}

/** Ch. 373: a physical firearm, not an emitted bullet or an offensive Cat's Name. */
export const CAMILLA_PISTOL: ProjectileProfile = {
  matter: 'object',
  labelFr: 'Pistolet',
  labelEn: 'Pistol',
  shape: 'bullet',
  colour: '#ffe4a1',
  speed: 100,
  damage: 12,
  width: 0.7,
  height: 0.2,
  hitstun: 13,
  blockstun: 9,
  hitstop: 5,
  knockback: 2.2,
  y: 6.1,
}
