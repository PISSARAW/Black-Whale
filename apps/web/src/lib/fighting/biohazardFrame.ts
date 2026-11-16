import {
  BIOHAZARD_TRANSFORM,
  biohazardAuthority,
  biohazardNen,
  type BiohazardObject,
} from './biohazard'
import { bindBiohazard, pigeonCanCapture, tickBiohazardRestraint } from './biohazardCapture'
import { strikeBiohazardMelee } from './biohazardImpact'
import type { FightSide, FightState } from './types'

/** Runs once per simulation frame, including borrowers; inventory never comes from the Hatsu. */
export function advanceBiohazard(state: FightState): FightState {
  let next = {
    ...state,
    player: tickBiohazardRestraint(state.player),
    opponent: tickBiohazardRestraint(state.opponent),
  }
  for (const side of ['player', 'opponent'] as const) next = advanceInventory(next, side)
  return next
}

function advanceInventory(state: FightState, side: FightSide): FightState {
  const inventory = state[side].biohazard
  if (!inventory) return state
  let next = state
  for (const object of inventory.objects) next = advanceObject(next, side, object.id)
  return next
}

function advanceObject(state: FightState, side: FightSide, id: number): FightState {
  const object = state[side].biohazard!.objects.find((o) => o.id === id)!
  const actor = state[side]
  if (object.phase === 'carried' || object.phase === 'broken') return state
  if (object.phase === 'bound') return advanceBound(state, side, object)
  if (object.phase === 'dropped') return recoverObject(state, side, object)
  if (!biohazardCanPersist(actor, object)) return store(state, side, droppedObject(object))
  if (object.phase === 'transforming') return advanceTransformation(state, side, object)
  if (object.phase === 'returning') return returnObject(state, side, object)
  return advanceFlight(state, side, object)
}

function biohazardCanPersist(actor: FightState['player'], object: BiohazardObject): boolean {
  return biohazardAuthority(actor) && biohazardNen(actor) && object.life > 0
}

function advanceTransformation(
  state: FightState,
  side: FightSide,
  object: BiohazardObject,
): FightState {
  const fighter = state[side]
  if (fighter.hitStun > 0 || fighter.knockdownFrames > 0)
    return store(state, side, { ...object, phase: 'carried', frames: 0 })
  const frames = object.frames + 1
  const next = store(state, side, {
    ...object,
    x: fighter.x + fighter.facing * 2,
    y: fighter.y + 6,
    frames,
    phase: frames >= BIOHAZARD_TRANSFORM ? 'flying' : 'transforming',
  })
  return { ...next, [side]: { ...next[side], pose: 'special' } }
}

function advanceFlight(state: FightState, side: FightSide, object: BiohazardObject): FightState {
  const moved = { ...object, x: object.x + object.direction * 0.65, life: object.life - 1 }
  if (moved.x < 3 || moved.x > 97) return store(state, side, droppedObject(moved))
  const next = strikeBiohazardMelee(store(state, side, moved), side, moved)
  if (next[side].biohazard!.objects.find((o) => o.id === object.id)!.phase !== 'flying') return next
  const target = next[side === 'player' ? 'opponent' : 'player']
  if (!pigeonCanCapture(target, moved)) return next
  return bindBiohazard(store(next, side, { ...moved, phase: 'bound' }), side, moved)
}

function advanceBound(state: FightState, side: FightSide, object: BiohazardObject): FightState {
  const target = state[side === 'player' ? 'opponent' : 'player']
  const restraint = target.biohazardRestraint
  if (restraint?.owner === side && restraint.objectId === object.id)
    return store(state, side, { ...object, x: target.x, y: target.y + 5 })
  // The metal remains physical when Nen ends. Escape opens it; a damaging follow-up breaks it.
  const phase = target.hitStun > 0 || target.health <= 0 ? 'broken' : 'dropped'
  return store(state, side, { ...object, phase, x: target.x, y: 0 })
}

function returnObject(state: FightState, side: FightSide, object: BiohazardObject): FightState {
  const owner = state[side]
  const gap = owner.x - object.x
  const x = object.x + Math.sign(gap) * Math.min(0.8, Math.abs(gap))
  const phase = Math.abs(gap) < 2 ? 'carried' : 'returning'
  const direction = gap === 0 ? object.direction : (Math.sign(gap) as -1 | 1)
  return store(state, side, {
    ...object,
    x,
    y: owner.y + 6,
    phase,
    direction,
    life: object.life - 1,
  })
}

function recoverObject(state: FightState, side: FightSide, object: BiohazardObject): FightState {
  const owner = state[side]
  if (owner.y > 0 || Math.abs(owner.x - object.x) > 3) return state
  return store(state, side, { ...object, phase: 'carried', frames: 0 })
}

function store(state: FightState, side: FightSide, object: BiohazardObject): FightState {
  const fighter = state[side]
  return {
    ...state,
    [side]: {
      ...fighter,
      biohazard: {
        objects: fighter.biohazard!.objects.map((o) => (o.id === object.id ? object : o)),
      },
    },
  }
}

function droppedObject(object: BiohazardObject): BiohazardObject {
  return { ...object, phase: 'dropped', x: Math.max(7, Math.min(93, object.x)), y: 0 }
}
