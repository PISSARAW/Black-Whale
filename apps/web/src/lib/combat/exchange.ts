import { resolveExchange } from './resolve'
import { pointInPolygon } from '../tour/geometry'
import { resolveMovement, wallsNear } from '../tour/navigation'
import type { Vec2 } from '../tour/types'
import {
  applyPush,
  distance,
  exchangeRecovery,
  normalise,
  replace,
  EVADE_COST,
  EVADE_DISTANCE,
  KO_COST,
  KO_WINDUP,
  SCORE_TO_WIN,
  STRIKE_WINDUP,
} from './fighter'
import {
  otherSide,
  type BodyZone,
  type CombatSide,
  type CombatState,
  type FighterState,
} from './types'

/** One blow, described fully enough that the resolver needs nothing else. */
export interface StrikeRequest {
  state: CombatState
  side: CombatSide
  zone: BodyZone
  technique: 'strike' | 'ko' | 'hatsu'
  power?: number
  range?: number
  targetAt?: Vec2
}

/**
 * What happens when two fighters actually meet: a blow is prepared, thrown,
 * resolved, and the board settles — tethers pull, an intent that came due
 * lands, a body pushed past the edge is out.
 *
 * The reducer above decides which of these an action calls for. This decides
 * what each one does.
 */

export function advanceTethers(state: CombatState, dt: number): CombatState {
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

export function landReadyIntent(state: CombatState): CombatState {
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

export function evade(state: CombatState, side: CombatSide, vector: Vec2): CombatState {
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

export function ringOut(state: CombatState): CombatState {
  const playerIn = pointInPolygon(state.player.position, state.terrain.footprint)
  const opponentIn = pointInPolygon(state.opponent.position, state.terrain.footprint)
  if (!playerIn) return { ...state, outcome: 'lost' }
  if (!opponentIn) return { ...state, outcome: 'won' }
  return state
}

export function landReadyKo(state: CombatState): CombatState {
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

export function strike(request: StrikeRequest): CombatState {
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
  const pushed = applyPush({
    attacker: result.attacker,
    defender: result.defender,
    impact: result.event.impact,
    walls: state.terrain.walls,
  })
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

export function outcomeOf(side: CombatSide, attacker: FighterState, defender: FighterState) {
  if (defender.condition !== 'ko' && attacker.score < SCORE_TO_WIN) return 'playing' as const
  return side === 'player' ? ('won' as const) : ('lost' as const)
}

export function chargeKo(state: CombatState, side: CombatSide, zone: BodyZone): CombatState {
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

export function prepareStrike(state: CombatState, side: CombatSide, zone: BodyZone): CombatState {
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
