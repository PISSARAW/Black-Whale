import { abilityPower } from './nenAbility'
import { isBodyguardBullet } from './bodyguardFirearms'
import { abilityCategories, categoryPower, fightCategoryEfficiency } from './nenCategories'
import { fightAbility } from './nenAbility'
import { shuObject } from './nenAdvanced'
import type { ArcadeFighter, FightProjectile } from './types'

export function isFirearmProjectile(projectile: FightProjectile): boolean {
  if (projectile.corpseGun) return true
  return (
    projectile.matter === 'object' &&
    projectile.shape === 'bullet' &&
    (isBodyguardBullet(projectile) ||
      ['benjamin', 'camilla', 'feitan', 'tserriednich', 'halkenburg'].includes(
        projectile.fighterId,
      ))
  )
}

/** Commit aura at release. A firearm round has ordinary physical ballistics.
 * Detached aura also depends on Emission; a real thrown object needs Shu,
 * rather than acquiring an Emission buff just because it is airborne.
 */
export function commitProjectileNen(
  projectile: FightProjectile,
  fighter: ArcadeFighter,
): FightProjectile {
  if (isFirearmProjectile(projectile))
    return { ...projectile, nenPower: 1, hatsuPower: 1, concealed: false }
  if (projectile.matter === 'object') return commitThrownShu(projectile, fighter)
  return commitEmittedAura(projectile, fighter)
}

function commitThrownShu(projectile: FightProjectile, fighter: ArcadeFighter): FightProjectile {
  const shu =
    fighter.nen.mode !== 'zetsu' && !fighter.nen.on && fighter.nen.shu.includes(shuObject(fighter))
  const power =
    1 +
    0.5 * fightCategoryEfficiency(fighter, 'enhancer') +
    Number(shu && fighter.nen.ko === 'hands') * 0.8
  const duration = Math.round(24 + 36 * fightCategoryEfficiency(fighter, 'emitter'))
  return {
    ...projectile,
    hatsuPower: 1,
    shuCharged: shu,
    concealed: Boolean(projectile.concealed || (shu && fighter.nen.in)),
    nenPower: shu ? power : 1,
    shuFrames: shu ? duration : undefined,
  }
}

export function advanceProjectileNen(projectile: FightProjectile): FightProjectile {
  if (!projectile.shuCharged || projectile.age < (projectile.shuFrames ?? Infinity))
    return projectile
  return { ...projectile, shuCharged: false, nenPower: 1 }
}

function commitEmittedAura(projectile: FightProjectile, fighter: ArcadeFighter): FightProjectile {
  const aura = fighter.nen.mode !== 'zetsu' && !fighter.nen.on
  const categories = abilityCategories(fightAbility(fighter))
  const emitted = categories.includes('emitter') ? 1 : categoryPower(fighter, 'emitter')
  const ren = fighter.nen.mode === 'ren' ? 1.22 : 1
  return {
    ...projectile,
    hatsuPower: 1,
    nenPower: aura ? abilityPower(fighter) * emitted * ren : 0,
    concealed: aura && Boolean(projectile.concealed || fighter.nen.in),
  }
}
