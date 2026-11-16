import { describe, expect, it } from 'vitest'
import { ClashSeasons } from './clashSeasons'
import { ClashPvpRegistry } from './clashPvp'
import { PVP_RULESET } from '$lib/fighting/pvp/types'
import { createFightEnvironment } from '$lib/fighting/fightEnvironment'

function season() {
  let now = Date.UTC(2026, 10, 16),
    id = 0
  const seasons = new ClashSeasons(
    () => now,
    () => `rank-${++id}`,
  )
  const a = seasons.register('A'),
    b = seasons.register('B')
  return {
    seasons,
    a,
    b,
    now: () => now,
    advance: (ms: number) => (now += ms),
    nextMonth: () => (now = Date.UTC(2026, 11, 1)),
  }
}
describe('instance PvP seasons', () => {
  it('uses opaque credentials and exposes no token in identity or standings', () => {
    const s = season()
    expect(s.seasons.identify('wrong')).toBeNull()
    expect(s.seasons.identify(s.a.token)).toEqual({ id: s.a.id, name: 'A' })
    s.seasons.record({ id: 'one', player: s.a, opponent: s.b, winner: 'player' })
    expect(JSON.stringify(s.seasons.leaderboard())).not.toContain(s.a.token)
    expect(JSON.stringify(s.seasons.leaderboard())).not.toContain(s.b.token)
  })
  it('counts one terminal result once, applies balanced ratings, and rejects self/anonymous play', () => {
    const s = season(),
      result = { id: 'one', player: s.a, opponent: s.b, winner: 'player' } as const
    s.seasons.record(result)
    s.seasons.record(result)
    expect(s.seasons.leaderboard().entries.map((entry) => entry.rating)).toEqual([1212, 1188])
    s.seasons.record({ ...result, id: 'self', opponent: s.a })
    s.seasons.record({ ...result, id: 'anonymous', opponent: undefined })
    expect(s.seasons.leaderboard().entries.map((entry) => entry.matches)).toEqual([1, 1])
  })
  it('starts a new UTC month with fresh ratings and does not expose mutable registry entries', () => {
    const s = season()
    s.seasons.record({ id: 'one', player: s.a, opponent: s.b, winner: 'opponent' })
    const board = s.seasons.leaderboard()
    board.entries[0].rating = 9999
    expect(s.seasons.leaderboard().entries[0].rating).toBe(1212)
    s.nextMonth()
    expect(s.seasons.leaderboard()).toEqual({ season: '2026-12', entries: [] })
    s.seasons.record({ id: 'two', player: s.a, opponent: s.b, winner: 'player' })
    expect(s.seasons.leaderboard().entries[0].rating).toBe(1212)
  })
  it('updates standings only after the server resolves a complete two-round match', () => {
    const s = season()
    let id = 0
    const registry = new ClashPvpRegistry(s.now, () => `match-${++id}`, s.seasons)
    const host = registry.create(
      {
        player: 'theta',
        opponent: 'hisoka',
        formatId: 'knockout',
        environment: createFightEnvironment(),
      },
      s.seasons.identify(s.a.token)!,
    )
    const guest = registry.join(host.matchId, PVP_RULESET, {
      invitation: host.inviteHref.split('#')[1],
      profile: s.seasons.identify(s.b.token)!,
    })
    const view = () => registry.view(host.matchId, host.token)
    const ready = () => {
      for (const token of [host.token, guest.token])
        registry.ready(host.matchId, { token, ruleset: PVP_RULESET, configHash: view().configHash })
    }
    ready()
    expect(s.seasons.leaderboard().entries).toEqual([])
    for (let sequence = 0; sequence < 2000 && view().status !== 'finished'; sequence++) {
      if (view().status === 'ready') {
        expect(s.seasons.leaderboard().entries).toEqual([])
        ready()
      }
      registry.submit(host.matchId, {
        token: host.token,
        packet: { sequence, input: 0, commands: [{ kind: 'move', action: 'ranged', input: 0 }] },
      })
      s.advance(100)
      registry.view(host.matchId, guest.token)
    }
    expect(view().status).toBe('finished')
    expect(s.seasons.leaderboard().entries[0]).toMatchObject({ id: s.a.id, wins: 1, matches: 1 })
    expect(view().practice?.opponent.healthLost).toBeGreaterThan(0)
    view()
    expect(s.seasons.leaderboard().entries[0].matches).toBe(1)
  }, 20000)
  it('does not award a disconnected match', () => {
    const s = season()
    let id = 0
    const registry = new ClashPvpRegistry(s.now, () => `left-${++id}`, s.seasons)
    const host = registry.create(
      {
        player: 'theta',
        opponent: 'hisoka',
        formatId: 'knockout',
        environment: createFightEnvironment(),
      },
      s.seasons.identify(s.a.token)!,
    )
    registry.join(host.matchId, PVP_RULESET, {
      invitation: host.inviteHref.split('#')[1],
      profile: s.seasons.identify(s.b.token)!,
    })
    registry.leave(host.matchId, host.token)
    expect(s.seasons.leaderboard().entries).toEqual([])
  })
})
