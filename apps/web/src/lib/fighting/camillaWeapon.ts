import type { ProjectileProfile } from './projectiles'

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
