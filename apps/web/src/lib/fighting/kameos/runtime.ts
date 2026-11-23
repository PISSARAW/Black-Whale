import { updateControlledFighter } from '../duelStep/actors'
import { canAct } from '../fightActorState'
import { EMPTY_INPUT } from '../types'
import type { FightInput, FightSide, FightState } from '../types'
import { kameoDefinition } from './catalogue'
import type { KameoDefinition } from './catalogue'
import { advanceKameoTraps, deliverKameoEffect } from './effects'
import { kameoCooldownFactor } from '../martialSpecialists'
import type { KameoCallId, KameoId, KameoSlot } from './types'

/** The calls pressed this frame, by side; an absent side did not call. */
export type KameoCalls = Partial<Record<FightSide, KameoCallId>>

/** Offset from the leader, along its facing, where each call makes the kameo appear. */
const CALL_OFFSET: Record<KameoCallId, number> = { neutral: 3, forward: 8, back: -6 }

/**
 * One frame of every kameo: a call from reserve, then entering → acting → leaving →
 * reserve with a cooldown. The support effect lands once, `startup` frames into
 * `acting`. A kameo struck before leaving is interrupted and goes without it.
 * Traps keep ageing after their kameo has gone.
 */
export function advanceKameos(state: FightState, calls: KameoCalls): FightState {
  if (!state.kameos || state.phase !== 'fighting') return state
  let next = state
  for (const side of ['player', 'opponent'] as const) next = advanceSlot(next, side, calls[side])
  return advanceKameoTraps(next)
}

/** The call a pressed kameo button means, from the directions held with it. */
export function kameoCall(input: FightInput, facing: -1 | 1): KameoCallId | undefined {
  if (!input.kameo) return undefined
  const toward = facing > 0 ? input.right : input.left
  const away = facing > 0 ? input.left : input.right
  if (toward && !away) return 'forward'
  return away && !toward ? 'back' : 'neutral'
}

function advanceSlot(state: FightState, side: FightSide, call?: KameoCallId): FightState {
  const slot = state.kameos?.[side]
  if (!slot || slot.phase === 'eliminated') return state
  if (slot.phase === 'reserve') return reserve(state, side, call)
  const moved = { ...slot, fighter: updateControlledFighter(slot.fighter, EMPTY_INPUT) }
  const stepped = { ...moved, phaseFrames: moved.phaseFrames + 1 }
  if (interrupted(state, side, stepped)) return withSlot(state, side, phase(stepped, 'leaving'))
  const definition = kameoDefinition(slot.fighter.id as KameoId)
  if (stepped.phase === 'entering') return withSlot(state, side, entering(stepped, definition))
  if (stepped.phase === 'acting') return acting(withSlot(state, side, stepped), side, definition)
  return withSlot(state, side, leaving(stepped, definition, state[side]))
}

function reserve(state: FightState, side: FightSide, call?: KameoCallId): FightState {
  let slot = state.kameos![side]!
  if (slot.bufferedCall) {
    const { bufferedCall, ...ready } = slot
    state = withSlot(state, side, ready)
    slot = ready
    call ??= bufferedCall
  }
  if (slot.cooldownFrames > 0)
    return withSlot(state, side, { ...slot, cooldownFrames: slot.cooldownFrames - 1 })
  return call && canCallKameo(state, side, slot) ? enter(state, side, call) : state
}

export function canCallKameo(state: FightState, side: FightSide, slot: KameoSlot): boolean {
  const cost = kameoDefinition(slot.fighter.id as KameoId).auraCost
  return canAct(state[side]) && slot.fighter.health > 0 && slot.fighter.aura >= cost
}

function enter(state: FightState, side: FightSide, call: KameoCallId): FightState {
  const slot = state.kameos![side]!
  const leader = state[side]
  const x = Math.max(4, Math.min(96, leader.x + leader.facing * CALL_OFFSET[call]))
  const fighter = { ...slot.fighter, x, y: 0, velocityY: 0, facing: leader.facing, hitStun: 0 }
  return withSlot(state, side, { ...slot, fighter, call, phase: 'entering', phaseFrames: 0 })
}

/** A fallen leader, or a kameo struck before it leaves, ends the stay at once. */
function interrupted(state: FightState, side: FightSide, slot: KameoSlot): boolean {
  if (slot.phase === 'leaving') return false
  if (state[side].health <= 0) return true
  return slot.fighter.hitStun > 0 || slot.fighter.knockdownFrames > 0
}

function entering(slot: KameoSlot, definition: KameoDefinition): KameoSlot {
  return slot.phaseFrames >= definition.timing.enter ? phase(slot, 'acting') : slot
}

function acting(state: FightState, side: FightSide, definition: KameoDefinition): FightState {
  const { startup, recovery } = definition.timing
  const frames = state.kameos![side]!.phaseFrames
  const landed = frames === startup ? deliverKameoEffect(state, side) : state
  if (frames < startup + recovery) return landed
  return withSlot(landed, side, phase(landed.kameos![side]!, 'leaving'))
}

function leaving(
  slot: KameoSlot,
  definition: KameoDefinition,
  leader: FightState['player'],
): KameoSlot {
  if (slot.phaseFrames < definition.timing.leave) return slot
  const cooldownFrames = Math.max(1, Math.round(definition.cooldownFrames * kameoCooldownFactor(leader)))
  return { ...phase(slot, 'reserve'), call: null, cooldownFrames }
}

function phase(slot: KameoSlot, next: KameoSlot['phase']): KameoSlot {
  return { ...slot, phase: next, phaseFrames: 0 }
}

function withSlot(state: FightState, side: FightSide, slot: KameoSlot): FightState {
  return { ...state, kameos: { ...state.kameos, [side]: slot } }
}
