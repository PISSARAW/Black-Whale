import { describe, it, expect } from 'vitest'
import { competitionFixture } from './testFixture'
import { FIGHTING_ROSTER } from '$lib/fighting/roster'
import { decodePvpView } from '$lib/fighting/pvp/clientView'
import { ClashCompetition } from './service'
import { ClashPvpRegistry } from '../clashPvp'
import type { OnlineSnapshot } from '$lib/fighting/online/types'

describe('competitive queues use actual authoritative duels', () => {
  it('matches two different identities, restores only the owner’s seat and protects the shared preset', () => {
    const f = competitionFixture()
    f.enqueue(0)
    const b = f.enqueue(1),
      a = f.service.view(f.profiles[0])
    expect(a.series?.id).toBe(b.series?.id)
    expect(a.session?.side).toBe('player')
    expect(b.session?.side).toBe('opponent')
    expect(a.session?.token).not.toBe(b.session?.token)
    const view = f.registry.peek(a.session!.matchId, a.session!.token)
    expect(view.setup).toMatchObject({
      player: 'theta',
      opponent: 'hisoka',
      formatId: 'knockout',
      environment: { stageId: 'heavens-arena', arenaInteractions: false },
    })
    expect(JSON.stringify(f.service.view(f.profiles[2]))).not.toContain(a.session!.token)
    expect(() => f.enqueue(0)).toThrow('BUSY')
    expect(() => f.service.profile('stolen')).toThrow('UNAUTHORIZED')
  })
  it('requires two complete engine matches, records history and rates a ranked series only once', () => {
    const f = competitionFixture()
    f.enqueue(0)
    f.enqueue(1)
    const first = f.winGame()
    expect(first.status).toBe('finished')
    expect(f.service.view(f.profiles[0]).series?.score).toEqual([1, 0])
    expect(f.seasons.leaderboard().entries).toEqual([])
    f.service.continue(f.profiles[0])
    f.winGame()
    f.service.view(f.profiles[0])
    const final = f.service.view(f.profiles[0])
    expect(final.series).toMatchObject({
      status: 'complete',
      score: [2, 0],
      winner: f.profiles[0].id,
      counted: true,
    })
    expect(final.statistics).toEqual([
      { fighter: 'theta', games: 2, wins: 2, losses: 0, forfeits: 0 },
    ])
    expect(f.seasons.leaderboard().entries.map((x) => x.rating)).toEqual([1212, 1188])
    for (let i = 0; i < 4; i++) f.service.view(f.profiles[1])
    expect(f.seasons.leaderboard().entries.map((x) => x.matches)).toEqual([1, 1])
    expect(final.history).toHaveLength(1)
  }, 30000)
  it('does not put a casual series in the ranking and labels an actual departure separately', () => {
    const f = competitionFixture()
    f.enqueue(0, { queue: 'casual' })
    f.enqueue(1, { queue: 'casual' })
    const pair = f.sessions()
    f.ready(pair)
    f.advance(100)
    f.registry.view(pair[0].matchId, pair[0].token)
    const before = decodePvpView(f.registry.peek(pair[0].matchId, pair[0].token))
    f.service.withdraw(f.profiles[1])
    const after = decodePvpView(f.registry.peek(pair[0].matchId, pair[0].token))
    const result = f.service.view(f.profiles[0])
    expect(result.series).toMatchObject({
      status: 'complete',
      score: [0, 0],
      winner: f.profiles[0].id,
    })
    expect(result.series?.games[0].reason).toBe('forfeit')
    expect(after.player.health).toBe(before.player.health)
    expect(after.matchWinner).toBeNull()
    expect(f.seasons.leaderboard().entries).toEqual([])
    expect(f.service.view(f.profiles[1]).statistics[0]).toMatchObject({ games: 0, forfeits: 1 })
  })
  it('does not award an unstarted queue match or a simultaneous absence', () => {
    const f = competitionFixture()
    f.enqueue(0)
    f.enqueue(1)
    f.service.withdraw(f.profiles[1])
    expect(f.service.view(f.profiles[0]).series?.status).toBe('withdrawn')
    f.enqueue(0)
    f.enqueue(1)
    const pair = f.sessions()
    f.ready(pair)
    f.advance(31000)
    f.registry.peek(pair[0].matchId, pair[0].token)
    expect(f.service.view(f.profiles[0]).series?.winner).toBeNull()
    expect(f.seasons.leaderboard().entries).toEqual([])
  })
  it('records a one-sided timeout only after the existing grace interval', () => {
    const f = competitionFixture()
    f.enqueue(0)
    f.enqueue(1)
    const pair = f.sessions()
    f.ready(pair)
    f.advance(100)
    f.registry.view(pair[0].matchId, pair[0].token)
    for (let i = 0; i < 31; i++) {
      f.advance(1000)
      f.registry.view(pair[0].matchId, pair[0].token)
    }
    expect(f.service.view(f.profiles[0]).series?.games[0]).toMatchObject({
      reason: 'forfeit',
      winner: f.profiles[0].id,
    })
    expect(f.seasons.leaderboard().entries[0].wins).toBe(1)
  })
  it('leaves reports private, bound to participants and independent of wins', () => {
    const f = competitionFixture()
    f.enqueue(0)
    f.enqueue(1)
    const id = f.service.view(f.profiles[0]).series!.id
    expect(() => f.service.report(f.profiles[2], { series: id, reason: 'conduct' })).toThrow(
      'UNAUTHORIZED',
    )
    expect(f.service.report(f.profiles[0], { series: id, reason: 'conduct' })).toEqual({
      reported: true,
    })
    expect(() => f.service.report(f.profiles[0], { series: id, reason: 'connection' })).toThrow(
      'ALREADY_REPORTED',
    )
    expect(f.service.view(f.profiles[1])).not.toHaveProperty('reports')
    expect(f.service.view(f.profiles[0]).series?.winner).toBeNull()
  })
  it.each(FIGHTING_ROSTER)(
    '$name keeps an ordinary engine body and finite Nen resources',
    ({ id }) => {
      const f = competitionFixture()
      f.enqueue(0, { fighter: id })
      f.enqueue(1)
      const a = f.service.view(f.profiles[0]).session!
      const state = decodePvpView(f.registry.peek(a.matchId, a.token))
      expect(state.player.id).toBe(id)
      expect(state.training).toBeUndefined()
      expect(state.teamMatch).toBeUndefined()
      expect(state.player.aura).toBeLessThanOrEqual(100)
      expect(state.player.hatsuEffects.cyclotronTurns).toBe(0)
      expect(state.matchWinner).toBeNull()
    },
  )
  it('retains verified scores and history across a restart while voiding the interrupted game', () => {
    let saved: OnlineSnapshot | undefined
    const storage = {
      load: () => saved,
      save: (data: OnlineSnapshot) => {
        saved = structuredClone(data)
      },
    }
    const f = competitionFixture({ storage })
    f.enqueue(0)
    f.enqueue(1)
    f.winGame()
    f.service.continue(f.profiles[0])
    const registry = new ClashPvpRegistry(f.clock, f.random, f.seasons)
    const restarted = new ClashCompetition({
      registry,
      seasons: f.seasons,
      now: f.clock,
      random: f.random,
      storage,
    })
    const view = restarted.view(restarted.profile(f.credentials[0].token))
    expect(view.series).toMatchObject({ score: [1, 0], current: null, status: 'active' })
    expect(view.series?.games.at(-1)?.reason).toBe('restart')
    const next = restarted.continue(f.profiles[0])
    expect(next.session).not.toBeNull()
    expect(next.series?.score).toEqual([1, 0])
    expect(JSON.stringify(saved)).not.toContain(next.session!.token)
  }, 30000)
  it('expires an unstarted queue match without inventing a winner', () => {
    const f = competitionFixture()
    f.enqueue(0)
    f.enqueue(1)
    f.advance(120001)
    const view = f.service.view(f.profiles[0])
    expect(view.series?.status).toBe('withdrawn')
    expect(view.series?.winner).toBeNull()
    expect(f.seasons.leaderboard().entries).toEqual([])
    expect(f.enqueue(0).ticket).not.toBeNull()
  })
  it('recovers a swept lobby as an interrupted attempt without losing the series', () => {
    const f = competitionFixture()
    f.enqueue(0)
    f.enqueue(1)
    f.advance(1800001)
    const view = f.service.view(f.profiles[0])
    expect(view.series?.status).toBe('active')
    expect(view.series?.current).toBeNull()
    expect(view.series?.games[0].reason).toBe('restart')
    expect(f.service.continue(f.profiles[0]).session).not.toBeNull()
  })
})
