import type { OnlineSnapshot, OnlinePlayer } from '$lib/fighting/online/types'
import type { RankedProfile } from '../clashSeasons'
import { requireCompetition } from './error'
import { onlineBracket, inviteHash } from './tournaments'

export function addTournament(
  data: OnlineSnapshot,
  options: { id: string; secret: string; profile: OnlinePlayer; name: string; now: number },
) {
  requireCompetition(data.tournaments.length < 500, 'CAPACITY')
  const tournament = {
    id: options.id,
    owner: options.profile.id,
    name: options.name,
    players: [options.profile],
    joinHash: inviteHash(options.secret),
    bracket: null,
    createdAt: options.now,
  }
  data.tournaments.push(tournament)
  return { id: tournament.id, invitation: options.secret }
}
export function joinTournament(
  data: OnlineSnapshot,
  options: { id: string; secret: string; profile: OnlinePlayer },
) {
  const tournament = data.tournaments.find((t) => t.id === options.id)
  requireCompetition(tournament && !tournament.bracket, 'TOURNAMENT')
  requireCompetition(tournament.joinHash === inviteHash(options.secret), 'UNAUTHORIZED')
  requireCompetition(tournament.players.length < 16, 'CAPACITY')
  requireCompetition(!tournament.players.some((p) => p.id === options.profile.id), 'BUSY')
  tournament.players.push(options.profile)
}
export function startTournament(data: OnlineSnapshot, profile: RankedProfile, id: string) {
  const tournament = data.tournaments.find((t) => t.id === id)
  requireCompetition(tournament?.owner === profile.id, 'UNAUTHORIZED')
  requireCompetition(!tournament.bracket && tournament.players.length >= 2, 'TOURNAMENT')
  tournament.bracket = onlineBracket(tournament.players, tournament.name)
}
export function cancelTournament(data: OnlineSnapshot, profile: RankedProfile, id: string) {
  const tournament = data.tournaments.find((t) => t.id === id)
  requireCompetition(tournament?.owner === profile.id && !tournament.bracket, 'UNAUTHORIZED')
  data.tournaments = data.tournaments.filter((t) => t.id !== id)
}
export function scheduled(data: OnlineSnapshot, profile: string) {
  return data.tournaments.some(
    (t) => !t.bracket?.champion && t.players.some((p) => p.id === profile),
  )
}
