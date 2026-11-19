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
export const teamMemberAlive = (member: ArcadeFighter) => member.halkSoulAlive ?? member.health > 0
export const teamLiving = (seat: TeamSeat) => seat.members.filter(teamMemberAlive).length
