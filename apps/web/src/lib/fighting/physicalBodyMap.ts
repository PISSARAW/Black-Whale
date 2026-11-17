import type { ArcadeFighter, FightSide, FightState } from './types'

/** Apply a physical change once to each actual body, including the members waiting at a gate. */
export function mapPhysicalBodies(
  state: FightState,
  change: (body: ArcadeFighter) => ArcadeFighter,
): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) next = mapSeat(next, side, change)
  return next
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
