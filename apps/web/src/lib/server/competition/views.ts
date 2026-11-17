import type { OnlineSnapshot, OnlinePlayer } from '$lib/fighting/online/types'
import type { RankedProfile } from '../clashSeasons'

export function competitionHistory(data: OnlineSnapshot, profile: RankedProfile) {
  return structuredClone(
    data.series
      .filter((s) => s.players.some((p) => p.id === profile.id))
      .slice(-100)
      .reverse(),
  )
}
export function competitionStatistics(data: OnlineSnapshot, profile: RankedProfile) {
  const stats = new Map<
    string,
    {
      fighter: OnlinePlayer['fighter']
      games: number
      wins: number
      losses: number
      forfeits: number
    }
  >()
  for (const series of data.series) {
    const player = series.players.find((p) => p.id === profile.id)
    if (!player) continue
    const row = stats.get(player.fighter) ?? {
      fighter: player.fighter,
      games: 0,
      wins: 0,
      losses: 0,
      forfeits: 0,
    }
    for (const game of series.games) {
      if (game.reason === 'combat') {
        row.games++
        row.wins += Number(game.winner === player.id)
        row.losses += Number(game.winner !== player.id)
      }
      if (game.reason === 'forfeit' && game.winner !== player.id) row.forfeits++
    }
    stats.set(player.fighter, row)
  }
  return [...stats.values()]
}
export function publicTournament(data: OnlineSnapshot, id: string) {
  const tournament = data.tournaments.find((t) => t.id === id)
  if (!tournament) return null
  const { joinHash: _secret, ...view } = tournament
  const results = data.series
    .filter((s) => s.tournament?.id === id)
    .map(({ id, tournament, score, status, winner, games }) => ({
      id,
      tournament,
      score,
      status,
      winner,
      games,
    }))
  return structuredClone({ ...view, results })
}
