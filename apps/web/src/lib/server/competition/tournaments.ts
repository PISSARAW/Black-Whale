import { createHash } from 'node:crypto'
import {
  createTournament,
  tournamentWinner,
  type ClashTournament,
} from '$lib/fighting/career/tournament'
import type {
  OnlinePlayer,
  OnlineSnapshot,
  OnlineSeries,
  OnlineTournament,
} from '$lib/fighting/online/types'
import { requireCompetition } from './error'
export const inviteHash = (token: string) => createHash('sha256').update(token).digest('hex')
export function onlineBracket(players: OnlinePlayer[], name: string): ClashTournament {
  const bracket = createTournament(
    players.map((_, i) => `Participant ${i + 1}`),
    name,
  )
  const ids = new Map(bracket.players.map((p, i) => [p.id, players[i].id]))
  bracket.players = players.map(({ id, name }) => ({ id, name }))
  for (const bout of bracket.bouts) {
    bout.seats = bout.seats.map((id) => (id ? ids.get(id)! : null)) as typeof bout.seats
    bout.winner = bout.winner ? ids.get(bout.winner)! : null
  }
  bracket.champion = bracket.champion ? ids.get(bracket.champion)! : null
  return bracket
}
export function finishTournament(data: OnlineSnapshot, series: OnlineSeries) {
  if (!series.tournament || !series.winner) return
  const tournament = data.tournaments.find((t) => t.id === series.tournament!.id)
  requireCompetition(tournament?.bracket, 'TOURNAMENT')
  tournament.bracket = tournamentWinner(tournament.bracket, series.tournament.bout, series.winner)
}
export function currentBout(tournament: OnlineTournament, id: string) {
  return tournament.bracket?.bouts.find(
    (b) => !b.winner && b.seats[0] && b.seats[1] && b.seats.includes(id),
  )
}
/** Rebuild results from the durable series receipts instead of trusting a stored champion. */
export function verifyBrackets(data: OnlineSnapshot) {
  for (const tournament of data.tournaments) {
    if (!tournament.bracket) continue
    let rebuilt = onlineBracket(tournament.players, tournament.name)
    const series = data.series.filter(
      (s) => s.tournament?.id === tournament.id && s.status === 'complete',
    )
    for (const result of series) {
      requireCompetition(result.winner, 'COMPETITION_STORAGE')
      rebuilt = tournamentWinner(rebuilt, result.tournament!.bout, result.winner)
    }
    requireCompetition(
      JSON.stringify(rebuilt) === JSON.stringify(tournament.bracket),
      'COMPETITION_STORAGE',
    )
    tournament.bracket = rebuilt
  }
}
