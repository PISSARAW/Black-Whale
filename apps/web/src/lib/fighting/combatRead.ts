import { attackData } from './frameData'
import type { GuardRequirement } from './combatProperties'
import type { ArcadeFighter, FightProjectile } from './types'

export interface CombatRead {
  attacker?: ArcadeFighter
  guard: GuardRequirement
  concealed: boolean
  position: { x: number; y: number }
}

export function strikeRead(
  attacker: ArcadeFighter & { attack: NonNullable<ArcadeFighter['attack']> },
): CombatRead {
  return {
    attacker,
    guard: attackData(attacker.attack.kind, attacker).guard,
    concealed: attacker.attack.concealed && Boolean(attacker.attack.hatsuSource),
    position: attacker,
  }
}

export function projectileRead(projectile: FightProjectile): CombatRead {
  return {
    guard: projectile.guard ?? 'mid',
    concealed: Boolean(projectile.concealed) && projectile.matter === 'nen',
    position: projectile,
  }
}
