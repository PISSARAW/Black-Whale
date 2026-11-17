import type { FighterId } from '../types'
import type { PvpSession } from '../pvp/types'
import type { ClashTournament } from '../career/tournament'

export type OnlineQueue = 'casual' | 'ranked'
export interface OnlinePlayer {
  id: string
  name: string
  fighter: FighterId
}
export interface OnlinePreferences {
  fighter: FighterId
  queue: OnlineQueue
  maxRtt: number
}
export interface OnlineGame {
  id: string
  winner: string | null
  reason: 'combat' | 'forfeit' | 'restart' | 'cancelled'
  at: number
}
export interface OnlineSeries {
  season?: string
  id: string
  queue: OnlineQueue
  players: [OnlinePlayer, OnlinePlayer]
  score: [number, number]
  games: OnlineGame[]
  current: string | null
  status: 'active' | 'complete' | 'withdrawn'
  winner: string | null
  createdAt: number
  counted: boolean
  tournament?: { id: string; bout: string }
}
export interface OnlineTournament {
  id: string
  owner: string
  name: string
  joinHash: string
  players: OnlinePlayer[]
  bracket: ClashTournament | null
  createdAt: number
}
export interface OnlineReport {
  series: string
  reporter: string
  subject: string
  reason: 'conduct' | 'connection' | 'suspected-cheating'
  at: number
}
export interface OnlineSnapshot {
  version: 1
  series: OnlineSeries[]
  tournaments: OnlineTournament[]
  reports: OnlineReport[]
}
export interface OnlineTicket extends OnlinePreferences {
  measuredAt: number
  joinedAt: number
  seenAt: number
  rtt: number
  rating: number
  profile: { id: string; name: string }
}
export interface OnlineView {
  profile: { id: string; name: string }
  ticket: { queue: OnlineQueue; rtt: number; maxRtt: number; joinedAt: number } | null
  series: OnlineSeries | null
  session: PvpSession | null
  history: OnlineSeries[]
  statistics: {
    fighter: FighterId
    games: number
    wins: number
    losses: number
    forfeits: number
  }[]
  tournaments: Omit<OnlineTournament, 'joinHash'>[]
}
