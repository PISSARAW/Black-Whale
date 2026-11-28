import { recordCyclotronContact, mergeCyclotronContacts } from './phinksImpact'
import { CYCLOTRON_PUNCH, cyclotronNenActive } from './phinksCyclotron'
import { catchBungeeObject } from './hisokaCatch'
import { settleHalkenburgArrow } from './hatsu/halkenburg'
import { prepareDefence } from './combatDefence'
import { canReceiveCombatHit } from './combatTargets'
import { resolveThrowTech, throwMisses, throwTechPossible } from './throwRules'
import { confirmShot } from './shotConfirm'
import { attackCanResolve, launchesTarget } from './impactAdmission'
import { recoilGuardedAttack } from './guardRecoil'
import { strikeRead, projectileRead, interruptedHatsuMove } from './combatRead'
import { plantPaperAfterHit } from './kallutoFlight'
import { recordThreeCombatProjectileWound } from './threeCombatWounds'
import { recordHistoricalWeaponHit, recordHistoricalBladeProjectile } from './historicalWeaponFrame'
import { resolveMindContact } from './mindContact'
import { resolveLynchContact } from './lynchInterrogation'
import { recordBlinkyWound } from './blinkyWounds'
import { resolveBashoPoemImpact } from './bashoFire'
import { isFirearmProjectile } from './nenProjectiles'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import { captureCuldceptProjectile } from './benjaminCuldcept'
import { observeComboMaster } from './comboMaster'
import { onRageDamage } from './onTechnique'
import { recordDolphinEffects } from './kurapikaDolphin'
import { sleepingBody } from './hanzoProjection'
import { resolveKoClash } from './koClash'
export { finishFight } from './combatVerdict'
import { tradeGumState, tradeFighter, tradeTotals } from './combatTrade'
import { resolveSweetHomeImpact } from './sweetHomeImpact'
import { comboOpening, type ComboOpening } from './comboOpenings'
import { launchesWithDirectionalEnding } from './directionalChain'
import {
  activeHitbox,
  attackData,
  boxesOverlap,
  contactPoint,
  hurtboxes,
  otherSide,
  type AttackFrameData,
} from './frameData'
import { resolveHatsuImpact } from './hatsu'
import { isCriticalAuraStrike, nenTacticalState, releaseFocusedAura, setIn } from './nen'
import { voluntaryNenAvailable } from './nenAccess'
import {
  atWall,
  cornerPushbackTransfer,
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
import { retainSoundContacts } from './audio/impactHistory'
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
  const clash = resolveKoClash(state)
  if (clash) return clash
  const trade = canTrade(state)
  const next = recordCyclotronContact(state, resolveAttack(state, 'player'), 'player')
  if (trade) return resolveTrade(state, next)
  if (next.phase !== 'fighting') return retainSoundContacts(state, next)
  const first = retainSoundContacts(state, next)
  const second = recordCyclotronContact(first, resolveAttack(first, 'opponent'), 'opponent')
  return retainSoundContacts(first, second)
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
  const defence = prepareDefence(defender, data.targetZone, strikeRead(attacker, defender))
  const opening = openingType(sleepingBody(defender), defence.blocked)
  const antiAir = launchesTarget(attacker, defender)
  const comboHits = nextComboHits(sleepingBody(defender), defence)
  const damageScale = attackerComboScale(attacker, comboHits)
  const critical = isCriticalAuraStrike(attacker)
  const ordinaryDamage = resolvedDamage({
    attacker,
    defence,
    base: data.damage,
    zone: data.targetZone,
    kind: attacker.attack.kind,
    damageScale,
    openingMultiplier: openingDamageMultiplier(opening),
  })
  const rageStrike = onRageDamage(
    attacker,
    sleepingBody(defender),
    attacker.attack.kind,
    ordinaryDamage,
    defence.blocked,
    defence.avoided,
  )
  const damage = rageStrike.damage
  const knockdown = isJudgedKnockdown({
    attacker,
    knockback: data.knockback,
    blocked: defence.blocked,
    avoided: defence.avoided,
    critical,
  })
  const wallSplat = impactWallSplat({
    defence,
    defender,
    attacker,
    knockback: data.knockback,
    counterHit: opening.counterHit,
  })
  const combo = comboOpening({
    attacker,
    defender: sleepingBody(defender),
    position: collision.position,
    reach: data.box.right,
    damage,
    defence,
    launch: antiAir,
    counter: opening.counterHit,
    punish: opening.punish,
    wall: wallSplat,
    knockdown,
    hits: comboHits,
  })
  const spent = spendAttacker(attacker, defence, combo)
  const context: AttackResolutionContext = {
    state,
    side,
    defenderSide,
    attacker,
    defender,
    spent,
    data,
    defence,
    opening,
    antiAir,
    comboHits,
    damage,
    knockdown,
    wallSplat,
    critical,
    damageScale,
    points: impactPoints({ state, defence, critical, knockdown }),
    combo,
    rage: rageStrike.rage,
    position: collision.position,
  }
  return resolveAttackOutcome(context)
}

interface AttackResolutionContext {
  state: FightState
  side: FightSide
  defenderSide: FightSide
  attacker: ArcadeFighter & { attack: NonNullable<ArcadeFighter['attack']> }
  defender: ArcadeFighter
  spent: ArcadeFighter
  data: AttackFrameData
  defence: ImpactDefence
  opening: { counterHit: boolean; punish: boolean }
  antiAir: boolean
  comboHits: number
  damage: number
  knockdown: boolean
  wallSplat: boolean
  critical: boolean
  damageScale: number
  points: number
  combo: ComboOpening | undefined
  rage: boolean
  position: { x: number; y: number }
}

function resolveAttackOutcome(context: AttackResolutionContext): FightState {
  const {
    state,
    side,
    defenderSide,
    attacker,
    defender,
    spent,
    data,
    defence,
    opening,
    antiAir,
    comboHits,
    damage,
    knockdown,
    wallSplat,
    critical,
    damageScale,
    points,
    combo,
    rage,
    position,
  } = context
  const needle = resolveMindContact({ state, side, defence, spent })
  if (needle) return needle
  const struck = strikeAfterDefence(defence, {
    attacker,
    zone: data.targetZone,
    damage,
    knockdown,
    antiAir: launchesWithDirectionalEnding(attacker, antiAir),
    wallSplat,
    counterHit: opening.counterHit,
    comboHits,
  })
  const score = { ...state.score, [side]: state.score[side] + points }
  const knockdowns = addJudgedKnockdown({ state, side, knockdown })
  const corneredAttacker =
    !defence.avoided && !defence.blocked && data.knockback > 0
      ? cornerPushbackTransfer(spent, defence.fighter, data.knockback)
      : spent
  const recoiledAttacker = recoilGuardedAttack({
    attacker: corneredAttacker,
    defender: defence.fighter,
    struck,
    knockback: data.knockback,
    blocked: defence.blocked,
    avoided: defence.avoided,
    cyclotronTurns: attacker.attack.cyclotronTurns ?? 0,
  })
  let next: FightState = {
    ...state,
    [side]: recoiledAttacker,
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
      onRage: rage,
      projectileId: null,
      position,
      ...(attacker.id === 'phinks' && damage > 0 && !defence.avoided
        ? {
            phinksStrike: {
              frame: state.frame,
              turns:
                attacker.attack.moveId === CYCLOTRON_PUNCH && cyclotronNenActive(attacker)
                  ? (attacker.attack.cyclotronTurns ?? 0)
                  : 0,
              ken: defence.fighter.nen.ken,
              ...(critical && data.auraZone === 'hands' ? { ko: true } : {}),
              ...(nenTacticalState(defence.fighter).technique === 'ten' &&
              voluntaryNenAvailable(defence.fighter, { requireHatsu: false, requireReserve: true })
                ? { ten: true }
                : {}),
              ...(attacker.nen.mode === 'ren' && !attacker.nen.ko && !attacker.attack.concealed
                ? { ren: true }
                : {}),
            },
          }
        : {}),
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
  next = recordHistoricalWeaponHit(state, recordBlinkyWound(state, scorched, side), side)
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
  opening?: ComboOpening,
): ArcadeFighter {
  const spent = setIn(
    releaseFocusedAura({
      ...attacker,
      attack: {
        ...attacker.attack,
        impacted: true,
        confirmedHit: !defence.blocked && !defence.avoided,
        ...(opening ? { comboOpening: opening } : {}),
        confirmedBlock: defence.blocked && !defence.parried && !defence.avoided,
        auraCharged: false,
      },
    }),
    false,
  )
  return spent
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
  return retainSoundContacts(state, applyProjectileHit(state, hit), { projectile: hit.projectile })
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
  return finishAfterImpact(
    archived,
    archived.impact!.attacker,
    otherSide(archived.impact!.attacker),
    attacker.id === 'tserriednich' &&
      hit.projectile.fighterId === attacker.id &&
      isFirearmProjectile(hit.projectile)
      ? hit.projectile.id
      : undefined,
  )
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
  shotId?: number,
): FightState {
  const impact = state.impact
  const owner = impact?.transfer?.owner ?? attackerSide
  const cause = impact?.transfer ? 'transfer' : impact?.projectileId ? 'projectile' : 'strike'
  return recordFightDeath(state, {
    victimSide: defenderSide,
    killerSide: owner === defenderSide ? null : owner,
    cause,
    ...(cause === 'projectile' && shotId !== undefined && impact?.projectileId === shotId
      ? { shotId }
      : {}),
  })
}

function resolveTrade(original: FightState, first: FightState): FightState {
  const second = recordCyclotronContact(original, resolveAttack(original, 'opponent'), 'opponent')
  if (first === original || second === original) return retainSoundContacts(original, first)
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
  const resolved = { ...traded, deaths: [...(first.deaths ?? []), ...(second.deaths ?? [])] }
  return retainSoundContacts(original, resolved, { simultaneous: first })
}

function impactWallSplat(options: {
  defence: ImpactDefence
  defender: ArcadeFighter
  attacker: ArcadeFighter
  knockback: number
  counterHit: boolean
}): boolean {
  return (
    !options.defence.avoided &&
    grammarAllowsWallSplat(options.attacker, options.knockback, options.counterHit) &&
    atWall(sleepingBody(options.defender), options.attacker, options.knockback)
  )
}

function captureIncomingProjectile(state: FightState, hit: ProjectileHit): FightState | null {
  return catchBungeeObject(state, hit) ?? captureCuldceptProjectile(state, hit)
}
