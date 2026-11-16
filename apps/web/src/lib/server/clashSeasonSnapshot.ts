import { cleanCareerName } from '$lib/fighting/career/storage'

export interface SeasonIdentity {
  hash: string
  id: string
  name: string
}
export interface StoredSeasonEntry {
  id: string
  name: string
  rating: number
  wins: number
  losses: number
  matches: number
}
export interface SeasonSnapshot {
  version: 1
  profiles: SeasonIdentity[]
  seasons: { id: string; entries: StoredSeasonEntry[]; results: string[] }[]
}
export interface SeasonStorage {
  load(): SeasonSnapshot | undefined
  save(snapshot: SeasonSnapshot): void
}
const object = (v: unknown): v is Record<string, unknown> =>
  Boolean(v && typeof v === 'object' && !Array.isArray(v))
const text = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 100
function identity(value: unknown): value is SeasonIdentity {
  return (
    object(value) &&
    typeof value.hash === 'string' &&
    /^[a-f0-9]{64}$/.test(value.hash) &&
    text(value.id) &&
    text(value.name)
  )
}
function entry(value: unknown): value is StoredSeasonEntry {
  if (!object(value) || !text(value.id) || !text(value.name)) return false
  if (![value.rating, value.wins, value.losses, value.matches].every(Number.isSafeInteger))
    return false
  return (
    Math.abs(value.rating as number) <= 2_000_000 &&
    (value.wins as number) >= 0 &&
    (value.losses as number) >= 0 &&
    value.matches === (value.wins as number) + (value.losses as number) &&
    (value.matches as number) <= 50_000
  )
}
function season(value: unknown): value is SeasonSnapshot['seasons'][number] {
  if (!object(value) || typeof value.id !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value.id))
    return false
  if (!list(value.entries, 5000, entry)) return false
  return (
    list(value.results, 50_000, text) &&
    new Set(value.entries.map((v) => v.id)).size === value.entries.length &&
    new Set(value.results).size === value.results.length
  )
}
function list<T>(
  value: unknown,
  limit: number,
  check: (entry: unknown) => entry is T,
): value is T[] {
  return Array.isArray(value) && value.length <= limit && value.every(check)
}
export function readSeasonSnapshot(value: unknown): SeasonSnapshot {
  if (!object(value) || value.version !== 1) throw Error('RANKING_STORAGE')
  if (!list(value.profiles, 5000, identity)) throw Error('RANKING_STORAGE')
  if (!list(value.seasons, 12, season)) throw Error('RANKING_STORAGE')
  const profiles = value.profiles as SeasonIdentity[],
    seasons = value.seasons as SeasonSnapshot['seasons']
  if (
    new Set(profiles.map((p) => p.hash)).size !== profiles.length ||
    new Set(profiles.map((p) => p.id)).size !== profiles.length
  )
    throw Error('RANKING_STORAGE')
  if (new Set(seasons.map((s) => s.id)).size !== seasons.length) throw Error('RANKING_STORAGE')
  return {
    version: 1,
    profiles: profiles.map((p) => ({ ...p, name: cleanCareerName(p.name) })),
    seasons: structuredClone(seasons),
  }
}
