import { prepareDefence } from './combatDefence'
import { resolvedDamage, strikeProjectileDefender } from './combatDamage'
import { canReceiveCombatHit } from './combatTargets'
import { scoreJudgedImpact } from './towerJudging'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import type { FightProjectile, FightSide, FightState } from './types'

/** A construct's own physical contact: no flying ammunition or copied personal Hatsu. */
export function resolveHistoricalContact(
  state: FightState,
  contact: {
    owner: FightSide
    target: FightSide
    x: number
    y: number
    damage: number
  },
): FightState {
  const body = state[contact.target]
  if (!canReceiveCombatHit(body)) return state
  const defence = prepareDefence(body, 'torso', {
    guard: 'mid',
    concealed: false,
    position: contact,
  })
  const attacker = { ...state[contact.owner], x: contact.x, y: contact.y, attack: null }
  const damage = resolvedDamage({
    attacker,
    defence,
    base: contact.damage,
    zone: 'torso',
    kind: 'light',
    damageScale: 1,
    openingMultiplier: 1,
    physicalProjectile: true,
  })
  const projectile: FightProjectile = {
    id: -1,
    owner: contact.owner,
    fighterId: 'chrollo',
    x: contact.x,
    y: contact.y,
    velocityX: 0,
    width: 1,
    height: 1,
    damage: contact.damage,
    hitstun: 8,
    blockstun: 6,
    hitstop: 4,
    knockback: 0.5,
    targetZone: 'torso',
    shape: 'orb',
    colour: '#c9b8a5',
    age: 0,
    lifetime: 1,
    matter: 'nen',
  }
  const struck =
    defence.avoided || defence.parried
      ? defence.fighter
      : strikeProjectileDefender({
          fighter: defence.fighter,
          attacker,
          zone: projectile.targetZone,
          damage,
          blocked: defence.blocked,
          knockdown: false,
          antiAir: false,
          wallSplat: false,
          counterHit: false,
          comboHits: 1,
          projectile,
        })
  const points =
    defence.avoided || defence.parried
      ? 0
      : scoreJudgedImpact({
          formatId: state.formatId,
          blocked: defence.blocked,
          critical: false,
          knockdown: false,
        })
  const next: FightState = {
    ...state,
    [contact.target]: struck,
    score: { ...state.score, [contact.owner]: state.score[contact.owner] + points },
    impact: {
      sequence: (state.impact?.sequence ?? 0) + 1,
      attacker: contact.owner,
      kind: 'light',
      damage,
      blocked: defence.blocked,
      parried: defence.parried,
      critical: false,
      knockdown: false,
      counterHit: false,
      punish: false,
      antiAir: false,
      wallSplat: false,
      invulnerable: defence.invulnerable,
      comboHits: 1,
      damageScale: 1,
      points,
      zone: 'torso',
      concealed: false,
      avoided: defence.avoided,
      projectileId: null,
      position: { x: body.x, y: body.y + 6 },
    },
  }
  return resolveFightOutcome(
    recordFightDeath(next, {
      victimSide: contact.target,
      killerSide: contact.owner,
      cause: 'strike',
    }),
  )
}
