import { entitiesFor, liveEntity } from './preparationWorld'
import { LUINI_CEILING, settleLuiniPassage } from './luiniPassage'
import type { HatsuRequirement, PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

/** A room occupies this interval of the duel lane; dimensions are game conventions. */
export const LUINI_ROOM_HALF_WIDTH = 6
export const LUINI_ROOM_HEIGHT = 16
export type LuiniAction = 'anchor' | 'depart' | 'return'

export function validLuiniRooms(state: FightState, side: FightSide): PreparedEntity[] {
  return entitiesFor(state, side, 'room').filter(
    (entry) => entry.singleDoor && entry.sealed && !entry.invalidated,
  )
}

export function insideLuiniRoom(state: FightState, side: FightSide, room: PreparedEntity) {
  const fighter = state[side]
  return (
    Math.abs(fighter.x - room.x) <= LUINI_ROOM_HALF_WIDTH &&
    fighter.y >= room.y &&
    fighter.y <= room.y + LUINI_ROOM_HEIGHT
  )
}

export function luiniAnchor(state: FightState, side: FightSide): PreparedEntity | undefined {
  const id = state.battlefield?.luiniAnchors?.[side]
  return validLuiniRooms(state, side).find((room) => room.id === id)
}

export function luiniRoomAtBody(state: FightState, side: FightSide) {
  return validLuiniRooms(state, side).find((room) => insideLuiniRoom(state, side, room))
}

export function luiniAction(state: FightState, side: FightSide): LuiniAction {
  if (state[side].luiniPassage) return 'return'
  const room = luiniAnchor(state, side)
  if (!room) return 'anchor'
  return insideLuiniRoom(state, side, room) ? 'depart' : 'return'
}

export function luiniDestination(state: FightState, side: FightSide) {
  const places = luiniDestinations(state, side)
  const selected = state[side].luiniExit
  if (selected) return places.find((place) => place.id === selected.destinationId)
  const room = luiniAnchor(state, side)
  return places.find((place) => place.id === room?.linkedTo) ?? places[0]
}
export function luiniDestinations(state: FightState, side: FightSide) {
  return entitiesFor(state, side, 'destination').filter((entry) => entry.visitedBy?.includes(side))
}

export function luiniRequirements(state: FightState, side: FightSide): HatsuRequirement[] {
  const action = luiniAction(state, side)
  if (action === 'anchor') return ['sealed-room', 'room-interior']
  if (action === 'return') return ['luini-anchor']
  return ['luini-anchor', 'room-interior', 'visited-destination']
}

/** L is three separate operations. Creating the anchor never transports the body. */
export function performLuiniAction(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (fighter.luiniPassage && fighter.luiniComplete) return completeLuiniPassage(state, side)
  const action = luiniAction(state, side)
  if (action === 'anchor') return createLuiniAnchor(state, side)
  const exit = action === 'return' ? luiniAnchor(state, side) : luiniDestination(state, side)
  if (!exit) return state
  return transportLuiniBody({ state, side, exit, departing: action === 'depart' })
}
function createLuiniAnchor(state: FightState, side: FightSide): FightState {
  const room = luiniRoomAtBody(state, side),
    field = state.battlefield
  if (!room || !field) return state
  return {
    ...state,
    battlefield: { ...field, luiniAnchors: { ...field.luiniAnchors, [side]: room.id } },
    [side]: { ...state[side] },
  }
}
function completeLuiniPassage(state: FightState, side: FightSide): FightState {
  const fighter = state[side],
    passage = fighter.luiniPassage!
  return {
    ...state,
    [side]: {
      ...fighter,
      x: passage.exitX,
      y: passage.floorY,
      luiniPassage: undefined,
      luiniComplete: undefined,
      velocityY: 0,
      motion: undefined,
      blocking: false,
    },
  }
}
function transportLuiniBody(options: {
  state: FightState
  side: FightSide
  exit: PreparedEntity
  departing: boolean
}): FightState {
  const { state, side, exit, departing } = options,
    fighter = state[side]
  const mode = fighter.luiniExit?.mode ?? 'full',
    partial = departing && mode !== 'full'
  const exitY = exit.y + (partial && mode === 'ceiling' ? LUINI_CEILING - 12 : 0)
  return {
    ...state,
    [side]: {
      ...fighter,
      x: exit.x,
      y: exitY,
      luiniComplete: undefined,
      luiniPassage: partial
        ? {
            mode: mode === 'ceiling' ? 'ceiling' : 'door',
            destinationId: exit.id,
            originX: fighter.x,
            originY: fighter.y,
            exitX: exit.x,
            exitY,
            floorY: exit.y,
          }
        : undefined,
      velocityY: 0,
      motion: undefined,
      blocking: false,
    },
  }
}

export function releaseLuiniAnchor(state: FightState, side: FightSide): FightState {
  const field = state.battlefield
  if (!field?.luiniAnchors?.[side]) return state
  return {
    ...state,
    [side]: {
      ...state[side],
      x: state[side].luiniPassage?.originX ?? state[side].x,
      y: state[side].luiniPassage?.originY ?? state[side].y,
      luiniPassage: undefined,
      luiniComplete: undefined,
    },
    battlefield: { ...field, luiniAnchors: { ...field.luiniAnchors, [side]: undefined } },
  }
}

/** Also catches an external scenario opening/removing a room, without mutating forecasts. */
export function advanceLuiniAnchors(state: FightState): FightState {
  const field = state.battlefield
  if (!field) return state
  const entities = field.entities.map((entry) =>
    entry.kind === 'room' && entry.sealed === false && !entry.invalidated
      ? { ...entry, invalidated: true }
      : entry,
  )
  let next: FightState = { ...state, battlefield: { ...field, entities } }
  for (const side of ['player', 'opponent'] as const) {
    if (!luiniAnchor(next, side)) next = releaseLuiniAnchor(next, side)
    next = settleLuiniPassage(next, side, Boolean(luiniAnchor(next, side)))
  }
  return next
}

export function luiniRoomBurned(state: FightState, side: FightSide): boolean {
  return Boolean(
    state.battlefield?.entities.some(
      (room) => room.kind === 'room' && room.owner === side && liveEntity(room) && room.invalidated,
    ),
  )
}
