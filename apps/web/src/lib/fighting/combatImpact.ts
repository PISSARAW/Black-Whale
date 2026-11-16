import { finishFight } from './combatVerdict'
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
import {
  consumeBaton,
  consumeHatsuAvoidance,
  hatsuAvoidsImpact,
  resolveDeathHatsu,
  resolveHatsuImpact,
} from './hatsu'
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
import { fightFormat } from './formats'
import {
  addJudgedKnockdown,
  isJudgedKnockdown,
  scoreJudgedImpact,
  tradeFinishReason,
} from './towerJudging'
import type { ProjectileHit } from './projectiles'
import type {
  ArcadeFighter,
  FightNenZone,
  FightFinishReason,
  FightSide,
  FightState,
  FighterId,
} from './types'

const GROUND = 0
const PARRY_WINDOW_FRAMES = 6
const MAX_JUGGLE_HITS = 3
export const TOWER_WIN_SCORE = 10

export function resolveFightImpacts(state: FightState, projectiles: ProjectileHit[]): FightState {
  const trade =
    attackCanResolve(state.player) &&
    attackCanResolve(state.opponent) &&
    attackCollision(state.player, state.opponent) &&
    attackCollision(state.opponent, state.player)
  let next = resolveAttack(state, 'player')
  if (trade) next = resolveTrade(state, next)
  else if (next.phase === 'fighting') next = resolveAttack(next, 'opponent')
  return projectiles.reduce(resolveProjectileHit, next)
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
  const defence = prepareDefence(defender, data.targetZone, attacker)
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
  if (transferred !== next)
    return finishAfterImpact(
      transferred,
      transferred.impact!.attacker,
      otherSide(transferred.impact!.attacker),
    )
  if (shouldResolveHatsu(attacker, defence)) {
    next = resolveHatsuImpact({
      state: next,
      side,
      defenderSide,
      source: attacker.attack.hatsuSource,
      moveId: attacker.attack.moveId,
      blocked: defence.blocked,
      concealed: attacker.attack.concealed,
    })
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
  return attacker.attack.kind === 'special' ? spent : consumeBaton(spent)
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
  if (state.phase !== 'fighting') return state
  const side = hit.projectile.owner
  const attacker = state[side]
  const defender = state[hit.defenderSide]
  const defence = prepareDefence(defender, hit.projectile.targetZone)
  const opening = openingType(sleepingBody(defender), defence.blocked)
  const comboHits = nextComboHits(sleepingBody(defender), defence)
  const damageScale = comboScale(comboHits)
  const damage = resolvedDamage({
    attacker,
    defence,
    base: hit.projectile.damage,
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
  const points = defence.avoided
    ? 0
    : scoreJudgedImpact({
        formatId: state.formatId,
        blocked: defence.blocked,
        critical: false,
        knockdown,
      })
  const score = { ...state.score, [side]: state.score[side] + points }
  const knockdowns = addJudgedKnockdown({ state, side, knockdown })
  const next = {
    ...state,
    [side]: consumeBaton(attacker),
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
      concealed: false,
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
  attacker?: ArcadeFighter,
): ImpactDefence {
  fighter = wakeHanzoBody(fighter)
  const blocked = blocksImpact(fighter, attacker)
  const parried = parryActive(fighter, blocked)
  const invulnerable = impactInvulnerable(fighter, attacker)
  if (invulnerable) return { fighter, blocked, parried, avoided: true, invulnerable }
  if (hatsuAvoidsImpact(fighter)) return avoidedDefence(fighter, blocked, parried)
  const defended = parried ? focusGuardRyu(fighter, zone) : fighter
  return { fighter: defended, blocked, parried, avoided: false, invulnerable: false }
}

function blocksImpact(fighter: ArcadeFighter, attacker?: ArcadeFighter): boolean {
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

function parryActive(fighter: ArcadeFighter, blocked: boolean): boolean {
  return blocked && fighter.guardFrames > 0 && fighter.guardFrames <= PARRY_WINDOW_FRAMES
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
  if (state.mode === 'training' && state[defenderSide].health <= 0) {
    return { ...state, [defenderSide]: { ...state[defenderSide], health: 100 } }
  }
  if (state.mode === 'training') return state
  const durable = preserveHitFormatHealth(state, defenderSide)
  const reason = lossReason(durable, defenderSide)
  const revived = reason === 'knockout' && resolveDeathHatsu(durable, attackerSide, defenderSide)
  if (revived) return finishFight(revived, defenderSide, 'knockout')
  return reason ? finishFight(durable, attackerSide, reason) : durable
}

function lossReason(state: FightState, side: FightSide): Exclude<FightFinishReason, 'time'> {
  const format = fightFormat(state.formatId)
  const attackerSide = otherSide(side)
  if (format.knockdownTarget !== null && state.knockdowns[attackerSide] >= format.knockdownTarget)
    return 'technical-knockout'
  if (format.victory !== 'points' && state[side].health <= 0) return 'knockout'
  if (
    format.victory !== 'health' &&
    format.hitTarget !== null &&
    state.score[otherSide(side)] >= format.hitTarget
  )
    return 'hits'
  return null
}

function preserveHitFormatHealth(state: FightState, side: FightSide): FightState {
  const format = fightFormat(state.formatId)
  if (
    format.victory !== 'points' ||
    format.hitTarget === null ||
    state.score[otherSide(side)] >= format.hitTarget ||
    state[side].health > 0
  )
    return state
  return { ...state, [side]: { ...state[side], health: 1 } }
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
  const durable = preserveHitFormatHealth(preserveHitFormatHealth(traded, 'player'), 'opponent')
  const playerLost = lossReason(durable, 'player')
  const opponentLost = lossReason(durable, 'opponent')
  const finishReason = tradeFinishReason(playerLost, opponentLost)
  if (playerLost && opponentLost)
    return { ...durable, phase: 'finished', winner: 'draw', finishReason }
  if (opponentLost) return finishFight(durable, 'player', opponentLost)
  return playerLost ? finishFight(durable, 'opponent', playerLost) : durable
}
