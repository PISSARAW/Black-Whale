import type { ArcadeFighter, FightSide, FightState } from './types'

/** Apply a physical change once to each actual body, including the members waiting at a gate. */
export function mapPhysicalBodies(
  state: FightState,
  change: (body: ArcadeFighter) => ArcadeFighter,
): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) next = mapSeat(next, side, change)
  return mapOtherBodies(next, change)
}

/** Guests and support bodies keep material lifetimes even while they wait off stage. */
function mapOtherBodies(
  state: FightState,
  change: (body: ArcadeFighter) => ArcadeFighter,
): FightState {
  const kameos = { ...state.kameos }
  let changed = false
  for (const side of ['player', 'opponent'] as const) {
    const slot = kameos[side]
    if (!slot) continue
    const fighter = change(slot.fighter)
    if (fighter === slot.fighter) continue
    kameos[side] = { ...slot, fighter }
    changed = true
  }
  const guests = state.rosterGuests?.map((guest) => {
    const fighter = change(guest.fighter)
    return fighter === guest.fighter ? guest : { ...guest, fighter }
  })
  const guestChanged = guests?.some((guest, index) => guest !== state.rosterGuests![index])
  if (!changed && !guestChanged) return state
  return {
    ...state,
    ...(changed ? { kameos } : {}),
    ...(guestChanged ? { rosterGuests: guests } : {}),
  }
}

export function somePhysicalBody(
  state: FightState,
  test: (body: ArcadeFighter) => boolean,
): boolean {
  let found = false
  mapPhysicalBodies(state, (body) => {
    found = found || test(body)
    return body
  })
  return found
}
function mapSeat(
  state: FightState,
  side: FightSide,
  change: (body: ArcadeFighter) => ArcadeFighter,
): FightState {
  const actor = change(state[side])
  const seat = state.teamMatch?.seats[side]
  if (!seat) return actor === state[side] ? state : { ...state, [side]: actor }
  const members = seat.members.map((member, index) =>
    index === seat.active ? (actor === state[side] ? member : actor) : change(member),
  )
  if (actor === state[side] && members.every((member, index) => member === seat.members[index]))
    return state
  return {
    ...state,
    [side]: actor,
    teamMatch: {
      ...state.teamMatch!,
      seats: {
        ...state.teamMatch!.seats,
        [side]: { ...seat, members },
      },
    },
  }
}
