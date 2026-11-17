import { json } from '@sveltejs/kit'
import { competitionFixture } from '$lib/server/competition/testFixture'
import { competitionFile } from '$lib/server/competition/file'
import { seasonFile } from '$lib/server/clashSeasonFile'
import { ClashSeasons } from '$lib/server/clashSeasons'
import { ClashPvpRegistry } from '$lib/server/clashPvp'
import { ClashCompetition } from '$lib/server/competition/service'
import { competitionHttp } from '$lib/server/competition/http'
import { PVP_RULESET, type PvpSession } from '$lib/fighting/pvp/types'
import { join } from 'node:path'

/** Test-only coordinator; every completed game still runs ordinary server inputs/collisions. */
export function onlineBrowserServer(directory: string) {
  const storage = competitionFile(join(directory, 'competition.json')),
    seasonStorage = seasonFile(join(directory, 'seasons.json'))
  const f = competitionFixture({ storage, seasonStorage })
  let service = f.service,
    registry = f.registry,
    seasons = f.seasons
  function pair(): [PvpSession, PvpSession] {
    const series = service.store.data.series.find((s) => s.status === 'active' && s.current)
    if (!series) throw Error('No active server game')
    return series.players.map((p) => service.view(p).session!) as [PvpSession, PvpSession]
  }
  function forfeit() {
    const sessions = pair(),
      configHash = registry.view(sessions[0].matchId, sessions[0].token).configHash
    for (const session of sessions)
      registry.ready(session.matchId, { token: session.token, configHash, ruleset: PVP_RULESET })
    f.advance(100)
    registry.view(sessions[0].matchId, sessions[0].token)
    registry.leave(sessions[1].matchId, sessions[1].token)
  }
  async function handle(request: Request) {
    const path = new URL(request.url).pathname
    if (path === '/__online') return competitionHttp(request, { service, ip: 'browser-regression' })
    if (path === '/__profile') {
      const value = await request.json()
      if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 24)
        return json({ error: 'INVALID_NAME' }, { status: 400 })
      return json(seasons.register(value.name))
    }
    if (path === '/__test/game') {
      f.winGame(pair())
      return json({ finished: true })
    }
    if (path === '/__test/forfeit') {
      forfeit()
      return json({ finished: true })
    }
    if (path === '/__test/restart') {
      seasons = new ClashSeasons(f.clock, f.random, seasonStorage)
      registry = new ClashPvpRegistry(f.clock, f.random, seasons)
      service = new ClashCompetition({ registry, seasons, now: f.clock, random: f.random, storage })
      return json({ restarted: true })
    }
    if (path === '/__test/ranking') return json(seasons.leaderboard())
    return json({ error: 'NOT_FOUND' }, { status: 404 })
  }
  return { handle }
}
