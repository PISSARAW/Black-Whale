import { moveForSlot } from '../fighting/movesets'
import { pointInPolygon } from '../tour/geometry'
import type { Vec2 } from '../tour/types'
import type { CombatAction, CombatSide, CombatState } from './types'

type FightingMoveAction = Extract<CombatAction, { type: 'FIGHTING_MOVE' }>

const SUCTION_SLOTS = new Set(['neutralSpecial', 'downSpecial'])
const BLINKY_RANGE = 4
const RELEASE_CLEARANCE = 1.5

/** Blinky's native utility moves replace a body strike only when Shizuku performs them. */
export function isBlinkyUtilityMove(action: FightingMoveAction): boolean {
  return (
    action.fighterId === 'shizuku' &&
    (SUCTION_SLOTS.has(action.slot) || action.slot === 'backSpecial' || action.slot === 'finisher')
  )
}

/**
 * Applies selective suction and last-object return to Arena's physical scenery.
 * Blood deliberately remains unavailable until Arena has explicit wounds.
 */
export function resolveFightingBlinky(state: CombatState, action: FightingMoveAction): CombatState {
  if (!isBlinkyUtilityMove(action)) return state
  if (action.slot === 'finisher') return state
  if (action.slot === 'backSpecial') return ejectStoredObject(state, action)
  return swallowTargetObject(state, action)
}

function swallowTargetObject(state: CombatState, action: FightingMoveAction): CombatState {
  const target = eligibleTarget(state, action)
  if (!target || !canUseBlinky(state, action)) return state
  return spend(state, action, {
    ...state.physicalObjects,
    [target.id]: { ...target, storedBy: action.side },
  })
}

function eligibleTarget(state: CombatState, action: FightingMoveAction) {
  const target = action.targetObject
  if (!target || storedObject(state, action.side)) return null
  const known = state.physicalObjects[target.id]
  const position = known?.position ?? target.position
  if (known?.storedBy || distance(state[action.side].position, position) > BLINKY_RANGE) return null
  return { id: target.id, position }
}

function ejectStoredObject(state: CombatState, action: FightingMoveAction): CombatState {
  const stored = storedObject(state, action.side)
  if (!stored || !canUseBlinky(state, action) || !releaseIsClear(state, action.targetAt))
    return state
  return spend(state, action, {
    ...state.physicalObjects,
    [stored.id]: { ...stored, position: action.targetAt, storedBy: null },
  })
}

function canUseBlinky(state: CombatState, action: FightingMoveAction): boolean {
  const fighter = state[action.side]
  const move = moveForSlot(action.fighterId, action.slot)
  return Boolean(
    move &&
    !state.nenEffects.some(
      (effect) =>
        effect.kind === 'CAPTURED_ABILITY' &&
        effect.target === action.side &&
        effect.detail === 'blinky',
    ) &&
    fighter.mode !== 'zetsu' &&
    fighter.condition === 'ready' &&
    fighter.cooldown <= 0 &&
    !fighter.intent &&
    fighter.aura >= move.auraCost,
  )
}

function spend(
  state: CombatState,
  action: FightingMoveAction,
  physicalObjects: CombatState['physicalObjects'],
): CombatState {
  const fighter = state[action.side]
  const move = moveForSlot(action.fighterId, action.slot)!
  const cooldown = (move.tuning.startup + move.tuning.active + move.tuning.recovery) / 60
  return {
    ...state,
    physicalObjects,
    lastHatsuBySide: { ...state.lastHatsuBySide, [action.side]: 'blinky' },
    [action.side]: {
      ...fighter,
      aura: fighter.aura - move.auraCost,
      cooldown,
      movement: [0, 0],
    },
  }
}

function storedObject(state: CombatState, side: CombatSide) {
  return Object.values(state.physicalObjects).find((object) => object.storedBy === side)
}

function releaseIsClear(state: CombatState, at: Vec2): boolean {
  if (!pointInPolygon(at, state.terrain.footprint)) return false
  if (distance(state.player.position, at) < RELEASE_CLEARANCE) return false
  if (distance(state.opponent.position, at) < RELEASE_CLEARANCE) return false
  return !Object.values(state.physicalObjects).some(
    (object) => !object.storedBy && distance(object.position, at) < RELEASE_CLEARANCE,
  )
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}
