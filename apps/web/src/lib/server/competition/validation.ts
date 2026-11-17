import { FIGHTING_ROSTER } from '$lib/fighting/roster'
import type {
  OnlineSnapshot,
  OnlineSeries,
  OnlinePlayer,
  OnlineGame,
  OnlineReport,
  OnlineTournament,
} from '$lib/fighting/online/types'
import { requireCompetition } from './error'
import { verifyBrackets } from './tournaments'
const object = (x: unknown): x is Record<string, unknown> =>
  Boolean(x && typeof x === 'object' && !Array.isArray(x))
const text = (x: unknown): x is string => typeof x === 'string' && x.length > 0 && x.length <= 100
const count = (x: unknown): x is number => Number.isSafeInteger(x) && Number(x) >= 0
const unique = (x: string[]) => new Set(x).size === x.length
const fighters = new Set(FIGHTING_ROSTER.map((x) => x.id as string))
function list<T>(
  value: unknown,
  options: { limit: number; check: (x: unknown) => x is T },
): value is T[] {
  return Array.isArray(value) && value.length <= options.limit && value.every(options.check)
}
function player(x: unknown): x is OnlinePlayer {
  if (!object(x) || !text(x.id) || !text(x.name)) return false
  return typeof x.fighter === 'string' && fighters.has(x.fighter) && x.name.length <= 24
}
function game(x: unknown): x is OnlineGame {
  if (!object(x) || !text(x.id) || !count(x.at)) return false
  if (x.winner !== null && !text(x.winner)) return false
  return ['combat', 'forfeit', 'restart', 'cancelled'].includes(String(x.reason))
}
function series(x: unknown): x is OnlineSeries {
  if (!object(x) || !text(x.id) || !count(x.createdAt)) return false
  return seriesBody(x) && seriesReferences(x as unknown as OnlineSeries)
}
function seriesBody(x: Record<string, unknown>) {
  if (!list(x.players, { limit: 2, check: player }) || x.players.length !== 2) return false
  if (!list(x.games, { limit: 32, check: game })) return false
  if (!Array.isArray(x.score) || x.score.length !== 2 || !x.score.every(count)) return false
  return ['casual', 'ranked'].includes(String(x.queue)) && seriesStatus(x)
}
function seriesStatus(x: Record<string, unknown>) {
  if (x.current !== null && !text(x.current)) return false
  if (x.winner !== null && !text(x.winner)) return false
  return (
    ['active', 'complete', 'withdrawn'].includes(String(x.status)) &&
    typeof x.counted === 'boolean' &&
    tournamentRef(x.tournament)
  )
}
function tournamentRef(x: unknown) {
  return x === undefined || (object(x) && text(x.id) && text(x.bout))
}
function seriesReferences(x: OnlineSeries) {
  const ids = x.players.map((p) => p.id)
  if (!unique(ids) || !unique(x.games.map((g) => g.id))) return false
  if (x.games.some((g) => g.winner !== null && !ids.includes(g.winner))) return false
  if (x.winner !== null && !ids.includes(x.winner)) return false
  const score = ids.map(
    (id) => x.games.filter((g) => g.reason === 'combat' && g.winner === id).length,
  )
  if (JSON.stringify(score) !== JSON.stringify(x.score) || Math.max(...score) > 2) return false
  return completed(x) && validGameReasons(x) && validSeriesMonth(x)
}
function validSeriesMonth(x: OnlineSeries) {
  if (x.status !== 'complete') return x.season === undefined
  return x.season === new Date(x.games.at(-1)!.at).toISOString().slice(0, 7)
}
function completed(x: OnlineSeries) {
  if (x.status === 'active') return x.winner === null && Math.max(...x.score) < 2
  if (x.current !== null) return false
  if (x.status === 'withdrawn') return x.winner === null
  return (
    x.winner !== null &&
    (x.score[x.players.findIndex((p) => p.id === x.winner)] === 2 ||
      x.games.at(-1)?.reason === 'forfeit')
  )
}
function validGameReasons(x: OnlineSeries) {
  return x.games.every((g) =>
    ['combat', 'forfeit'].includes(g.reason) ? g.winner !== null : g.winner === null,
  )
}
function tournament(x: unknown): x is OnlineTournament {
  if (!object(x) || !tournamentIdentity(x)) return false
  if (!list(x.players, { limit: 16, check: player }) || !x.players.length) return false
  return (
    count(x.createdAt) &&
    unique(x.players.map((p) => p.id)) &&
    x.players.some((p) => p.id === x.owner) &&
    (x.bracket === null || object(x.bracket))
  )
}
function tournamentIdentity(x: Record<string, unknown>) {
  return (
    text(x.id) &&
    text(x.owner) &&
    text(x.name) &&
    typeof x.joinHash === 'string' &&
    /^[a-f0-9]{64}$/.test(x.joinHash)
  )
}
function report(x: unknown): x is OnlineReport {
  if (!object(x) || !text(x.series) || !text(x.reporter) || !text(x.subject)) return false
  return count(x.at) && ['conduct', 'connection', 'suspected-cheating'].includes(String(x.reason))
}
export function readCompetitionSnapshot(value: unknown): OnlineSnapshot {
  requireCompetition(object(value) && value.version === 1, 'COMPETITION_STORAGE')
  requireCompetition(list(value.series, { limit: 10000, check: series }), 'COMPETITION_STORAGE')
  requireCompetition(
    list(value.tournaments, { limit: 500, check: tournament }),
    'COMPETITION_STORAGE',
  )
  requireCompetition(list(value.reports, { limit: 5000, check: report }), 'COMPETITION_STORAGE')
  const result = value as unknown as OnlineSnapshot
  requireCompetition(
    unique(result.series.map((s) => s.id)) && unique(result.tournaments.map((t) => t.id)),
    'COMPETITION_STORAGE',
  )
  validateReferences(result)
  verifyBrackets(result)
  return structuredClone(result)
}
function validateReferences(value: OnlineSnapshot) {
  const games = value.series.flatMap((s) => s.games.map((g) => g.id))
  requireCompetition(unique(games), 'COMPETITION_STORAGE')
  for (const entry of value.reports) {
    const owner = value.series.find((s) => s.id === entry.series)
    requireCompetition(
      owner?.players.some((p) => p.id === entry.reporter) &&
        owner.players.some((p) => p.id === entry.subject) &&
        entry.reporter !== entry.subject,
      'COMPETITION_STORAGE',
    )
  }
}
