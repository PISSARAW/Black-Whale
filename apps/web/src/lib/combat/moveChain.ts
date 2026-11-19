import { moveById } from '../fighting/movesets'
import type { FighterMove } from '../fighting/movesetTypes'
import { resolveMovement, wallsNear } from '../tour/navigation'
import type { Vec2 } from '../tour/types'
import {
  BODY_ZONES,
  otherSide,
  type AttackIntent,
  type BodyZone,
  type CombatSide,
  type CombatState,
  type FighterState,
} from './types'

/** Clash frame data is authored at 60 fps; Arena counts seconds. */
export const FRAME = 1 / 60
/** One Clash lane unit in Arena metres: the scale Arena already uses for reach. */
export const LANE_METRE = 0.2
/** A press this early is kept and released when the running move lands. */
export const CHAIN_BUFFER = 0.2

/** The cancel route a landed Clash move leaves open to its owner. */
export interface MoveChain {
  moveId: string
  connected: 'hit' | 'block'
  /** Arena clock at which the cancel window closes. */
  until: number
  /** Moves of the running combo, oldest first. */
  history: readonly string[]
}

/** A move pressed while the previous one was still running. */
export interface BufferedMove {
  fighterId: import('../fighting/types').FighterId
  slot: import('../fighting/types').MoveSlot
  targetAt: Vec2
  until: number
}

/** Clash cancel grammar: a hit opens `cancelInto`, a blocked hit opens `cancelOnBlockInto`. */
export function chainAccepts(fighter: FighterState, move: FighterMove, clock: number): boolean {
  const chain = fighter.chain
  if (!chain || chain.until < clock || fighter.intent) return false
  const previous = moveById(chain.moveId)
  if (!previous) return false
  const routes = chain.connected === 'hit' ? previous.cancelInto : previous.cancelOnBlockInto
  return routes.includes(move.id)
}

/** The combo a newly prepared move belongs to. */
export function comboHistory(fighter: FighterState, move: FighterMove, chained: boolean) {
  return chained && fighter.chain ? [...fighter.chain.history, move.id] : [move.id]
}

/** Hits counted in the attacker's running combo, for the HUD. */
export function comboCount(fighter: FighterState, clock: number): number {
  const chain = fighter.chain
  if (!chain || chain.connected !== 'hit' || chain.until < clock) return 0
  return chain.history.length
}

/** A throw takes the body the guard does not cover and ignores the active guard window. */
export function throwOpening(state: CombatState, side: CombatSide, intent: AttackIntent) {
  const move = moveById(intent.moveId)
  if (move?.category !== 'throw') return { state, zone: intent.zone }
  const defenderSide = otherSide(side)
  const defender = state[defenderSide]
  const zone: BodyZone = BODY_ZONES.find((candidate) => candidate !== defender.guard) ?? 'torso'
  return { state: { ...state, [defenderSide]: { ...defender, guardWindow: 0 } }, zone }
}

interface Settlement {
  before: CombatState
  after: CombatState
  side: CombatSide
  intent: AttackIntent
}

/**
 * Applies what Clash authors for a landed move after Arena has resolved the
 * exchange: hitstun or blockstun, knockback along the 3D attack line, and the
 * cancel window that lets the next move of a combo come out.
 */
export function settleFightingMove({ before, after, side, intent }: Settlement): CombatState {
  const move = moveById(intent.moveId)
  if (!move) return after
  const event = after.lastEvent
  const landed = event && event !== before.lastEvent && event.attacker === side
  if (!landed || event.impact === 'miss')
    return { ...after, [side]: { ...after[side], chain: null } }
  const connected = event.impact === 'blocked' ? 'block' : 'hit'
  const defenderSide = otherSide(side)
  const stunned = stun(after[defenderSide], move, connected)
  const defender = knockBack({
    defender: stunned,
    from: after[side].position,
    metres: connected === 'hit' ? move.tuning.knockback * LANE_METRE : 0,
    walls: after.terrain.walls,
  })
  const chain = openChain({ move, connected, clock: after.clock, history: intent.combo })
  return { ...after, [side]: { ...after[side], chain }, [defenderSide]: defender }
}

function openChain(options: {
  move: FighterMove
  connected: MoveChain['connected']
  clock: number
  history?: readonly string[]
}): MoveChain {
  const { move, connected, clock, history } = options
  const window = move.cancelWindow?.end ?? move.tuning.recovery
  return {
    moveId: move.id,
    connected,
    until: clock + window * FRAME,
    history: history ?? [move.id],
  }
}

function stun(defender: FighterState, move: FighterMove, connected: 'hit' | 'block') {
  if (defender.condition === 'ko' || defender.condition === 'down') return defender
  if (connected === 'block')
    return { ...defender, cooldown: Math.max(defender.cooldown, move.tuning.blockstun * FRAME) }
  return {
    ...defender,
    condition: 'staggered' as const,
    recovery: Math.max(defender.recovery, move.tuning.hitstun * FRAME),
    intent: null,
    chain: null,
    movement: [0, 0] as Vec2,
  }
}

function knockBack(push: {
  defender: FighterState
  from: Vec2
  metres: number
  walls: CombatState['terrain']['walls']
}): FighterState {
  const { defender, from, metres, walls } = push
  const dx = defender.position[0] - from[0]
  const dz = defender.position[1] - from[1]
  const length = Math.hypot(dx, dz)
  if (metres <= 0 || length === 0) return defender
  const proposed: Vec2 = [
    defender.position[0] + (dx / length) * metres,
    defender.position[1] + (dz / length) * metres,
  ]
  const position = resolveMovement(defender.position, proposed, {
    walls: wallsNear(walls, defender.position, metres + 1),
    radius: 0.45,
  })
  return { ...defender, position }
}
