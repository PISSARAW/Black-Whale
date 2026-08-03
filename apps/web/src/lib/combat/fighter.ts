import { resolveMovement, wallsNear } from '../tour/navigation'
import type { Vec2 } from '../tour/types'
import type { BodyZone, CombatAction, CombatSide, CombatState, FighterState, Impact } from './types'

/** What a fighter needs to know about the world for one frame of the clock. */
export interface TickContext {
  dt: number
  state: CombatState
}

/**
 * The rules that apply to one fighter at a time: how aura is spent and
 * recovered, how a body moves, how a blow displaces it.
 *
 * They are separated from `reducer.ts` because they answer a different
 * question. The reducer decides *which* rule an action triggers; these are the
 * rules. Keeping them together made one file that had to be read end to end to
 * follow either.
 */

export const REN_PER_SECOND = 1.5
export const GYO_PER_SECOND = 4
export const IN_PER_SECOND = 4
export const KEN_PER_SECOND = 6
export const ZETSU_RECOVERY = 7
export const KO_COST = 18
export const KO_WINDUP = 0.8
export const RYU_SHIFT_TIME = 0.22
export const GUARD_WINDOW = 0.38
export const FEINT_COST = 3
export const STRIKE_WINDUP = 0.62
export const HATSU_COST = 18
export const EVADE_COST = 4
export const EVADE_DISTANCE = 1.4
export const MOVE_SPEED = 3.6
export const MIN_SEPARATION = 1
export const SCORE_TO_WIN = 10

export function advanceFighter(
  fighter: FighterState,
  rival: FighterState,
  context: TickContext,
): FighterState {
  const recovered = recoverCondition(fighter, context.dt)
  const charged = chargeContinuous(recovered, context.dt)
  const shifted = settleRyu(charged, context.dt)
  const moved = move(shifted, rival, context)
  return {
    ...moved,
    cooldown: Math.max(0, moved.cooldown - context.dt),
    guardWindow: Math.max(0, moved.guardWindow - context.dt),
    recoveryWindow: Math.max(0, moved.recoveryWindow - context.dt),
    bound: Math.max(0, moved.bound - context.dt),
    empowered: Math.max(0, moved.empowered - context.dt),
    feint: moved.cooldown - context.dt <= 0 ? null : moved.feint,
    intent: moved.intent
      ? { ...moved.intent, remaining: moved.intent.remaining - context.dt }
      : null,
    ko: moved.ko ? { ...moved.ko, remaining: moved.ko.remaining - context.dt } : null,
  }
}

export function settleRyu(fighter: FighterState, dt: number): FighterState {
  if (!fighter.ryuShift) return fighter
  const remaining = fighter.ryuShift.remaining - dt
  if (remaining > 0) return { ...fighter, ryuShift: { ...fighter.ryuShift, remaining } }
  return {
    ...fighter,
    attackShare: fighter.ryuShift.attackShare,
    guard: fighter.ryuShift.guard,
    ryuShift: null,
  }
}

export function recoverCondition(fighter: FighterState, dt: number): FighterState {
  if (fighter.condition === 'ready' || fighter.condition === 'ko') return fighter
  const recovery = Math.max(0, fighter.recovery - dt)
  return recovery === 0 ? { ...fighter, recovery, condition: 'ready' } : { ...fighter, recovery }
}

export function chargeContinuous(fighter: FighterState, dt: number): FighterState {
  if (fighter.mode === 'zetsu') {
    return {
      ...fighter,
      aura: Math.min(fighter.capacity, fighter.aura + ZETSU_RECOVERY * dt),
      gyo: false,
      in: false,
      ken: false,
      ko: null,
    }
  }

  const rate =
    (fighter.mode === 'ren' ? REN_PER_SECOND : 0) +
    (fighter.gyo ? GYO_PER_SECOND : 0) +
    (fighter.in ? IN_PER_SECOND : 0) +
    (fighter.ken ? KEN_PER_SECOND : 0)
  const cost = rate * dt
  if (cost <= fighter.aura) return { ...fighter, aura: fighter.aura - cost }
  return { ...fighter, aura: 0, mode: 'ten', gyo: false, in: false, ken: false, ko: null }
}

export function move(
  fighter: FighterState,
  rival: FighterState,
  context: TickContext,
): FighterState {
  if (fighter.condition !== 'ready' || fighter.ko || fighter.intent || fighter.bound > 0)
    return { ...fighter, movement: [0, 0] }
  const proposed: Vec2 = [
    fighter.position[0] + fighter.movement[0] * MOVE_SPEED * context.dt,
    fighter.position[1] + fighter.movement[1] * MOVE_SPEED * context.dt,
  ]
  const nearby = wallsNear(
    context.state.terrain.walls,
    fighter.position,
    MOVE_SPEED * context.dt + 2,
  )
  const resolved = resolveMovement(fighter.position, proposed, { walls: nearby, radius: 0.45 })
  if (distance(resolved, rival.position) < MIN_SEPARATION) {
    return { ...fighter, movement: [0, 0] }
  }
  return { ...fighter, position: resolved }
}

export function setMode(fighter: FighterState, mode: FighterState['mode']): FighterState {
  if (mode === 'zetsu') {
    return { ...fighter, mode, gyo: false, in: false, ken: false, ko: null }
  }
  return { ...fighter, mode }
}

export function setKen(fighter: FighterState, on: boolean): FighterState {
  if (fighter.mode === 'zetsu') return fighter
  return { ...fighter, ken: on, ko: on ? null : fighter.ko }
}

export function setRyu(
  fighter: FighterState,
  action: Extract<CombatAction, { type: 'RYU' }>,
): FighterState {
  const attackShare = clamp(action.attackShare ?? fighter.attackShare, 0.1, 0.9)
  const guard = action.guard ?? fighter.guard
  if (attackShare === fighter.attackShare && guard === fighter.guard) return fighter
  return { ...fighter, ryuShift: { attackShare, guard, remaining: RYU_SHIFT_TIME }, ko: null }
}

export function activeGuard(fighter: FighterState): FighterState {
  if (fighter.condition !== 'ready' || fighter.mode === 'zetsu') return fighter
  return { ...fighter, guardWindow: GUARD_WINDOW, ko: null }
}

export function feint(fighter: FighterState, zone: BodyZone): FighterState {
  if (fighter.condition !== 'ready' || fighter.cooldown > 0 || fighter.aura < FEINT_COST)
    return fighter
  return { ...fighter, aura: fighter.aura - FEINT_COST, feint: zone, cooldown: 0.28 }
}

export interface Push {
  attacker: FighterState
  defender: FighterState
  impact: Impact
  walls: CombatState['terrain']['walls']
}

export function applyPush({ attacker, defender, impact, walls }: Push): FighterState {
  const distance = impact === 'knockdown' ? 1.6 : impact === 'critical' ? 0.75 : 0
  if (distance === 0) return defender
  const direction = normalise([
    defender.position[0] - attacker.position[0],
    defender.position[1] - attacker.position[1],
  ])
  const proposed: Vec2 = [
    defender.position[0] + direction[0] * distance,
    defender.position[1] + direction[1] * distance,
  ]
  return {
    ...defender,
    position: resolveMovement(defender.position, proposed, {
      walls: wallsNear(walls, defender.position, distance + 1),
      radius: 0.45,
    }),
  }
}

export function exchangeRecovery(technique: 'strike' | 'ko' | 'hatsu'): number {
  return technique === 'ko' ? 1.35 : 0.9
}

export function setMovement(fighter: FighterState, vector: Vec2): FighterState {
  return fighter.condition === 'ready' ? { ...fighter, movement: normalise(vector) } : fighter
}

export function syncPosition(fighter: FighterState, position: Vec2): FighterState {
  if (fighter.condition !== 'ready' || fighter.bound > 0 || fighter.intent) return fighter
  return { ...fighter, position, movement: [0, 0] }
}

export function toggle(fighter: FighterState, key: 'gyo' | 'in', on: boolean): FighterState {
  if (fighter.mode === 'zetsu') return fighter
  return { ...fighter, [key]: on }
}

export function replace(state: CombatState, side: CombatSide, fighter: FighterState): CombatState {
  return { ...state, [side]: fighter }
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export function normalise(vector: Vec2): Vec2 {
  const length = Math.hypot(vector[0], vector[1])
  return length > 1 ? [vector[0] / length, vector[1] / length] : vector
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}
