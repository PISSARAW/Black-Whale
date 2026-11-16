import { arenaObjects } from './arenaActions'
import { blinkyState } from './blinky'
import { updateEntity } from './preparationWorld'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

/** Blinky has one last-object slot, shared by scenery, ammunition and blood. */
export function forgetArenaVacuum(state: FightState, side: FightSide): FightState {
  if (!state.arena?.stored[side]) return state
  return {
    ...state,
    arena: { ...state.arena, stored: { ...state.arena.stored, [side]: undefined } },
    [side]: { ...state[side], blinky: { ...blinkyState(state[side]), lastArenaObject: undefined } },
  }
}

export function storeArenaVacuum(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): FightState {
  state = updateEntity(state, entry.id, { present: false })
  return {
    ...state,
    arena: { ...state.arena!, stored: { ...state.arena!.stored, [side]: entry.id } },
    [side]: {
      ...state[side],
      blinky: {
        ...blinkyState(state[side]),
        lastObject: undefined,
        lastWasBlood: false,
        lastArenaObject: entry.id,
      },
    },
  }
}

export function ejectArenaVacuum(state: FightState, side: FightSide): FightState {
  const id = blinkyState(state[side]).lastArenaObject
  const entry = state.battlefield?.entities.find((object) => object.id === id)
  if (!entry || !state.arena) return state
  const fighter = state[side]
  const x = Math.max(10, Math.min(90, fighter.x + fighter.facing * 7))
  const enemy = side === 'player' ? 'opponent' : 'player'
  if (
    Math.abs(state[enemy].x - x) < 6 ||
    arenaObjects(state).some((object) => Math.abs(object.x - x) < 7)
  )
    return state
  return forgetArenaVacuum(updateEntity(state, entry.id, { present: true, x, y: 0 }), side)
}
