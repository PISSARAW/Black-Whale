import type { ArcadeFighter, FightProjectile } from './types'

export function strikeRead(
  attacker: ArcadeFighter & { attack: NonNullable<ArcadeFighter['attack']> },
) {
  return {
    attacker,
    concealed: attacker.attack.concealed && Boolean(attacker.attack.hatsuSource),
    position: attacker,
  }
}

export function projectileRead(projectile: FightProjectile) {
  return {
    concealed: Boolean(projectile.concealed) && projectile.matter === 'nen',
    position: projectile,
  }
}
