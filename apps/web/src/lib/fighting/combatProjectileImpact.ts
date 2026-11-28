import { catchBungeeObject } from './hisokaCatch'
import { settleHalkenburgArrow } from './hatsu/halkenburg'
import { prepareDefence } from './combatDefence'
import { canReceiveCombatHit } from './combatTargets'
import { confirmShot } from './shotConfirm'
import { projectileRead } from './combatRead'
import { plantPaperAfterHit } from './kallutoFlight'
import { recordThreeCombatProjectileWound } from './threeCombatWounds'
import { recordHistoricalBladeProjectile } from './historicalWeaponFrame'
import { isFirearmProjectile } from './nenProjectiles'
import { captureCuldceptProjectile } from './benjaminCuldcept'
import { sleepingBody } from './hanzoProjection'
import { resolveSweetHomeImpact } from './sweetHomeImpact'
import { otherSide } from './frameData'
import {
  atWall,
  nextComboHits,
  openingType,
  resolvedDamage,
  strikeProjectileDefender,
} from './combatDamage'
import { addJudgedKnockdown, isJudgedKnockdown } from './towerJudging'
import { attackerComboScale } from './comboDamageScale'
import { retainSoundContacts } from './audio/impactHistory'
import type { ProjectileHit } from './projectiles'
import type { FightState } from './types'
import { finishAfterImpact, impactPoints } from './combatImpactSupport'

export function resolveProjectileHit(state: FightState, hit: ProjectileHit): FightState {
  return retainSoundContacts(state, applyProjectileHit(state, hit), { projectile: hit.projectile })
}

function tserriednichFirearmShot(
  attacker: FightState['player'],
  projectile: ProjectileHit['projectile'],
): number | undefined {
  return attacker.id === 'tserriednich' &&
    projectile.fighterId === attacker.id &&
    isFirearmProjectile(projectile)
    ? projectile.id
    : undefined
}

function applyProjectileHit(state: FightState, hit: ProjectileHit): FightState {
  const immediate = immediateProjectileResolution(state, hit)
  if (immediate) return immediate
  const side = hit.projectile.owner
  const attacker = state[side]
  const defender = state[hit.defenderSide]
  const defence = prepareDefence(
    defender,
    hit.projectile.targetZone,
    projectileRead(hit.projectile),
  )
  const opening = openingType(sleepingBody(defender), defence.blocked)
  const comboHits = nextComboHits(sleepingBody(defender), defence)
  const damageScale = attackerComboScale(attacker, comboHits)
  const damage = resolvedDamage({
    attacker,
    defence,
    base: hit.projectile.damage,
    physicalProjectile: isFirearmProjectile(hit.projectile),
    projectileNenPower: hit.projectile.nenPower,
    projectileHatsuPower: hit.projectile.hatsuPower,
    zone: hit.projectile.targetZone,
    kind: 'ranged',
    damageScale,
    openingMultiplier: opening.counterHit ? 1.1 : opening.punish ? 1.15 : 1,
  })
  const knockdown = isJudgedKnockdown({
    attacker,
    knockback: hit.projectile.knockback,
    blocked: defence.blocked,
    avoided: defence.avoided,
    critical: false,
  })
  const wallSplat =
    !defence.avoided && atWall(sleepingBody(defender), attacker, hit.projectile.knockback)
  const struck = defence.avoided
    ? defence.fighter
    : strikeProjectileDefender({
        fighter: defence.fighter,
        attacker,
        zone: hit.projectile.targetZone,
        projectile: hit.projectile,
        damage,
        blocked: defence.blocked,
        knockdown,
        antiAir: false,
        wallSplat,
        counterHit: opening.counterHit,
        comboHits,
      })
  const points = impactPoints({ state, defence, critical: false, knockdown })
  const score = { ...state.score, [side]: state.score[side] + points }
  const knockdowns = addJudgedKnockdown({ state, side, knockdown })
  const next = {
    ...state,
    [side]: confirmShot(attacker, hit.projectile, defence),
    [hit.defenderSide]: struck,
    score,
    knockdowns,
    hitstop: hit.projectile.hitstop,
    impact: {
      sequence: (state.impact?.sequence ?? 0) + 1,
      attacker: side,
      kind: 'ranged' as const,
      damage,
      blocked: defence.blocked,
      parried: defence.parried,
      critical: false,
      knockdown,
      counterHit: opening.counterHit,
      punish: opening.punish,
      antiAir: false,
      wallSplat,
      invulnerable: defence.invulnerable,
      comboHits,
      damageScale,
      points,
      zone: hit.projectile.targetZone,
      concealed: Boolean(hit.projectile.concealed),
      avoided: defence.avoided,
      projectileId: hit.projectile.id,
      position: hit.position,
    },
  }
  const routed = resolveSweetHomeImpact({
    before: state,
    after: next,
    damagedSide: hit.defenderSide,
  })
  const planted = recordThreeCombatProjectileWound(
    plantPaperAfterHit(routed, hit.projectile),
    hit.projectile,
  )
  const archived = recordHistoricalBladeProjectile(planted, hit.projectile)
  return finishAfterImpact(archived, {
    attackerSide: archived.impact!.attacker,
    defenderSide: otherSide(archived.impact!.attacker),
    shotId: tserriednichFirearmShot(attacker, hit.projectile),
  })
}

function immediateProjectileResolution(state: FightState, hit: ProjectileHit): FightState | null {
  if (hit.projectile.halkenburgArrow) return settleHalkenburgArrow(state, hit)
  if (
    state.phase !== 'fighting' ||
    !canReceiveCombatHit(state[hit.defenderSide], hit.projectile.canHitDowned)
  )
    return state
  return captureIncomingProjectile(state, hit)
}

function captureIncomingProjectile(state: FightState, hit: ProjectileHit): FightState | null {
  return catchBungeeObject(state, hit) ?? captureCuldceptProjectile(state, hit)
}
