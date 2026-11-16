import { entitiesFor, liveEntity } from './preparationWorld'
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
  const room = luiniAnchor(state, side)
  if (!room) return 'anchor'
  return insideLuiniRoom(state, side, room) ? 'depart' : 'return'
}

export function luiniDestination(state: FightState, side: FightSide) {
  const places = entitiesFor(state, side, 'destination').filter((entry) =>
    entry.visitedBy?.includes(side),
  )
  const room = luiniAnchor(state, side)
  return places.find((place) => place.id === room?.linkedTo) ?? places[0]
}

export function luiniRequirements(state: FightState, side: FightSide): HatsuRequirement[] {
  const action = luiniAction(state, side)
  if (action === 'anchor') return ['sealed-room', 'room-interior']
  if (action === 'return') return ['luini-anchor']
  return ['luini-anchor', 'room-interior', 'visited-destination']
}

/** L is three separate operations. Creating the anchor never transports the body. */
export function performLuiniAction(state: FightState, side: FightSide): FightState {
  const action = luiniAction(state, side)
  if (action === 'anchor') {
    const room = luiniRoomAtBody(state, side)
    const field = state.battlefield
    if (!room || !field) return state
    return {
      ...state,
      battlefield: { ...field, luiniAnchors: { ...field.luiniAnchors, [side]: room.id } },
      [side]: { ...state[side] },
    }
  }
  const exit = action === 'return' ? luiniAnchor(state, side) : luiniDestination(state, side)
  if (!exit) return state
  return {
    ...state,
    [side]: {
      ...state[side],
      x: exit.x,
      y: exit.y,
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
  for (const side of ['player', 'opponent'] as const)
    if (!luiniAnchor(next, side)) next = releaseLuiniAnchor(next, side)
  return next
}

export function luiniRoomBurned(state: FightState, side: FightSide): boolean {
  return Boolean(
    state.battlefield?.entities.some(
      (room) => room.kind === 'room' && room.owner === side && liveEntity(room) && room.invalidated,
    ),
  )
}
