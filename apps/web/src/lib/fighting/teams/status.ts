import type { FightSide, FightState } from '../types'
export function teamMemberForView(state: FightState, side: FightSide, index: number) {
  const seat = state.teamMatch!.seats[side]
  return index === seat.active && state.phase !== 'finished' ? state[side] : seat.members[index]
}
/** A pending post-mortem sequence has not yet awarded or eliminated the active stock. */
export function teamLivingForView(state: FightState, side: FightSide): number {
  const seat = state.teamMatch!.seats[side]
  return seat.members.filter(
    (_member, index) =>
      teamMemberForView(state, side, index).health > 0 ||
      (index === seat.active && Boolean(state.catsName)),
  ).length
}
