import { chainAbilitySealed } from './kurapika'
import { voluntaryNenAvailable } from './nenAccess'
import { morenaPresent } from './preparationRequirements'
import { constructionFactor } from './nenCategories'
import { chrolloHasActivePage, chrolloPageForMove } from './chrolloBook'
import { inMorenasHideout } from './fightEnvironment'
import { finishFight } from './combatVerdict'
import { sleepingBody, wakeHanzoBody } from './hanzoProjection'
import {
  LSDF_GRAVITY,
  qualifyLsdfInfraction,
  withoutPortableWeapons,
  type LsdfInfraction,
} from './lsdfInfraction'
import type { ArcadeFighter, FightSide, FightState } from './types'

export interface LsdfGuard {
  target: FightSide
  x: number
  level: number
  phase: 'approaching' | 'escorting'
  exitX: 0 | 100
  /** The infraction Yokotani qualified when he introduced himself; it sets the first level. */
  infraction?: LsdfInfraction
}

/** Chapter 399: introduction to an unlawful intruder, in Morena's occupied hideout. */
export function lsdfJurisdiction(state: FightState, side: FightSide): boolean {
  const target = side === 'player' ? 'opponent' : 'player'
  return (
    inMorenasHideout(state.environment) &&
    morenaPresent(state) &&
    qualifyLsdfInfraction(state, side) !== null &&
    state[target].id !== 'morena'
  )
}

export function ownsLsdf(fighter: ArcadeFighter): boolean {
  return (
    fighter.id === 'yokotani' ||
    (fighter.id === 'chrollo' && chrolloHasActivePage(fighter, 'yokotani'))
  )
}

export function isLsdfMove(fighter: ArcadeFighter, moveId?: string): boolean {
  if (fighter.id === 'yokotani') return true
  return chrolloPageForMove(fighter, moveId) === 'yokotani'
}

export function lsdfCanPersist(state: FightState, side: FightSide): boolean {
  const fighter = state[side]
  return (
    voluntaryNenAvailable(fighter) &&
    lsdfJurisdiction(state, side) &&
    ownsLsdf(fighter) &&
    !chainAbilitySealed(fighter, 'yokotani:neutralSpecial')
  )
}

export function canActivateLsdf(state: FightState, side: FightSide): boolean {
  return lsdfCanPersist(state, side) && !state.lsdf?.[side]
}

export function introduceLsdf(state: FightState, side: FightSide): FightState {
  if (state.phase !== 'fighting' || !canActivateLsdf(state, side)) return state
  const target = side === 'player' ? 'opponent' : 'player'
  const infraction = qualifyLsdfInfraction(state, side)!
  const guard: LsdfGuard = {
    target,
    x: state[side].x,
    level: LSDF_GRAVITY[infraction],
    infraction,
    phase: 'approaching',
    exitX: state[target].x < 50 ? 0 : 100,
  }
  return { ...state, lsdf: { ...state.lsdf, [side]: guard } }
}

/** Guards have no hurtbox and cannot be damaged. Yokotani himself remains vulnerable. */
export function advanceLsdf(state: FightState): FightState {
  if (state.phase !== 'fighting' || !state.lsdf) return state
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    if (next.phase !== 'fighting') break
    const guard = next.lsdf?.[side]
    if (!guard) continue
    next = lsdfCanPersist(next, side) ? advanceGuard(next, side, guard) : dismissGuard(next, side)
  }
  return next
}

function dismissGuard(state: FightState, side: FightSide): FightState {
  const lsdf = { ...state.lsdf }
  delete lsdf[side]
  return { ...state, lsdf }
}

function advanceGuard(state: FightState, side: FightSide, guard: LsdfGuard): FightState {
  if (guard.phase === 'escorting') return escortIntruder(state, side, guard)
  const target = state[guard.target]
  const body = sleepingBody(target)
  // Further aggression after the charges are declared increases the alert level.
  const witnessedLevel =
    state.securityAlert?.lastActor === guard.target ? state.securityAlert.level : guard.level
  const level = Math.min(
    5,
    Math.max(guard.level, witnessedLevel) + Number(target.attack?.frame === 1),
  )
  const x = approach(guard.x, body.x, (0.45 + level * 0.08) * constructionFactor(state[side]))
  const arrived = Math.abs(x - body.x) <= 2.5 && body.y <= 3
  const nextGuard: LsdfGuard = { ...guard, x, level, phase: arrived ? 'escorting' : 'approaching' }
  const next = { ...state, lsdf: { ...state.lsdf, [side]: nextGuard } }
  return arrived ? escortIntruder(next, side, nextGuard) : next
}

function escortIntruder(state: FightState, side: FightSide, guard: LsdfGuard): FightState {
  // A graver intervention carries the intruder out faster; it never strikes harder.
  const x = approach(guard.x, guard.exitX, 0.6 + (guard.level - 1) * 0.1)
  const target: ArcadeFighter = {
    ...wakeHanzoBody(state[guard.target]),
    x,
    y: 0,
    velocityY: 0,
    motion: undefined,
    pose: 'walk',
    blocking: false,
    crouching: false,
    attack: null,
    bufferedAttack: null,
    // Removing an attack is not confiscation: the carried weapon stays unavailable after escort.
    weaponsConfiscated: true,
    equipment: withoutPortableWeapons(state[guard.target]),
    // Physical restraint, not a damaging hit or an aura-sealing technique.
    hitStun: Math.max(2, state[guard.target].hitStun),
  }
  const next: FightState = {
    ...state,
    [guard.target]: target,
    bungeeGum: null,
    gumNetwork: undefined,
    lsdf: { ...state.lsdf, [side]: { ...guard, x } },
  }
  return x === guard.exitX ? expelIntruder(next, side, guard.target) : next
}

function expelIntruder(state: FightState, owner: FightSide, target: FightSide): FightState {
  const expelled: FightState = {
    ...state,
    expulsion: { owner, target, sequence: (state.expulsion?.sequence ?? 0) + 1 },
    [target]: { ...state[target], hitStun: 0 },
  }
  if (state.mode !== 'training') return finishFight(expelled, owner, 'expulsion')
  return {
    ...dismissGuard(expelled, owner),
    [target]: { ...expelled[target], x: target === 'player' ? 22 : 78, pose: 'idle' },
  }
}

function approach(from: number, to: number, step: number): number {
  return from + Math.sign(to - from) * Math.min(step, Math.abs(to - from))
}
