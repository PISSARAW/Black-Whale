import { melodyRestrictsCombat } from './melodyRules'
import { melodyParryBonus } from './melodyHearing'
import { resolveBashoPoemImpact } from './bashoFire'
import { gyoSight, insideEn, nenReadBonus } from './nenPerception'
import { isFirearmProjectile } from './nenProjectiles'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import { observeComboMaster } from './comboMaster'
import { captureCuldceptProjectile } from './benjaminCuldcept'
import { recordDolphinEffects } from './kurapikaDolphin'
export { finishFight } from './combatVerdict'
import { tradeAttachment, tradeFighter, tradeTotals } from './combatTrade'
import { resolveSweetHomeImpact } from './sweetHomeImpact'
import { sleepingBody, wakeHanzoBody } from './hanzoProjection'
import { blocksAttack } from './duelMoves'
import {
  activeHitbox,
  attackData,
  attackPhase,
  boxesOverlap,
  contactPoint,
  hurtboxes,
  isAntiAir,
  otherSide,
} from './frameData'
import { consumeHatsuAvoidance, hatsuAvoidsImpact, resolveHatsuImpact } from './hatsu'
import { focusGuardRyu, isCriticalAuraStrike, releaseFocusedAura, setIn } from './nen'
import {
  atWall,
  comboScale,
  nextComboHits,
  openingDamageMultiplier,
  openingType,
  resolvedDamage,
  strikeDefender,
  strikeProjectileDefender,
  type ImpactDefence,
} from './combatDamage'
import { addJudgedKnockdown, isJudgedKnockdown, scoreJudgedImpact } from './towerJudging'
import type { ProjectileHit } from './projectiles'
import type { ArcadeFighter, FightNenZone, FightSide, FightState, FighterId } from './types'

const GROUND = 0
const PARRY_WINDOW_FRAMES = 6
const MAX_JUGGLE_HITS = 3
export const TOWER_WIN_SCORE = 10

export function resolveFightImpacts(state: FightState, projectiles: ProjectileHit[]): FightState {
  state = observeComboMaster(
    state,
    projectiles.map((hit) => hit.projectile),
  )
  if (state.catsName || state.phase !== 'fighting') return state
  const trade =
    attackCanResolve(state.player) &&
    attackCanResolve(state.opponent) &&
    attackCollision(state.player, state.opponent) &&
    attackCollision(state.opponent, state.player)
  let next = resolveAttack(state, 'player')
  if (trade) next = resolveTrade(state, next)
  else if (next.phase === 'fighting') next = resolveAttack(next, 'opponent')
  return resolveFightOutcome(projectiles.reduce(resolveProjectileHit, next))
}

function resolveAttack(state: FightState, side: FightSide): FightState {
  const attacker = state[side]
  if (!attackCanResolve(attacker)) return state
  const defenderSide = otherSide(side)
  const defender = state[defenderSide]
  if (throwMisses(attacker, defender)) return state
  const collision = attackCollision(attacker, defender)
  if (!collision) return state
  const data = attackData(attacker.attack.kind, attacker)
  const defence = prepareDefence(defender, data.targetZone, strikeRead(attacker))
  const opening = openingType(sleepingBody(defender), defence.blocked)
  const antiAir = isAntiAir(attacker) && sleepingBody(defender).y > GROUND
  const comboHits = nextComboHits(sleepingBody(defender), defence)
  const damageScale = comboScale(comboHits)
  const critical = isCriticalAuraStrike(attacker)
  const damage = resolvedDamage({
    attacker,
    defence,
    base: data.damage,
    zone: data.targetZone,
    kind: attacker.attack.kind,
    damageScale,
    openingMultiplier: openingDamageMultiplier(opening),
  })
  const spent = spendAttacker(attacker, defence)
  const knockdown = isJudgedKnockdown({
    attacker,
    knockback: data.knockback,
    blocked: defence.blocked,
    avoided: defence.avoided,
    critical,
  })
  const wallSplat = !defence.avoided && atWall(sleepingBody(defender), attacker, data.knockback)
  const struck = strikeAfterDefence(defence, {
    attacker,
    damage,
    knockdown,
    antiAir,
    wallSplat,
    counterHit: opening.counterHit,
    comboHits,
  })
  const points = impactPoints({ state, defence, critical, knockdown })
  const score = { ...state.score, [side]: state.score[side] + points }
  const knockdowns = addJudgedKnockdown({ state, side, knockdown })
  let next: FightState = {
    ...state,
    [side]: spent,
    [defenderSide]: struck,
    score,
    knockdowns,
    impact: {
      sequence: (state.impact?.sequence ?? 0) + 1,
      attacker: side,
      kind: attacker.attack.kind,
      damage,
      blocked: defence.blocked,
      parried: defence.parried,
      critical,
      knockdown,
      counterHit: opening.counterHit,
      punish: opening.punish,
      antiAir,
      wallSplat,
      invulnerable: defence.invulnerable,
      comboHits,
      damageScale,
      points,
      zone: data.targetZone,
      concealed: attacker.attack.concealed,
      avoided: defence.avoided,
      projectileId: null,
      position: collision.position,
    },
    hitstop: data.hitstop,
  }
  const transferred = resolveSweetHomeImpact({
    before: state,
    after: next,
    damagedSide: defenderSide,
  })
  const scorched = resolveBashoPoemImpact(state, transferred, side)
  if (transferred !== next)
    return finishAfterImpact(
      scorched,
      transferred.impact!.attacker,
      otherSide(transferred.impact!.attacker),
    )
  next = scorched
  if (shouldResolveHatsu(attacker, defence)) {
    const beforeHatsu = next
    next = resolveHatsuImpact({
      state: next,
      side,
      defenderSide,
      source: attacker.attack.hatsuSource,
      moveId: attacker.attack.moveId,
      blocked: defence.blocked,
      concealed: attacker.attack.concealed,
    })
    next = recordDolphinEffects(beforeHatsu, next, side)
  }
  return finishAfterImpact(next, side, defenderSide)
}

function strikeAfterDefence(
  defence: ImpactDefence,
  options: Omit<Parameters<typeof strikeDefender>[0], 'fighter' | 'blocked'>,
): ArcadeFighter {
  if (defence.avoided) return defence.fighter
  return strikeDefender({ ...options, fighter: defence.fighter, blocked: defence.blocked })
}

function impactPoints(options: {
  state: FightState
  defence: ImpactDefence
  critical: boolean
  knockdown: boolean
}): number {
  const { state, defence, critical, knockdown } = options
  if (defence.avoided) return 0
  return scoreJudgedImpact({
    formatId: state.formatId,
    blocked: defence.blocked,
    critical,
    knockdown,
  })
}

function spendAttacker(
  attacker: ArcadeFighter & { attack: NonNullable<ArcadeFighter['attack']> },
  defence: ImpactDefence,
): ArcadeFighter {
  const spent = setIn(
    releaseFocusedAura({
      ...attacker,
      attack: {
        ...attacker.attack,
        impacted: true,
        confirmedHit: !defence.blocked && !defence.avoided,
        auraCharged: false,
      },
    }),
    false,
  )
  return spent
}

function throwMisses(
  attacker: ArcadeFighter & { attack: NonNullable<ArcadeFighter['attack']> },
  defender: ArcadeFighter,
): boolean {
  return attacker.attack.variant === 'throw' && throwImmune(defender)
}

function shouldResolveHatsu(
  fighter: ArcadeFighter & { attack: NonNullable<ArcadeFighter['attack']> },
  defence: ImpactDefence,
): fighter is ArcadeFighter & {
  attack: NonNullable<ArcadeFighter['attack']> & { hatsuSource: NonNullable<FighterId> }
} {
  return (
    fighter.attack.kind === 'special' && Boolean(fighter.attack.hatsuSource) && !defence.avoided
  )
}

function resolveProjectileHit(state: FightState, hit: ProjectileHit): FightState {
  if (state.phase !== 'fighting' || state[hit.defenderSide].health <= 0) return state
  const captured = captureCuldceptProjectile(state, hit)
  if (captured) return captured
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
  const damageScale = comboScale(comboHits)
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
    [side]: attacker,
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
  return finishAfterImpact(routed, routed.impact!.attacker, otherSide(routed.impact!.attacker))
}

function prepareDefence(
  fighter: ArcadeFighter,
  zone: FightNenZone,
  read?: { attacker?: ArcadeFighter; concealed: boolean; position: { x: number; y: number } },
): ImpactDefence {
  const attacker = read?.attacker
  fighter = wakeHanzoBody(fighter)
  const blocked = blocksImpact(fighter, attacker)
  const visible = !read?.concealed || gyoSight(fighter) || insideEn(fighter, read.position)
  const bonus = read ? nenReadBonus(fighter, { ...fighter, ...read.position }) : 0
  const parried = visible && parryActive(fighter, blocked, { attacker, bonus })
  const invulnerable = impactInvulnerable(fighter, attacker)
  if (invulnerable) return { fighter, blocked, parried, avoided: true, invulnerable }
  if (hatsuAvoidsImpact(fighter)) return avoidedDefence(fighter, blocked, parried)
  const defended = parried ? focusGuardRyu(fighter, zone) : fighter
  return { fighter: defended, blocked, parried, avoided: false, invulnerable: false }
}

function blocksImpact(fighter: ArcadeFighter, attacker?: ArcadeFighter): boolean {
  if (melodyRestrictsCombat(fighter)) return false
  return attacker ? blocksAttack(fighter, attacker) : fighter.blocking && fighter.y === GROUND
}

function impactInvulnerable(fighter: ArcadeFighter, attacker?: ArcadeFighter): boolean {
  if (attacker?.attack?.variant === 'throw') return false
  if (fighter.wakeupInvulnerableFrames > 0) return true
  return Boolean(fighter.attack?.reversal && attackPhase(fighter) === 'startup')
}

function avoidedDefence(fighter: ArcadeFighter, blocked: boolean, parried: boolean): ImpactDefence {
  return {
    fighter: consumeHatsuAvoidance(fighter),
    blocked,
    parried,
    avoided: true,
    invulnerable: false,
  }
}

function attackCanResolve(
  fighter: ArcadeFighter,
): fighter is ArcadeFighter & { attack: NonNullable<ArcadeFighter['attack']> } {
  return Boolean(fighter.attack && !fighter.attack.impacted && attackPhase(fighter) === 'active')
}

function parryActive(
  fighter: ArcadeFighter,
  blocked: boolean,
  read: { attacker?: ArcadeFighter; bonus: number },
): boolean {
  return (
    blocked &&
    fighter.guardFrames > 0 &&
    fighter.guardFrames <=
      PARRY_WINDOW_FRAMES + read.bonus + melodyParryBonus(fighter, read.attacker)
  )
}

function attackCollision(attacker: ArcadeFighter, defender: ArcadeFighter) {
  const body = sleepingBody(defender)
  if (body.y > GROUND && body.juggleCount >= MAX_JUGGLE_HITS) return null
  const hitbox = activeHitbox(attacker)
  if (!hitbox) return null
  const hurtbox = hurtboxes(defender).find((candidate) => boxesOverlap(hitbox, candidate))
  return hurtbox ? { position: contactPoint(hitbox, hurtbox) } : null
}

function finishAfterImpact(
  state: FightState,
  attackerSide: FightSide,
  defenderSide: FightSide,
): FightState {
  const impact = state.impact
  const owner = impact?.transfer?.owner ?? attackerSide
  const cause = impact?.transfer ? 'transfer' : impact?.projectileId ? 'projectile' : 'strike'
  return recordFightDeath(state, {
    victimSide: defenderSide,
    killerSide: owner === defenderSide ? null : owner,
    cause,
  })
}

function throwImmune(fighter: ArcadeFighter): boolean {
  if (fighter.hanzoProjection) return false
  return (
    fighter.y > 0 ||
    fighter.hitStun > 0 ||
    fighter.blockStun > 0 ||
    (fighter.throwTechFrames ?? 0) > 0 ||
    fighter.attack?.variant === 'throw'
  )
}

function resolveTrade(original: FightState, first: FightState): FightState {
  const second = resolveAttack(original, 'opponent')
  if (first === original || second === original) return first
  const traded: FightState = {
    ...original,
    player: tradeFighter({
      original: original.player,
      incoming: second.player,
      outgoing: first.player,
    }),
    opponent: tradeFighter({
      original: original.opponent,
      incoming: first.opponent,
      outgoing: second.opponent,
    }),
    bungeeGum: tradeAttachment(original, first, second),
    score: tradeTotals({ original: original.score, first: first.score, second: second.score }),
    knockdowns: tradeTotals({
      original: original.knockdowns,
      first: first.knockdowns,
      second: second.knockdowns,
    }),
    impact: second.impact,
    hitstop: Math.max(first.hitstop, second.hitstop),
  }
  return { ...traded, deaths: [...(first.deaths ?? []), ...(second.deaths ?? [])] }
}

function strikeRead(attacker: ArcadeFighter & { attack: NonNullable<ArcadeFighter['attack']> }) {
  return {
    attacker,
    concealed: attacker.attack.concealed && Boolean(attacker.attack.hatsuSource),
    position: attacker,
  }
}

function projectileRead(projectile: ProjectileHit['projectile']) {
  return {
    concealed: Boolean(projectile.concealed) && projectile.matter === 'nen',
    position: projectile,
  }
}
