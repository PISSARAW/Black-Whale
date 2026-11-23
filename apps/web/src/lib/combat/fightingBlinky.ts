import { moveForSlot } from '../fighting/movesets'
import { pointInPolygon } from '../tour/geometry'
import type { Vec2 } from '../tour/types'
import type { CombatAction, CombatSide, CombatState } from './types'
import { otherSide } from './types'
import { outcomeOf } from './exchange'
import { lineOfSightClear } from './resolve'
import { exposedArenaWounds } from './wounds'

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
 * Applies selective suction, last-object return and blood extraction through real wounds.
 */
export function resolveFightingBlinky(state: CombatState, action: FightingMoveAction): CombatState {
  if (!isBlinkyUtilityMove(action)) return state
  if (action.slot === 'finisher') return drawBlood(state, action)
  if (action.slot === 'backSpecial') return ejectStoredObject(state, action)
  return swallowTargetObject(state, action)
}

function drawBlood(state: CombatState, action: FightingMoveAction): CombatState {
  const targetSide = otherSide(action.side)
  const target = state[targetSide]
  if (!canUseBlinky(state, action) || target.openWounds <= 0) return state
  if (distance(state[action.side].position, target.position) > BLINKY_RANGE) return state
  if (!lineOfSightClear(state.terrain.walls, state[action.side].position, target.position))
    return state
  const paid = spend(state, action, state.physicalObjects)
  const exposed = exposedArenaWounds(target)
  if (exposed <= 0) return paid
  const attacker = { ...paid[action.side], score: paid[action.side].score + 2 }
  const defender = {
    ...paid[targetSide],
    bloodLoss: paid[targetSide].bloodLoss + exposed,
    condition: paid[targetSide].condition === 'ko' ? ('ko' as const) : ('staggered' as const),
    recovery: paid[targetSide].condition === 'ko' ? 0 : 0.55,
    movement: [0, 0] as Vec2,
    intent: null,
  }
  return {
    ...paid,
    [action.side]: attacker,
    [targetSide]: defender,
    lastEvent: {
      at: state.clock,
      attacker: action.side,
      zone: 'torso',
      impact: 'critical',
      points: 2,
      technique: 'hatsu',
      moveId: 'shizuku:finisher',
    },
    outcome: outcomeOf(action.side, attacker, defender),
  }
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
