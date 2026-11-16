import { describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, writeFileSync, statSync, rmSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ClashSeasons } from './clashSeasons'
import { seasonFile } from './clashSeasonFile'
import { readSeasonSnapshot, type SeasonSnapshot } from './clashSeasonSnapshot'
import { ClashPvpRegistry } from './clashPvp'
import { PVP_RULESET } from '$lib/fighting/pvp/types'
import { createFightEnvironment } from '$lib/fighting/fightEnvironment'

function directory(run: (path: string) => void) {
  const path = mkdtempSync(join(tmpdir(), 'clash-seasons-'))
  try {
    run(join(path, 'seasons.json'))
  } finally {
    rmSync(path, { recursive: true, force: true })
  }
}
function registry(path: string) {
  let id = 0
  return new ClashSeasons(
    () => Date.UTC(2026, 10, 16),
    () => `identity-${++id}`,
    seasonFile(path),
  )
}
describe('durable PvP seasons', () => {
  it('restores identities, ratings and duplicate receipts after a server restart without persisting bearer tokens', () =>
    directory((path) => {
      const first = registry(path),
        a = first.register('A'),
        b = first.register('B')
      const result = { id: 'match-1', player: a, opponent: b, winner: 'player' as const }
      expect(first.record(result)).toBe(true)
      const disk = readFileSync(path, 'utf8')
      expect(disk).not.toContain(a.token)
      expect(disk).not.toContain(b.token)
      expect(statSync(path).mode & 0o777).toBe(0o600)
      const restored = new ClashSeasons(undefined, undefined, seasonFile(path))
      expect(restored.status()).toEqual({ persistence: 'disk', available: true })
      expect(restored.identify(a.token)).toEqual({ id: a.id, name: 'A' })
      expect(restored.identify('wrong')).toBeNull()
      expect(restored.leaderboard()).toEqual(first.leaderboard())
      expect(restored.record(result)).toBe(true)
      expect(restored.leaderboard().entries.map((entry) => entry.matches)).toEqual([1, 1])
      expect(readFileSync(path, 'utf8')).toBe(disk)
    }))
  it('never replaces damaged or incompatible data with a fresh empty ranking', () =>
    directory((path) => {
      for (const contents of ['{broken', '{"version":2,"profiles":[],"seasons":[]}']) {
        writeFileSync(path, contents)
        const restored = registry(path)
        expect(restored.status().available).toBe(false)
        expect(() => restored.register('A')).toThrow('RANKING_STORAGE')
        expect(
          restored.record({
            id: 'fake',
            player: { id: 'a', name: 'A' },
            opponent: { id: 'b', name: 'B' },
            winner: 'player',
          }),
        ).toBe(false)
        expect(readFileSync(path, 'utf8')).toBe(contents)
      }
    }))
  it('rolls back failed registrations and results, then retries a verdict exactly once', () => {
    let failing = false,
      saved: SeasonSnapshot | undefined,
      id = 0
    const seasons = new ClashSeasons(
      () => Date.UTC(2026, 10, 16),
      () => `id-${++id}`,
      {
        load: () => saved,
        save: (snapshot) => {
          if (failing) throw Error('disk-full')
          saved = structuredClone(snapshot)
        },
      },
    )
    const a = seasons.register('A'),
      b = seasons.register('B')
    failing = true
    expect(() => seasons.register('C')).toThrow('RANKING_STORAGE')
    const result = { id: 'result', player: a, opponent: b, winner: 'player' as const }
    expect(seasons.record(result)).toBe(false)
    expect(seasons.leaderboard().entries).toEqual([])
    expect(saved!.profiles).toHaveLength(2)
    failing = false
    expect(seasons.record(result)).toBe(true)
    expect(seasons.record(result)).toBe(true)
    expect(seasons.leaderboard().entries.map((entry) => entry.matches)).toEqual([1, 1])
    expect(seasons.status().available).toBe(true)
  })
  it('keeps the previous file and cleans a temporary file when serialization fails', () =>
    directory((path) => {
      const store = seasonFile(path),
        valid: SeasonSnapshot = { version: 1, profiles: [], seasons: [] }
      store.save(valid)
      const broken = structuredClone(valid)
      Object.assign(broken, { profiles: broken })
      expect(() => store.save(broken)).toThrow()
      expect(store.load()).toEqual(valid)
      expect(readdirSync(join(path, '..'))).toEqual(['seasons.json'])
    }))
  it('keeps month boundaries and twelve seasons after reopening the file', () =>
    directory((path) => {
      let month = 0,
        id = 0
      const now = () => Date.UTC(2026, month, 1)
      const seasons = new ClashSeasons(now, () => `id-${++id}`, seasonFile(path)),
        a = seasons.register('A'),
        b = seasons.register('B')
      for (month = 0; month < 14; month++)
        seasons.record({ id: `match-${month}`, player: a, opponent: b, winner: 'opponent' })
      month = 13
      const restored = new ClashSeasons(now, undefined, seasonFile(path))
      expect(restored.leaderboard()).toEqual(seasons.leaderboard())
      expect(seasonFile(path).load()!.seasons).toHaveLength(12)
      expect(restored.leaderboard().entries[0]).toMatchObject({ rating: 1212, matches: 1 })
    }))
  it('retries storage after a real two-round server verdict without counting an abandon or a manual result', () => {
    let now = Date.UTC(2026, 10, 16),
      id = 0,
      failing = false,
      saved: SeasonSnapshot | undefined
    const seasons = new ClashSeasons(
      () => now,
      () => `rank-${++id}`,
      {
        load: () => saved,
        save: (value) => {
          if (failing) throw Error('disk-full')
          saved = structuredClone(value)
        },
      },
    )
    const a = seasons.register('A'),
      b = seasons.register('B'),
      server = new ClashPvpRegistry(
        () => now,
        () => `room-${++id}`,
        seasons,
      )
    const host = server.create(
      {
        player: 'theta',
        opponent: 'hisoka',
        formatId: 'knockout',
        environment: createFightEnvironment(),
      },
      a,
    )
    const guest = server.join(host.matchId, PVP_RULESET, {
      invitation: host.inviteHref.split('#')[1],
      profile: b,
    })
    const view = () => server.view(host.matchId, host.token)
    const ready = () => {
      for (const token of [host.token, guest.token])
        server.ready(host.matchId, { token, ruleset: PVP_RULESET, configHash: view().configHash })
    }
    failing = true
    ready()
    for (let sequence = 0; sequence < 2000 && view().status !== 'finished'; sequence++) {
      if (view().status === 'ready') ready()
      server.submit(host.matchId, {
        token: host.token,
        packet: { sequence, input: 0, commands: [{ kind: 'move', action: 'ranged', input: 0 }] },
      })
      now += 100
      server.view(host.matchId, guest.token)
    }
    expect(view().status).toBe('finished')
    expect(view().ranking).toBe('pending')
    expect(seasons.leaderboard().entries).toEqual([])
    failing = false
    view()
    view()
    expect(view().ranking).toBe('counted')
    expect(seasons.leaderboard().entries.map((entry) => entry.matches)).toEqual([1, 1])
    const restored = new ClashSeasons(() => now, undefined, { load: () => saved, save: () => {} })
    expect(restored.leaderboard()).toEqual(seasons.leaderboard())
  }, 20000)
  it.each([
    { version: 1, profiles: [{ id: 'x', name: 'X', hash: 'raw-token' }], seasons: [] },
    { version: 1, profiles: [], seasons: [{ id: '2026-99', entries: [], results: [] }] },
    {
      version: 1,
      profiles: [],
      seasons: [
        {
          id: '2026-11',
          entries: [{ id: 'a', name: 'A', rating: Infinity, wins: 1, losses: 0, matches: 1 }],
          results: [],
        },
      ],
    },
    {
      version: 1,
      profiles: [],
      seasons: [{ id: '2026-11', entries: [], results: ['one', 'one'] }],
    },
  ])('rejects malformed persisted data %#', (value) =>
    expect(() => readSeasonSnapshot(value)).toThrow('RANKING_STORAGE'),
  )
})
