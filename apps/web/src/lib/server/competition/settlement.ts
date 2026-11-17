import type { OnlineSeries } from '$lib/fighting/online/types'
import type { ClashPvpTerminal } from '../clashPvpTerminal'
import type { ClashSeasons } from '../clashSeasons'
import type { CompetitionStore } from './store'
import { finishTournament } from './tournaments'
import { trimVoidAttempts } from './retention'

export function settleTerminal(store: CompetitionStore, event: ClashPvpTerminal, now: number) {
  if (!store.data.series.some((s) => s.current === event.id)) return
  store.transact((data) => {
    const series = data.series.find((s) => s.current === event.id)!
    if (series.status !== 'active') return
    if (event.status === 'finished') finishCombat(series, event, now)
    else finishDeparture(series, event, now)
    finishCompletedTournament(data, series, now)
  })
}
function finishCompletedTournament(
  data: Parameters<typeof finishTournament>[0],
  series: OnlineSeries,
  now: number,
) {
  if (series.status === 'complete') {
    series.season = new Date(now).toISOString().slice(0, 7)
    finishTournament(data, series)
  }
}
function finishCombat(series: OnlineSeries, event: ClashPvpTerminal, now: number) {
  if (!event.winner) return
  const index = event.winner === 'player' ? 0 : 1
  const winner = series.players[index].id
  series.games.push({ id: event.id, winner, reason: 'combat', at: now })
  series.score[index]++
  series.current = null
  if (series.score[index] === 2) {
    series.status = 'complete'
    series.winner = winner
  }
}
function finishDeparture(series: OnlineSeries, event: ClashPvpTerminal, now: number) {
  const onePresent = event.connected.player !== event.connected.opponent
  const committed = event.started || series.score.some((x) => x > 0) || Boolean(series.tournament)
  const forfeited = event.disconnected && committed && (event.voluntary || onePresent)
  const winner = forfeited ? series.players[event.disconnected === 'player' ? 1 : 0].id : null
  series.games.push({ id: event.id, winner, reason: forfeited ? 'forfeit' : 'cancelled', at: now })
  series.current = null
  series.status = winner ? 'complete' : 'withdrawn'
  series.winner = winner
}
/** Durable outbox first, idempotent Elo second. A failure can be retried after restart. */
export function flushCompetitionRanking(store: CompetitionStore, seasons: ClashSeasons) {
  for (const series of store.data.series) {
    if (series.status !== 'complete' || series.counted || !series.winner) continue
    const counted = seasons.record({
      id: `series:${series.id}`,
      player: series.players[0],
      opponent: series.players[1],
      winner: series.players[0].id === series.winner ? 'player' : 'opponent',
      season: series.season,
    })
    if (counted)
      store.transact((data) => {
        data.series.find((s) => s.id === series.id)!.counted = true
      })
  }
}
export function recoverCompetition(store: CompetitionStore, now: number) {
  if (!store.available || !store.data.series.some((s) => s.current)) return
  store.transact((data) => {
    for (const series of data.series) {
      if (!series.current) continue
      trimVoidAttempts(series)
      series.games.push({ id: series.current, winner: null, reason: 'restart', at: now })
      series.current = null
    }
  })
}
