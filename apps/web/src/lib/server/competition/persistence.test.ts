import { describe, it, expect } from 'vitest'
import { mkdtempSync, readFileSync, statSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { competitionFixture } from './testFixture'
import { competitionFile } from './file'
import { readCompetitionSnapshot } from './validation'
import { ClashCompetition } from './service'
import { ClashPvpRegistry } from '../clashPvp'
import { ClashSeasons } from '../clashSeasons'
import type { OnlineSnapshot } from '$lib/fighting/online/types'
import type { SeasonSnapshot } from '../clashSeasonSnapshot'

describe('durable competitive receipts and recoverable identities', () => {
  it('does not acknowledge a terminal result until its journal write succeeds', () => {
    let saved: OnlineSnapshot | undefined,
      fail = false
    const storage = {
      load: () => saved,
      save: (s: OnlineSnapshot) => {
        if (fail) throw Error('disk')
        saved = structuredClone(s)
      },
    }
    const f = competitionFixture({ storage })
    f.enqueue(0)
    f.enqueue(1)
    const pair = f.sessions()
    f.ready(pair)
    f.advance(100)
    f.registry.view(pair[0].matchId, pair[0].token)
    fail = true
    expect(() => f.registry.leave(pair[1].matchId, pair[1].token)).toThrow('RESULT_STORAGE')
    expect(f.service.store.data.series[0].games).toEqual([])
    fail = false
    f.registry.peek(pair[0].matchId, pair[0].token)
    expect(f.service.view(f.profiles[0]).series?.games).toHaveLength(1)
    f.registry.peek(pair[0].matchId, pair[0].token)
    expect(saved!.series[0].games).toHaveLength(1)
  })
  it('retains the completion month and retries Elo after a restart without double counting', () => {
    let saved: OnlineSnapshot | undefined,
      rank: SeasonSnapshot | undefined,
      fail = false
    const storage = {
      load: () => saved,
      save: (s: OnlineSnapshot) => {
        saved = structuredClone(s)
      },
    }
    const seasonStorage = {
      load: () => rank,
      save: (s: SeasonSnapshot) => {
        if (fail) throw Error('disk')
        rank = structuredClone(s)
      },
    }
    const f = competitionFixture({ storage, seasonStorage })
    f.enqueue(0)
    f.enqueue(1)
    const pair = f.sessions()
    f.ready(pair)
    f.advance(100)
    f.registry.view(pair[0].matchId, pair[0].token)
    fail = true
    f.registry.leave(pair[1].matchId, pair[1].token)
    expect(f.service.view(f.profiles[0]).series?.counted).toBe(false)
    fail = false
    f.setTime(Date.UTC(2026, 11, 1))
    const seasons = new ClashSeasons(f.clock, f.random, seasonStorage)
    const registry = new ClashPvpRegistry(f.clock, f.random, seasons)
    const restarted = new ClashCompetition({
      registry,
      seasons,
      now: f.clock,
      random: f.random,
      storage,
    })
    const profile = restarted.profile(f.credentials[0].token)
    expect(profile.id).toBe(f.profiles[0].id)
    expect(restarted.view(profile).series?.counted).toBe(true)
    expect(seasons.leaderboard().entries).toEqual([])
    expect(rank!.seasons.find((s) => s.id === '2026-11')!.entries.map((e) => e.matches)).toEqual([
      1, 1,
    ])
    restarted.view(profile)
    expect(rank!.seasons.find((s) => s.id === '2026-11')!.results).toHaveLength(1)
  })
  it('retries the Elo receipt if Elo was written but the outbox acknowledgement failed', () => {
    let saved: OnlineSnapshot | undefined,
      writes = 0,
      failAt = Infinity
    const storage = {
      load: () => saved,
      save: (s: OnlineSnapshot) => {
        if (++writes === failAt) throw Error('disk')
        saved = structuredClone(s)
      },
    }
    const f = competitionFixture({ storage })
    f.enqueue(0)
    f.enqueue(1)
    const pair = f.sessions()
    f.ready(pair)
    f.advance(100)
    f.registry.view(pair[0].matchId, pair[0].token)
    f.registry.leave(pair[1].matchId, pair[1].token)
    failAt = writes + 1
    expect(() => f.service.view(f.profiles[0])).toThrow('COMPETITION_STORAGE')
    expect(f.seasons.leaderboard().entries[0].matches).toBe(1)
    failAt = Infinity
    expect(f.service.view(f.profiles[0]).series?.counted).toBe(true)
    expect(f.seasons.leaderboard().entries[0].matches).toBe(1)
  })
  it('stores a private atomic file, validates reloads and never replaces damaged data', () => {
    const directory = mkdtempSync(join(tmpdir(), 'clash-competition-')),
      path = join(directory, 'competition.json')
    try {
      const storage = competitionFile(path),
        f = competitionFixture({ storage })
      f.enqueue(0)
      f.enqueue(1)
      expect(statSync(path).mode & 0o777).toBe(0o600)
      const serialized = readFileSync(path, 'utf8')
      for (const credential of f.credentials) expect(serialized).not.toContain(credential.token)
      for (const session of f.sessions()) expect(serialized).not.toContain(session.token)
      expect(readCompetitionSnapshot(JSON.parse(serialized)).series).toHaveLength(1)
      writeFileSync(path, 'damaged')
      const broken = new ClashCompetition({
        registry: new ClashPvpRegistry(f.clock, f.random, f.seasons),
        seasons: f.seasons,
        storage,
      })
      expect(() => broken.profile(f.credentials[0].token)).toThrow('COMPETITION_STORAGE')
      expect(readFileSync(path, 'utf8')).toBe('damaged')
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
  it.each(['score', 'winner', 'duplicate', 'players', 'reports'] as const)(
    'rejects corrupt %s fields instead of trusting saved results',
    (kind) => {
      const f = competitionFixture()
      f.enqueue(0)
      f.enqueue(1)
      const data = structuredClone(f.service.store.data)
      if (kind === 'score') data.series[0].score = [2, 0]
      if (kind === 'winner') data.series[0].winner = 'forged'
      if (kind === 'duplicate') data.series.push(data.series[0])
      if (kind === 'players') data.series[0].players[1] = data.series[0].players[0]
      if (kind === 'reports')
        data.reports.push({
          series: 'forged',
          reporter: 'a',
          subject: 'b',
          reason: 'conduct',
          at: 1,
        })
      expect(() => readCompetitionSnapshot(data)).toThrow('COMPETITION_STORAGE')
    },
  )
})
