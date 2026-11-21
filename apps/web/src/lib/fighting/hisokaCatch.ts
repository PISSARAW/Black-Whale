import { gumSupportLive } from './hisokaSupportOrigin'
import { freeDeviceHand, physicalHandOccupancy, physicalHandsBusy } from './deviceHands'
import { physicalProjectile } from './projectileMatter'
import { prepareDefence } from './combatDefence'
import { projectileRead } from './combatRead'
import { resolvedDamage, strikeProjectileDefender } from './combatDamage'
import { recordFightDeath } from './fightDeaths'
import type { ProjectileHit } from './projectiles'
import type { ArcadeFighter, FightProjectile, FightState } from './types'

/** The rubber stops the physical object, not the force transmitted to Hisoka's hands (Greed Island). */
export function catchBungeeObject(state: FightState, hit: ProjectileHit): FightState | null {
  const fighter = state[hit.defenderSide],
    shot = hit.projectile
  if (
    !gumSupportLive(state, hit.defenderSide, fighter.gumCatch) ||
    !canCatch(fighter, shot) ||
    !catchHandReady(state, hit.defenderSide)
  )
    return null
  const defence = prepareDefence({ ...fighter, blocking: false }, 'hands', projectileRead(shot))
  if (defence.avoided) return null
  const damage = resolvedDamage({
    attacker: state[shot.owner],
    defence,
    base: shot.damage * 0.35,
    zone: 'hands',
    kind: 'ranged',
    damageScale: 1,
    openingMultiplier: 1,
    projectileNenPower: shot.nenPower,
  })
  const struck = strikeProjectileDefender({
    fighter,
    attacker: state[shot.owner],
    zone: 'hands',
    projectile: shot,
    damage,
    blocked: false,
    knockdown: false,
    antiAir: false,
    wallSplat: false,
    counterHit: false,
    comboHits: 1,
  })
  const next = {
    ...state,
    hitstop: shot.hitstop,
    impact: caughtImpact(state, hit, damage),
    [hit.defenderSide]: {
      ...struck,
      gumCatch: {
        ...fighter.gumCatch,
        frames: 0,
        hidden: fighter.gumCatch?.hidden,
        projectile: { ...shot, velocityX: 0 },
        incomingSpeed: Math.abs(shot.velocityX),
      },
    },
  }
  return recordFightDeath(next, {
    victimSide: hit.defenderSide,
    killerSide: shot.owner,
    cause: 'projectile',
  })
}

function catchHandReady(state: FightState, side: import('./types').FightSide): boolean {
  const actor = state[side]
  const hand = actor.gumCatch?.hand ?? freeDeviceHand(state, side)
  return Boolean(hand && !physicalHandsBusy(actor) && !physicalHandOccupancy(state, side).has(hand))
}

function canCatch(fighter: ArcadeFighter, shot: FightProjectile): boolean {
  if (!fighter.gumCatch?.frames || fighter.gumCatch.projectile) return false
  if (!physicalProjectile(shot) || shot.living || shot.remotePunch) return false
  return shot.velocityX * fighter.facing < 0 && (shot.x - fighter.x) * fighter.facing >= -shot.width
}

function caughtImpact(state: FightState, hit: ProjectileHit, damage: number): FightState['impact'] {
  return {
    sequence: (state.impact?.sequence ?? 0) + 1,
    attacker: hit.projectile.owner,
    kind: 'ranged',
    damage,
    blocked: false,
    parried: false,
    critical: false,
    knockdown: false,
    counterHit: false,
    punish: false,
    antiAir: false,
    wallSplat: false,
    invulnerable: false,
    comboHits: 1,
    damageScale: 1,
    points: 0,
    zone: 'hands',
    concealed: Boolean(hit.projectile.concealed),
    avoided: false,
    projectileId: hit.projectile.id,
    position: hit.position,
  }
}
