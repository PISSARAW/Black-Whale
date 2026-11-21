import { attackPhase } from './frameData'
import { abandonHalkenburgShot, halkenburgShotConditionsHold } from './halkenburgCollective'
import { readyCohort } from './preparationWorld'
import { applyHalkenburgSoulArrow } from './halkenburgSouls'
import { controlledSoulKey, halkenburgMode, soulBodyKey } from './halkenburgSoulTypes'
import type { ArcadeFighter, FightProjectile, FightSide, FightState } from './types'

declare module './types' {
  interface FightProjectile {
    halkenburgArrow?: {
      participant: string
      mode?: import('./halkenburgSoulTypes').HalkenburgMode
      archerBody?: string
      participantMind?: string
    }
  }
  interface ArcadeFighter {
    halkenburgGroupProtection?: boolean
  }
}
export function halkenburgArrowUtility(fighter: ArcadeFighter): boolean {
  return fighter.attack?.kind === 'special' && fighter.attack.hatsuSource === 'halkenburg'
}
export function launchHalkenburgArrow(state: FightState, side: FightSide): FightState {
  const actor = state[side],
    attack = actor.attack
  if (
    !attack ||
    !halkenburgArrowUtility(actor) ||
    attack.projectileSpawned ||
    attackPhase(actor) !== 'active'
  )
    return state
  if (!actor.hatsuEffects.arrowNocked || !actor.halkenburgSupporter) return state
  if (!halkenburgShotConditionsHold(state, side, readyCohort(state, side)))
    return abandonHalkenburgShot(state, side)
  const projectile: FightProjectile = {
    id: state.nextProjectileId,
    owner: side,
    fighterId: 'halkenburg',
    x: actor.x + actor.facing * 3,
    y: actor.y + (actor.halkSoulLowShot ? 3 : 6),
    velocityX: actor.facing * 150,
    width: 1,
    height: 0.5,
    damage: 0,
    hitstun: 0,
    blockstun: 0,
    hitstop: 0,
    knockback: 0,
    targetZone: 'torso',
    shape: 'needle',
    colour: '#dbeafe',
    matter: 'nen',
    age: 0,
    lifetime: 120,
    nenPower: 1,
    hatsuPower: 1,
    halkenburgArrow: committedSoulShot(state, side),
  }
  return {
    ...state,
    nextProjectileId: state.nextProjectileId + 1,
    projectiles: [...state.projectiles, projectile],
    [side]: {
      ...actor,
      halkenburgGroupProtection: false,
      halkSoulLowShot: undefined,
      hatsuEffects: { ...actor.hatsuEffects, arrowNocked: 0 },
      attack: { ...attack, projectileSpawned: true, impacted: true },
    },
  }
}
function committedSoulShot(state: FightState, side: FightSide): FightProjectile['halkenburgArrow'] {
  const actor = state[side]
  return {
    participant: actor.halkenburgSupporter!,
    ...(halkenburgMode(state, side) === 'souls'
      ? {
          mode: 'souls' as const,
          archerBody: soulBodyKey(state, side),
          participantMind: actor.halkSoul?.mind?.key ?? controlledSoulKey(state, side),
        }
      : {}),
  }
}

/** No physical damage or score accompanies the requested body-transfer adaptation. */
export function resolveHalkenburgArrow(
  state: FightState,
  hit: { projectile: FightProjectile; defenderSide: FightSide; position: { x: number; y: number } },
  possess: (state: FightState, side: FightSide, defender: FightSide) => FightState,
): FightState {
  const { projectile, defenderSide, position } = hit,
    actor = state[projectile.owner]
  if (!projectile.halkenburgArrow || state.phase !== 'fighting') return state
  if (projectile.halkenburgArrow.mode === 'souls') return soulArrowImpact(state, hit)
  const armed = {
    ...state,
    [projectile.owner]: {
      ...actor,
      halkenburgSupporter: projectile.halkenburgArrow.participant,
      hatsuEffects: { ...actor.hatsuEffects, arrowNocked: 1 },
    },
  }
  const next = possess(armed, projectile.owner, defenderSide)
  return {
    ...next,
    [projectile.owner]: {
      ...next[projectile.owner],
      hatsuEffects: { ...next[projectile.owner].hatsuEffects, arrowNocked: 0 },
    },
    impact: {
      sequence: (state.impact?.sequence ?? 0) + 1,
      attacker: projectile.owner,
      kind: 'ranged',
      damage: 0,
      blocked: false,
      parried: false,
      avoided: false,
      invulnerable: false,
      critical: false,
      knockdown: false,
      counterHit: false,
      punish: false,
      antiAir: false,
      wallSplat: false,
      comboHits: 0,
      damageScale: 1,
      points: 0,
      zone: 'torso',
      concealed: false,
      projectileId: projectile.id,
      position,
    },
  }
}

function soulArrowImpact(
  state: FightState,
  hit: Parameters<typeof resolveHalkenburgArrow>[1],
): FightState {
  const next = applyHalkenburgSoulArrow(state, hit)
  return {
    ...next,
    impact: {
      sequence: (state.impact?.sequence ?? 0) + 1,
      attacker: hit.projectile.owner,
      kind: 'ranged',
      damage: 0,
      blocked: false,
      parried: false,
      avoided: false,
      invulnerable: false,
      critical: false,
      knockdown: false,
      counterHit: false,
      punish: false,
      antiAir: false,
      wallSplat: false,
      comboHits: 0,
      damageScale: 1,
      points: 0,
      zone: 'torso',
      concealed: false,
      projectileId: hit.projectile.id,
      position: hit.position,
    },
  }
}
