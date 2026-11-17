import { cleanCareerName } from '$lib/fighting/career/storage'
import type { FightSide } from '$lib/fighting/types'
import { createHash } from 'node:crypto'
import type { SeasonStorage, SeasonSnapshot } from './clashSeasonSnapshot'
import { defaultSeasonFile } from './clashSeasonFile'

export interface RankedProfile {
  id: string
  name: string
}
export interface RankedCredential extends RankedProfile {
  token: string
}
export interface SeasonEntry extends RankedProfile {
  rating: number
  wins: number
  losses: number
  matches: number
}
interface Season {
  id: string
  entries: Map<string, SeasonEntry>
  results: Set<string>
}
export class ClashSeasons {
  private profiles = new Map<string, RankedProfile>()
  private seasons = new Map<string, Season>()
  private damaged = false
  private writeIssue = false
  constructor(
    private now = Date.now,
    private random: () => string = () => crypto.randomUUID(),
    private storage?: SeasonStorage,
  ) {
    try {
      const saved = storage?.load()
      if (saved) {
        this.profiles = new Map(saved.profiles.map(({ hash, ...profile }) => [hash, profile]))
        this.seasons = new Map(
          saved.seasons.map((season) => [
            season.id,
            {
              id: season.id,
              entries: new Map(season.entries.map((entry) => [entry.id, entry])),
              results: new Set(season.results),
            },
          ]),
        )
      }
    } catch {
      this.damaged = true
    }
  }
  status() {
    return {
      persistence: this.storage ? 'disk' : 'memory',
      available: !this.damaged && !this.writeIssue,
    }
  }
  private persist() {
    if (this.damaged) throw Error('RANKING_STORAGE')
    const snapshot: SeasonSnapshot = {
      version: 1,
      profiles: [...this.profiles].map(([hash, profile]) => ({ hash, ...profile })),
      seasons: [...this.seasons.values()].map((season) => ({
        id: season.id,
        entries: [...season.entries.values()],
        results: [...season.results],
      })),
    }
    try {
      this.storage?.save(snapshot)
      this.writeIssue = false
    } catch {
      this.writeIssue = true
      throw Error('RANKING_STORAGE')
    }
  }
  register(name: string): RankedCredential {
    if (this.profiles.size >= 5000) throw Error('PROFILE_CAPACITY')
    const credential = { id: this.random(), token: this.random(), name: cleanCareerName(name) }
    const hash = tokenHash(credential.token)
    this.profiles.set(hash, { id: credential.id, name: credential.name })
    try {
      this.persist()
    } catch (error) {
      this.profiles.delete(hash)
      throw error
    }
    return { ...credential }
  }
  identify(token: string): RankedProfile | null {
    const profile = this.profiles.get(tokenHash(token))
    return profile ? { id: profile.id, name: profile.name } : null
  }
  rating(id: string): number {
    return this.season().entries.get(id)?.rating ?? 1200
  }
  record(result: {
    id: string
    player?: RankedProfile
    opponent?: RankedProfile
    winner: FightSide
    season?: string
  }) {
    const { player, opponent } = result
    if (!player || !opponent || !this.canRecord(result)) return false
    if ([...this.seasons.values()].some((season) => season.results.has(result.id))) return true
    const previous = new Map(this.seasons)
    const current = this.season(result.season)
    const season = {
      ...current,
      entries: new Map(current.entries),
      results: new Set(current.results),
    }
    if (season.results.size >= 50_000) return false
    this.seasons.set(season.id, season)
    season.results.add(result.id)
    const one = season.entries.get(player.id) ?? this.entry(player)
    const two = season.entries.get(opponent.id) ?? this.entry(opponent)
    const expected = 1 / (1 + 10 ** ((two.rating - one.rating) / 400))
    const delta = Math.round(24 * (Number(result.winner === 'player') - expected))
    season.entries.set(one.id, this.updated(one, delta, result.winner === 'player'))
    season.entries.set(two.id, this.updated(two, -delta, result.winner === 'opponent'))
    try {
      this.persist()
      return true
    } catch {
      this.seasons = previous
      return false
    }
  }
  leaderboard() {
    const season = this.season()
    return {
      season: season.id,
      entries: [...season.entries.values()]
        .sort((a, b) => b.rating - a.rating || b.wins - a.wins || a.id.localeCompare(b.id))
        .slice(0, 100)
        .map((entry) => ({ ...entry })),
    }
  }
  private entry(profile: RankedProfile): SeasonEntry {
    return { id: profile.id, name: profile.name, rating: 1200, wins: 0, losses: 0, matches: 0 }
  }
  private updated(entry: SeasonEntry, delta: number, win: boolean) {
    return {
      ...entry,
      rating: entry.rating + delta,
      matches: entry.matches + 1,
      wins: entry.wins + Number(win),
      losses: entry.losses + Number(!win),
    }
  }
  private canRecord(result: { player?: RankedProfile; opponent?: RankedProfile; season?: string }) {
    if (this.damaged || result.player?.id === result.opponent?.id) return false
    if (!result.season) return true
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(result.season)) return false
    const current = new Date(this.now()),
      target = new Date(`${result.season}-01T00:00:00Z`)
    const months =
      (current.getUTCFullYear() - target.getUTCFullYear()) * 12 +
      current.getUTCMonth() -
      target.getUTCMonth()
    return months >= 0 && months < 12
  }
  private season(requested?: string) {
    const id = requested ?? new Date(this.now()).toISOString().slice(0, 7)
    let season = this.seasons.get(id)
    if (!season) {
      season = { id, entries: new Map(), results: new Set() }
      this.seasons.set(id, season)
      while (this.seasons.size > 12) this.seasons.delete(this.seasons.keys().next().value!)
    }
    return season
  }
}
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')
const shared = globalThis as typeof globalThis & {
  __clashSeasons?: ClashSeasons
  __clashSeasonVersion?: number
}
if (shared.__clashSeasonVersion !== 2) shared.__clashSeasons = undefined
shared.__clashSeasonVersion = 2
export const clashSeasons =
  shared.__clashSeasons ??
  (shared.__clashSeasons = new ClashSeasons(Date.now, undefined, defaultSeasonFile()))
