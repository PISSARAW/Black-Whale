import { recordCyclotronContact, mergeCyclotronContacts } from './phinksImpact'
import { catchBungeeObject } from './hisokaCatch'
import { prepareDefence } from './combatDefence'
import { canReceiveCombatHit } from './combatTargets'
import { throwImmune, canTechThrow, resolveThrowTech } from './throwRules'
import { recoilGuardedAttack } from './guardRecoil'
import { strikeRead, projectileRead, interruptedHatsuMove } from './combatRead'
import { plantPaperAfterHit } from './kallutoFlight'
import { recordThreeCombatProjectileWound } from './threeCombatWounds'
import { resolveMindContact } from './mindContact'
import { resolveLynchContact } from './lynchInterrogation'
import { recordBlinkyWound } from './blinkyWounds'
import { resolveBashoPoemImpact } from './bashoFire'
import { isFirearmProjectile } from './nenProjectiles'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import { captureCuldceptProjectile } from './benjaminCuldcept'
import { observeComboMaster } from './comboMaster'
import { recordDolphinEffects } from './kurapikaDolphin'
import { sleepingBody } from './hanzoProjection'
export { finishFight } from './combatVerdict'
import { tradeGumState, tradeFighter, tradeTotals } from './combatTrade'
import { resolveSweetHomeImpact } from './sweetHomeImpact'
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
import { resolveHatsuImpact } from './hatsu'
import { isCriticalAuraStrike, releaseFocusedAura, setIn } from './nen'
import {
  atWall,
  nextComboHits,
  openingDamageMultiplier,
  openingType,
  resolvedDamage,
  strikeDefender,
  strikeProjectileDefender,
  type ImpactDefence,
} from './combatDamage'
import { addJudgedKnockdown, isJudgedKnockdown, scoreJudgedImpact } from './towerJudging'
import { attackerComboScale } from './comboDamageScale'
import { grammarAllowsWallSplat } from './grammarWallSplat'
import type { ProjectileHit } from './projectiles'
import type { ArcadeFighter, FightSide, FightState, FighterId } from './types'

export const TOWER_WIN_SCORE = 10

export function resolveFightImpacts(state: FightState, projectiles: ProjectileHit[]): FightState {
  state = observeComboMaster(
    state,
    projectiles.map((hit) => hit.projectile),
  )
  if (state.catsName || state.phase !== 'fighting') return state
  return resolveFightOutcome(projectiles.reduce(resolveProjectileHit, resolveMeleePair(state)))
}

/** Melee between the two bodies of a duel only: no clock, observer or verdict runs here. */
export function resolveMeleePair(state: FightState): FightState {
  const trade = canTrade(state)
  const next = recordCyclotronContact(state, resolveAttack(state, 'player'), 'player')
  if (trade) return resolveTrade(state, next)
  if (next.phase !== 'fighting') return next
  return recordCyclotronContact(next, resolveAttack(next, 'opponent'), 'opponent')
}

function canTrade(state: FightState): boolean {
  return (
    state.player.attack?.variant !== 'throw' &&
    state.opponent.attack?.variant !== 'throw' &&
    attackCanResolve(state.player) &&
    attackCanResolve(state.opponent) &&
    Boolean(
      attackCollision(state.player, state.opponent) &&
      attackCollision(state.opponent, state.player),
    )
  )
}

function resolveAttack(state: FightState, side: FightSide): FightState {
  const attacker = state[side]
  if (!attackCanResolve(attacker)) return state
  const defenderSide = otherSide(side)
  const defender = state[defenderSide]
  if (throwMisses(attacker, defender)) return state
  const collision = attackCollision(attacker, defender)
  if (!collision) return state
  if (throwTechPossible(attacker, defender)) return resolveThrowTech(state, side)
  const data = attackData(attacker.attack.kind, attacker)
  const defence = prepareDefence(defender, data.targetZone, strikeRead(attacker))
  const opening = openingType(sleepingBody(defender), defence.blocked)
  const antiAir = launchesTarget(attacker, defender)
  const comboHits = nextComboHits(sleepingBody(defender), defence)
  const damageScale = attackerComboScale(attacker, comboHits)
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
  const needle = resolveMindContact({ state, side, defence, spent })
  if (needle) return needle
  const knockdown = isJudgedKnockdown({
    attacker,
    knockback: data.knockback,
    blocked: defence.blocked,
    avoided: defence.avoided,
    critical,
  })
  const wallSplat = impactWallSplat({ defence, defender, attacker, knockback: data.knockback })
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
    [side]: recoilGuardedAttack({
      attacker: spent,
      defender: defence.fighter,
      struck,
      knockback: data.knockback,
      blocked: defence.blocked,
      avoided: defence.avoided,
    }),
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
  const scorched = resolveLynchContact(
    state,
    resolveBashoPoemImpact(state, transferred, side),
    side,
  )
  if (transferred !== next)
    return finishAfterImpact(
      scorched,
      transferred.impact!.attacker,
      otherSide(transferred.impact!.attacker),
    )
  next = recordBlinkyWound(state, scorched, side)
  if (shouldResolveHatsu(attacker, defence)) {
    const beforeHatsu = next
    next = resolveHatsuImpact({
      state: next,
      side,
      defenderSide,
      source: attacker.attack.hatsuSource,
      moveId: attacker.attack.moveId,
      defenderMoveId: interruptedHatsuMove(defender),
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
  return strikeDefender({
    ...options,
    fighter: defence.fighter,
    blocked: defence.blocked,
  })
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
        confirmedBlock: defence.blocked && !defence.parried && !defence.avoided,
        auraCharged: false,
      },
    }),
    false,
  )
  return spent
}

function launchesTarget(attacker: ArcadeFighter, defender: ArcadeFighter): boolean {
  return isAntiAir(attacker) && sleepingBody(defender).y > 0
}

function throwTechPossible(attacker: ArcadeFighter, defender: ArcadeFighter): boolean {
  return attacker.attack?.variant === 'throw' && canTechThrow(defender)
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
  attack: NonNullable<ArcadeFighter['attack']> & {
    hatsuSource: NonNullable<FighterId>
  }
} {
  return (
    fighter.attack.kind === 'special' && Boolean(fighter.attack.hatsuSource) && !defence.avoided
  )
}

export function resolveProjectileHit(state: FightState, hit: ProjectileHit): FightState {
  if (
    state.phase !== 'fighting' ||
    !canReceiveCombatHit(state[hit.defenderSide], hit.projectile.canHitDowned)
  )
    return state
  const captured = captureIncomingProjectile(state, hit)
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
  const planted = recordThreeCombatProjectileWound(
    plantPaperAfterHit(routed, hit.projectile),
    hit.projectile,
  )
  return finishAfterImpact(planted, planted.impact!.attacker, otherSide(planted.impact!.attacker))
}

function attackCanResolve(
  fighter: ArcadeFighter,
): fighter is ArcadeFighter & { attack: NonNullable<ArcadeFighter['attack']> } {
  return Boolean(fighter.attack && !fighter.attack.impacted && attackPhase(fighter) === 'active')
}

function attackCollision(attacker: ArcadeFighter, defender: ArcadeFighter) {
  const data = attackData(attacker.attack?.kind ?? 'light', attacker)
  if (!canReceiveCombatHit(defender, data.canHitDowned)) return null
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

function resolveTrade(original: FightState, first: FightState): FightState {
  const second = recordCyclotronContact(original, resolveAttack(original, 'opponent'), 'opponent')
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
    ...tradeGumState(original, first, second),
    ...mergeCyclotronContacts(first, second),
    score: tradeTotals({
      original: original.score,
      first: first.score,
      second: second.score,
    }),
    knockdowns: tradeTotals({
      original: original.knockdowns,
      first: first.knockdowns,
      second: second.knockdowns,
    }),
    impact: second.impact,
    hitstop: Math.max(first.hitstop, second.hitstop),
  }
  return {
    ...traded,
    deaths: [...(first.deaths ?? []), ...(second.deaths ?? [])],
  }
}

function impactWallSplat(options: {
  defence: ImpactDefence
  defender: ArcadeFighter
  attacker: ArcadeFighter
  knockback: number
}): boolean {
  return (
    !options.defence.avoided &&
    grammarAllowsWallSplat(options.attacker, options.knockback) &&
    atWall(sleepingBody(options.defender), options.attacker, options.knockback)
  )
}

function captureIncomingProjectile(state: FightState, hit: ProjectileHit): FightState | null {
  return catchBungeeObject(state, hit) ?? captureCuldceptProjectile(state, hit)
}
