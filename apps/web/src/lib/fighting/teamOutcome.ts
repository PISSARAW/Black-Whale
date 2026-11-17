import { teamLiving, type TeamSeat } from './teamTypes'
import type { FightSide, FightState } from './types'

/** A lethal command can finish between ticks; record the actual bodies before the next team round. */
export function settleTeamBodyOutcome(state: FightState): FightState {
  const team = state.teamMatch
  if (!team || state.phase !== 'finished' || !state.winner) return state
  const seats = { player: settledSeat(state, 'player'), opponent: settledSeat(state, 'opponent') }
  const alive = (['player', 'opponent'] as const).filter((side) => teamLiving(seats[side]) > 0)
  const winner = alive.length === 2 ? null : (alive[0] ?? 'draw')
  return { ...state, teamMatch: { ...team, seats, winner } }
}
function settledSeat(state: FightState, side: FightSide): TeamSeat {
  const seat = state.teamMatch!.seats[side]
  const eliminated = state.winner === 'draw' || state.winner !== side
  const actor = eliminated ? { ...state[side], health: 0 } : state[side]
  return {
    ...seat,
    members: seat.members.map((member, index) => (index === seat.active ? actor : member)),
  }
}
