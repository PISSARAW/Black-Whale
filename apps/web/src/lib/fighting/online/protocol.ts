import { FIGHTING_ROSTER } from '../roster'
import type { OnlinePreferences, OnlineReport } from './types'
import type { FighterId } from '../types'
export type OnlineCommand =
  | { kind: 'probe' | 'cancel' | 'continue' | 'withdraw' }
  | ({ kind: 'queue'; nonce: string } & OnlinePreferences)
  | { kind: 'refresh'; nonce: string }
  | { kind: 'report'; series: string; reason: OnlineReport['reason'] }
  | { kind: 'tournament-create'; name: string; fighter: FighterId }
  | { kind: 'tournament-join'; id: string; secret: string; fighter: FighterId }
  | { kind: 'tournament-start' | 'tournament-play' | 'tournament-cancel'; id: string }
const object = (x: unknown): x is Record<string, unknown> =>
  Boolean(x && typeof x === 'object' && !Array.isArray(x))
const text = (x: unknown): x is string => typeof x === 'string' && x.length > 0 && x.length <= 100
const fighter = (x: unknown): x is FighterId => FIGHTING_ROSTER.some((p) => p.id === x)
function keys(value: Record<string, unknown>, allowed: string[]) {
  return Object.keys(value).every((k) => ['kind', 'ruleset', ...allowed].includes(k))
}
export function readOnlineCommand(value: unknown): OnlineCommand | null {
  if (!object(value) || !text(value.kind)) return null
  if (['probe', 'cancel', 'continue', 'withdraw'].includes(value.kind))
    return keys(value, []) ? (value as OnlineCommand) : null
  if (value.kind === 'queue') return readQueue(value)
  if (value.kind === 'refresh')
    return keys(value, ['nonce']) && text(value.nonce)
      ? { kind: 'refresh', nonce: value.nonce }
      : null
  if (value.kind === 'report') return readReport(value)
  return readTournamentCommand(value)
}
function readQueue(v: Record<string, unknown>): OnlineCommand | null {
  if (!keys(v, ['nonce', 'fighter', 'queue', 'maxRtt']) || !text(v.nonce) || !fighter(v.fighter))
    return null
  if (v.queue !== 'casual' && v.queue !== 'ranked') return null
  return [100, 200, 300, 500].includes(Number(v.maxRtt)) && typeof v.maxRtt === 'number'
    ? { kind: 'queue', nonce: v.nonce, fighter: v.fighter, queue: v.queue, maxRtt: v.maxRtt }
    : null
}
function readReport(v: Record<string, unknown>): OnlineCommand | null {
  if (!keys(v, ['series', 'reason']) || !text(v.series)) return null
  if (!['conduct', 'connection', 'suspected-cheating'].includes(String(v.reason))) return null
  return { kind: 'report', series: v.series, reason: v.reason as OnlineReport['reason'] }
}
function readTournamentCommand(v: Record<string, unknown>): OnlineCommand | null {
  if (v.kind === 'tournament-create') return readTournamentCreate(v)
  if (v.kind === 'tournament-join') return readTournamentJoin(v)
  if (!['tournament-start', 'tournament-play', 'tournament-cancel'].includes(String(v.kind)))
    return null
  if (!keys(v, ['id']) || !text(v.id)) return null
  return { kind: v.kind as 'tournament-start' | 'tournament-play' | 'tournament-cancel', id: v.id }
}
function readTournamentCreate(v: Record<string, unknown>): OnlineCommand | null {
  if (!keys(v, ['name', 'fighter']) || !text(v.name) || !fighter(v.fighter)) return null
  if (!v.name.trim() || v.name.trim().length > 40) return null
  return { kind: 'tournament-create', name: v.name.trim(), fighter: v.fighter }
}
function readTournamentJoin(v: Record<string, unknown>): OnlineCommand | null {
  if (
    !keys(v, ['id', 'secret', 'fighter']) ||
    !text(v.id) ||
    !text(v.secret) ||
    !fighter(v.fighter)
  )
    return null
  return { kind: 'tournament-join', id: v.id, secret: v.secret, fighter: v.fighter }
}
