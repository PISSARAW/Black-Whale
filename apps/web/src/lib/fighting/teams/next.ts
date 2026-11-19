import type { TeamSeat } from '../teamTypes'
import { teamMemberAlive } from '../teamTypes'
export function nextTeamIndex(seat: TeamSeat): number {
  const leader = seat.relay?.leader ?? seat.active
  return teamMemberAlive(seat.members[leader]) ? leader : seat.members.findIndex(teamMemberAlive)
}
