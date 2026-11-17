import type { TeamSeat } from '../teamTypes'
export function nextTeamIndex(seat: TeamSeat): number {
  const leader = seat.relay?.leader ?? seat.active
  return seat.members[leader].health > 0
    ? leader
    : seat.members.findIndex((member) => member.health > 0)
}
