import type { ArcadeFighter, FightSide, FighterId } from './types'

export interface TeamSeat {
  roster: FighterId[]
  members: ArcadeFighter[]
  active: number
  assistUsed: boolean
  relay: { leader: number; phase: 'approach' | 'strike' | 'retreat'; frames: number } | null
}
export interface TeamMatch {
  seats: Record<FightSide, TeamSeat>
  winner: FightSide | 'draw' | null
}
declare module './types' {
  interface FightState {
    teamMatch?: TeamMatch
  }
}
export const teamLiving = (seat: TeamSeat) =>
  seat.members.filter((member) => member.health > 0).length
