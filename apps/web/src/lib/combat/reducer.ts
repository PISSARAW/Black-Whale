import { resolveExchange } from './resolve'
import { pointInPolygon } from '../tour/geometry'
import { resolveMovement, wallsNear } from '../tour/navigation'
import type { Vec2 } from '../tour/types'
import {
  initialCombatState,
  otherSide,
  type BodyZone,
  type CombatAction,
  type CombatSide,
  type CombatState,
  type FighterState,
} from './types'

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
export const MOVE_SPEED = 3.6
export const MIN_SEPARATION = 1
export const SCORE_TO_WIN = 10

interface StrikeRequest {
  state: CombatState
  side: CombatSide
  zone: BodyZone
  technique: 'strike' | 'ko'
}

export function combatReducer(state: CombatState, action: CombatAction): CombatState {
  if (state.outcome !== 'playing') return state
  if (action.type === 'TICK') return tick(state, action.dt)
  if (action.type === 'MOVE')
    return replace(state, action.side, setMovement(state[action.side], action.vector))
  if (action.type === 'MODE')
    return replace(state, action.side, setMode(state[action.side], action.mode))
  if (action.type === 'RYU') return replace(state, action.side, setRyu(state[action.side], action))
  if (action.type === 'GYO')
    return replace(state, action.side, toggle(state[action.side], 'gyo', action.on))
  if (action.type === 'IN')
    return replace(state, action.side, toggle(state[action.side], 'in', action.on))
  if (action.type === 'KEN')
    return replace(state, action.side, setKen(state[action.side], action.on))
  if (action.type === 'GUARD') return replace(state, action.side, activeGuard(state[action.side]))
  if (action.type === 'FEINT')
    return replace(state, action.side, feint(state[action.side], action.zone))
  if (action.type === 'PREPARE_STRIKE')
    return replace(state, action.side, prepareStrike(state[action.side], action.zone))
  if (action.type === 'STRIKE') {
    return strike({ state, side: action.side, zone: action.zone, technique: 'strike' })
  }
  if (action.type === 'KO') return chargeKo(state, action.side, action.zone)
  return state
}

export { initialCombatState }

function tick(state: CombatState, dt: number): CombatState {
  const context = { dt, state }
  const advanced: CombatState = {
    ...state,
    clock: state.clock + dt,
    player: advanceFighter(state.player, state.opponent, context),
    opponent: advanceFighter(state.opponent, state.player, context),
  }
  return ringOut(landReadyKo(landReadyIntent(advanced)))
}

interface TickContext {
  dt: number
  state: CombatState
}

function advanceFighter(
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
    feint: moved.cooldown - context.dt <= 0 ? null : moved.feint,
    intent: moved.intent
      ? { ...moved.intent, remaining: moved.intent.remaining - context.dt }
      : null,
    ko: moved.ko ? { ...moved.ko, remaining: moved.ko.remaining - context.dt } : null,
  }
}

function settleRyu(fighter: FighterState, dt: number): FighterState {
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

function recoverCondition(fighter: FighterState, dt: number): FighterState {
  if (fighter.condition === 'ready' || fighter.condition === 'ko') return fighter
  const recovery = Math.max(0, fighter.recovery - dt)
  return recovery === 0 ? { ...fighter, recovery, condition: 'ready' } : { ...fighter, recovery }
}

function chargeContinuous(fighter: FighterState, dt: number): FighterState {
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

function move(fighter: FighterState, rival: FighterState, context: TickContext): FighterState {
  if (fighter.condition !== 'ready' || fighter.ko || fighter.intent)
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

function landReadyIntent(state: CombatState): CombatState {
  let current = state
  for (const side of ['player', 'opponent'] as const) {
    const intent = current[side].intent
    if (!intent || intent.remaining > 0 || current.outcome !== 'playing') continue
    current = replace(current, side, { ...current[side], intent: null })
    current = strike({ state: current, side, zone: intent.zone, technique: 'strike' })
  }
  return current
}

function ringOut(state: CombatState): CombatState {
  const playerIn = pointInPolygon(state.player.position, state.terrain.footprint)
  const opponentIn = pointInPolygon(state.opponent.position, state.terrain.footprint)
  if (!playerIn) return { ...state, outcome: 'lost' }
  if (!opponentIn) return { ...state, outcome: 'won' }
  return state
}

function landReadyKo(state: CombatState): CombatState {
  let current = state
  if (current.player.ko && current.player.ko.remaining <= 0) {
    current = strike({
      state: current,
      side: 'player',
      zone: current.player.ko.zone,
      technique: 'ko',
    })
  }
  if (current.outcome === 'playing' && current.opponent.ko && current.opponent.ko.remaining <= 0) {
    current = strike({
      state: current,
      side: 'opponent',
      zone: current.opponent.ko.zone,
      technique: 'ko',
    })
  }
  return current
}

function strike(request: StrikeRequest): CombatState {
  const { state, side, zone, technique } = request
  const attacker = state[side]
  if (attacker.cooldown > 0 || attacker.condition !== 'ready') return state
  if (technique === 'strike' && attacker.ko) return state

  const defenderSide = otherSide(side)
  const result = resolveExchange({
    attacker: technique === 'ko' ? { ...attacker, ko: null } : attacker,
    defender: state[defenderSide],
    attackerSide: side,
    zone,
    technique,
    clock: state.clock,
    walls: state.terrain.walls,
  })
  const counterBonus = state[defenderSide].recoveryWindow > 0 && result.event.points > 0 ? 1 : 0
  const event = counterBonus
    ? { ...result.event, points: result.event.points + counterBonus }
    : result.event
  const scored = {
    ...result.attacker,
    score: result.attacker.score + event.points,
    recoveryWindow: exchangeRecovery(technique),
    feint: null,
  }
  const connected = result.event.impact !== 'miss' && result.event.impact !== 'blocked'
  const defender = connected ? { ...result.defender, intent: null } : result.defender
  const outcome = outcomeOf(side, scored, defender)
  return {
    ...state,
    [side]: scored,
    [defenderSide]: defender,
    lastEvent: event,
    outcome,
  }
}

function outcomeOf(side: CombatSide, attacker: FighterState, defender: FighterState) {
  if (defender.condition !== 'ko' && attacker.score < SCORE_TO_WIN) return 'playing' as const
  return side === 'player' ? ('won' as const) : ('lost' as const)
}

function chargeKo(state: CombatState, side: CombatSide, zone: BodyZone): CombatState {
  const fighter = state[side]
  if (
    fighter.aura < KO_COST ||
    fighter.mode === 'zetsu' ||
    fighter.ken ||
    fighter.ko ||
    fighter.condition !== 'ready'
  ) {
    return state
  }
  return replace(state, side, {
    ...fighter,
    aura: fighter.aura - KO_COST,
    attackShare: 1,
    guard: zone,
    ko: { zone, remaining: KO_WINDUP },
  })
}

function setMode(fighter: FighterState, mode: FighterState['mode']): FighterState {
  if (mode === 'zetsu') {
    return { ...fighter, mode, gyo: false, in: false, ken: false, ko: null }
  }
  return { ...fighter, mode }
}

function setKen(fighter: FighterState, on: boolean): FighterState {
  if (fighter.mode === 'zetsu') return fighter
  return { ...fighter, ken: on, ko: on ? null : fighter.ko }
}

function setRyu(
  fighter: FighterState,
  action: Extract<CombatAction, { type: 'RYU' }>,
): FighterState {
  const attackShare = clamp(action.attackShare ?? fighter.attackShare, 0.1, 0.9)
  const guard = action.guard ?? fighter.guard
  if (attackShare === fighter.attackShare && guard === fighter.guard) return fighter
  return { ...fighter, ryuShift: { attackShare, guard, remaining: RYU_SHIFT_TIME }, ko: null }
}

function activeGuard(fighter: FighterState): FighterState {
  if (fighter.condition !== 'ready' || fighter.mode === 'zetsu') return fighter
  return { ...fighter, guardWindow: GUARD_WINDOW, ko: null }
}

function feint(fighter: FighterState, zone: BodyZone): FighterState {
  if (fighter.condition !== 'ready' || fighter.cooldown > 0 || fighter.aura < FEINT_COST)
    return fighter
  return { ...fighter, aura: fighter.aura - FEINT_COST, feint: zone, cooldown: 0.28 }
}

function prepareStrike(fighter: FighterState, zone: BodyZone): FighterState {
  if (fighter.condition !== 'ready' || fighter.cooldown > 0 || fighter.ko || fighter.intent)
    return fighter
  return {
    ...fighter,
    intent: { zone, remaining: STRIKE_WINDUP },
    movement: [0, 0],
    feint: null,
  }
}

function exchangeRecovery(technique: 'strike' | 'ko'): number {
  return technique === 'ko' ? 1.35 : 0.9
}

function setMovement(fighter: FighterState, vector: Vec2): FighterState {
  return fighter.condition === 'ready' ? { ...fighter, movement: normalise(vector) } : fighter
}

function toggle(fighter: FighterState, key: 'gyo' | 'in', on: boolean): FighterState {
  if (fighter.mode === 'zetsu') return fighter
  return { ...fighter, [key]: on }
}

function replace(state: CombatState, side: CombatSide, fighter: FighterState): CombatState {
  return { ...state, [side]: fighter }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function normalise(vector: Vec2): Vec2 {
  const length = Math.hypot(vector[0], vector[1])
  return length > 1 ? [vector[0] / length, vector[1] / length] : vector
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}
