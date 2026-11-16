import { cleanCareerName } from '$lib/fighting/career/storage'
import type { FightSide } from '$lib/fighting/types'

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
  private profiles = new Map<string, RankedCredential>()
  private seasons = new Map<string, Season>()
  constructor(
    private now = Date.now,
    private random: () => string = () => crypto.randomUUID(),
  ) {}
  register(name: string): RankedCredential {
    if (this.profiles.size >= 5000) throw Error('PROFILE_CAPACITY')
    const credential = { id: this.random(), token: this.random(), name: cleanCareerName(name) }
    this.profiles.set(credential.token, credential)
    return { ...credential }
  }
  identify(token: string): RankedProfile | null {
    const profile = this.profiles.get(token)
    return profile ? { id: profile.id, name: profile.name } : null
  }
  record(result: {
    id: string
    player?: RankedProfile
    opponent?: RankedProfile
    winner: FightSide
  }) {
    const { player, opponent } = result
    if (!player || !opponent || player.id === opponent.id) return
    const season = this.season()
    if (season.results.has(result.id) || season.results.size >= 50_000) return
    season.results.add(result.id)
    const one = season.entries.get(player.id) ?? this.entry(player)
    const two = season.entries.get(opponent.id) ?? this.entry(opponent)
    const expected = 1 / (1 + 10 ** ((two.rating - one.rating) / 400))
    const delta = Math.round(24 * (Number(result.winner === 'player') - expected))
    season.entries.set(one.id, this.updated(one, delta, result.winner === 'player'))
    season.entries.set(two.id, this.updated(two, -delta, result.winner === 'opponent'))
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
  private season() {
    const id = new Date(this.now()).toISOString().slice(0, 7)
    let season = this.seasons.get(id)
    if (!season) {
      season = { id, entries: new Map(), results: new Set() }
      this.seasons.set(id, season)
      while (this.seasons.size > 12) this.seasons.delete(this.seasons.keys().next().value!)
    }
    return season
  }
}
const shared = globalThis as typeof globalThis & { __clashSeasons?: ClashSeasons }
export const clashSeasons = shared.__clashSeasons ?? (shared.__clashSeasons = new ClashSeasons())
