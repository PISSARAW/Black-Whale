import type { FightSide, FightState } from '../types'
import { teamMemberAlive } from '../teamTypes'
export function teamMemberForView(state: FightState, side: FightSide, index: number) {
  const seat = state.teamMatch!.seats[side]
  if (state.halkSoulMinds) return seat.members[index]
  return index === seat.active && state.phase !== 'finished' ? state[side] : seat.members[index]
}
export function teamMemberStatus(
  state: FightState,
  side: FightSide,
  index: number,
): readonly [string, string] {
  const member = teamMemberForView(state, side, index)
  const seat = state.teamMatch!.seats[side]
  if (index === seat.active && state.catsName) return ['Résolution en cours', 'Resolution pending']
  if (!teamMemberAlive(member)) return ['Éliminé', 'Eliminated']
  if (
    member.halkTeamMind &&
    (member.halkSoul?.mind?.key !== member.halkTeamMind || member.halkSoulSleep)
  )
    return ['Conscience en attente', 'Waiting mind']
  return index === seat.active ? ['En scène', 'On stage'] : ['En réserve', 'Reserve']
}
/** A pending post-mortem sequence has not yet awarded or eliminated the active stock. */
export function teamLivingForView(state: FightState, side: FightSide): number {
  const seat = state.teamMatch!.seats[side]
  return seat.members.filter(
    (_member, index) =>
      teamMemberAlive(teamMemberForView(state, side, index)) ||
      (index === seat.active && Boolean(state.catsName || state.gumResuscitation)),
  ).length
}
