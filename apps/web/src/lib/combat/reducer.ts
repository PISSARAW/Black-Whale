import { resolveExchange } from './resolve'
import { pointInPolygon } from '../tour/geometry'
import { resolveMovement, wallsNear } from '../tour/navigation'
import type { Vec2 } from '../tour/types'
import {
  initialCombatState,
  otherSide,
  type ArenaHatsuEffect,
  type BodyZone,
  type CombatAction,
  type CombatSide,
  type CombatState,
  type FighterState,
  type Impact,
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
export const HATSU_COST = 18
export const EVADE_COST = 4
export const EVADE_DISTANCE = 1.4
export const MOVE_SPEED = 3.6
export const MIN_SEPARATION = 1
export const SCORE_TO_WIN = 10

interface StrikeRequest {
  state: CombatState
  side: CombatSide
  zone: BodyZone
  technique: 'strike' | 'ko' | 'hatsu'
  power?: number
  range?: number
  targetAt?: Vec2
}

export function combatReducer(state: CombatState, action: CombatAction): CombatState {
  if (state.outcome !== 'playing') return state
  if (action.type === 'TICK') return tick(state, action.dt)
  if (action.type === 'SYNC_POSITION')
    return replace(state, action.side, syncPosition(state[action.side], action.position))
  if (action.type === 'FACE')
    return replace(state, action.side, { ...state[action.side], facing: action.heading })
  if (action.type === 'EVADE') return evade(state, action.side, action.vector)
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
  if (action.type === 'PREPARE_STRIKE') return prepareStrike(state, action.side, action.zone)
  if (action.type === 'HATSU')
    return castHatsu(
      state,
      action.side,
      action.effect,
      action.zone,
      action.hatsuId,
      action.targetAt,
    )
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
  return ringOut(landReadyKo(landReadyIntent(advanceTethers(advanced, dt))))
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
    bound: Math.max(0, moved.bound - context.dt),
    empowered: Math.max(0, moved.empowered - context.dt),
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

function castHatsu(
  state: CombatState,
  side: CombatSide,
  effect: ArenaHatsuEffect,
  zone: BodyZone,
  hatsuId?: string,
  targetAt?: Vec2,
): CombatState {
  const fighter = state[side]
  if (fighter.condition !== 'ready' || fighter.cooldown > 0 || fighter.aura < HATSU_COST)
    return state
  const paid = { ...fighter, aura: fighter.aura - HATSU_COST, intent: null }
  let current = replace(state, side, paid)
  const rivalSide = otherSide(side)

  if (hatsuId === 'bungee-gum') {
    const anchor = targetAt ?? state[rivalSide].position
    const subject = targetAt ? side : rivalSide
    const gap = distance(state[subject].position, anchor)
    if (gap > 10) return state
    return {
      ...replace(current, side, { ...paid, cooldown: 0.8 }),
      tethers: [
        ...state.tethers.filter((tether) => tether.owner !== side),
        {
          id: `bungee-${side}`,
          owner: side,
          subject,
          anchor: targetAt ?? null,
          restLength: Math.max(0.8, gap * 0.6),
          remaining: 8,
        },
      ],
    }
  }

  if (effect === 'bind') {
    if (distance(fighter.position, state[rivalSide].position) > 7) return state
    current = replace(current, side, { ...paid, cooldown: 1.1 })
    return replace(current, rivalSide, {
      ...current[rivalSide],
      bound: 1.6,
      movement: [0, 0],
      intent: null,
    })
  }
  if (effect === 'restore') {
    return replace(current, side, {
      ...paid,
      aura: Math.min(paid.capacity, paid.aura + 42),
      condition: 'ready',
      recovery: 0,
      cooldown: 2.2,
    })
  }
  if (effect === 'enhance') {
    return replace(current, side, { ...paid, empowered: 5, cooldown: 0.8 })
  }
  return strike({
    state: current,
    side,
    zone,
    technique: 'hatsu',
    power: effect === 'impact' ? 1.65 : 0.82,
    range: effect === 'barrage' ? 9 : 2.7,
  })
}

function advanceTethers(state: CombatState, dt: number): CombatState {
  let current = state
  const live = state.tethers
    .map((tether) => ({ ...tether, remaining: tether.remaining - dt }))
    .filter((tether) => tether.remaining > 0)
  for (const tether of live) {
    const subject = current[tether.subject]
    const anchor = tether.anchor ?? current[otherSide(tether.subject)].position
    const gap = distance(subject.position, anchor)
    if (gap <= tether.restLength) continue
    const direction = normalise([anchor[0] - subject.position[0], anchor[1] - subject.position[1]])
    const pull = Math.min(gap - tether.restLength, 2.8 * dt)
    const proposed: Vec2 = [
      subject.position[0] + direction[0] * pull,
      subject.position[1] + direction[1] * pull,
    ]
    const position = resolveMovement(subject.position, proposed, {
      walls: wallsNear(current.terrain.walls, subject.position, pull + 1),
      radius: 0.45,
    })
    current = replace(current, tether.subject, { ...subject, position })
  }
  return { ...current, tethers: live }
}

function landReadyIntent(state: CombatState): CombatState {
  let current = state
  for (const side of ['player', 'opponent'] as const) {
    const intent = current[side].intent
    if (!intent || intent.remaining > 0 || current.outcome !== 'playing') continue
    current = replace(current, side, { ...current[side], intent: null })
    current = strike({
      state: current,
      side,
      zone: intent.zone,
      technique: 'strike',
      targetAt: intent.targetAt,
    })
  }
  return current
}

function evade(state: CombatState, side: CombatSide, vector: Vec2): CombatState {
  const fighter = state[side]
  if (fighter.condition !== 'ready' || fighter.aura < EVADE_COST || fighter.cooldown > 0)
    return state
  const direction = normalise(vector)
  const proposed: Vec2 = [
    fighter.position[0] + direction[0] * EVADE_DISTANCE,
    fighter.position[1] + direction[1] * EVADE_DISTANCE,
  ]
  const position = resolveMovement(fighter.position, proposed, {
    walls: wallsNear(state.terrain.walls, fighter.position, EVADE_DISTANCE + 1),
    radius: 0.45,
  })
  return ringOut(
    replace(state, side, {
      ...fighter,
      aura: fighter.aura - EVADE_COST,
      position,
      movement: [0, 0],
      cooldown: 0.32,
      intent: null,
    }),
  )
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
    power: request.power ?? (attacker.empowered > 0 ? 1.3 : 1),
    range: request.range,
    targetAt: request.targetAt,
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
  const pushed = applyPush(
    result.attacker,
    result.defender,
    result.event.impact,
    state.terrain.walls,
  )
  const defender = connected ? { ...pushed, intent: null } : pushed
  const outcome = outcomeOf(side, scored, defender)
  return ringOut({
    ...state,
    [side]: scored,
    [defenderSide]: defender,
    lastEvent: event,
    outcome,
  })
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

function prepareStrike(state: CombatState, side: CombatSide, zone: BodyZone): CombatState {
  const fighter = state[side]
  if (fighter.condition !== 'ready' || fighter.cooldown > 0 || fighter.ko || fighter.intent)
    return state
  return replace(state, side, {
    ...fighter,
    intent: { zone, remaining: STRIKE_WINDUP, targetAt: state[otherSide(side)].position },
    movement: [0, 0],
    feint: null,
  })
}

function applyPush(
  attacker: FighterState,
  defender: FighterState,
  impact: Impact,
  walls: CombatState['terrain']['walls'],
): FighterState {
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

function exchangeRecovery(technique: 'strike' | 'ko' | 'hatsu'): number {
  return technique === 'ko' ? 1.35 : 0.9
}

function setMovement(fighter: FighterState, vector: Vec2): FighterState {
  return fighter.condition === 'ready' ? { ...fighter, movement: normalise(vector) } : fighter
}

function syncPosition(fighter: FighterState, position: Vec2): FighterState {
  if (fighter.condition !== 'ready' || fighter.bound > 0 || fighter.intent) return fighter
  return { ...fighter, position, movement: [0, 0] }
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
