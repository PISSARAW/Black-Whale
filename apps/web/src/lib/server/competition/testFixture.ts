import { ClashSeasons } from '../clashSeasons'
import { ClashPvpRegistry } from '../clashPvp'
import { ClashCompetition } from './service'
import type { CompetitionStorage } from './file'
import type { SeasonStorage } from '../clashSeasonSnapshot'
import type { FighterId } from '$lib/fighting/types'
import { PVP_RULESET, type PvpSession } from '$lib/fighting/pvp/types'

/** Real authoritative inputs and collisions; no health edits or client-supplied verdicts. */
export function competitionFixture(
  options: { storage?: CompetitionStorage; seasonStorage?: SeasonStorage } = {},
) {
  let now = Date.UTC(2026, 10, 17),
    id = 0
  const clock = () => now,
    random = () => `fixture-${++id}`
  const seasons = new ClashSeasons(clock, random, options.seasonStorage)
  const credentials = Array.from({ length: 4 }, (_, i) => seasons.register(`Joueur ${i + 1}`))
  const registry = new ClashPvpRegistry(clock, random, seasons)
  const service = new ClashCompetition({
    registry,
    seasons,
    now: clock,
    random,
    storage: options.storage,
  })
  const profiles = credentials.map((p) => service.profile(p.token))
  function enqueue(
    index: number,
    options: {
      fighter?: FighterId
      queue?: 'casual' | 'ranked'
      maxRtt?: number
      rtt?: number
    } = {},
  ) {
    const { nonce } = service.probe(profiles[index])
    now += options.rtt ?? 25
    return service.enqueue(profiles[index], {
      nonce,
      fighter: options.fighter ?? (index === 0 ? 'theta' : 'hisoka'),
      queue: options.queue ?? 'ranked',
      maxRtt: options.maxRtt ?? 300,
    })
  }
  function ready(sessions: [PvpSession, PvpSession]) {
    const configHash = registry.view(sessions[0].matchId, sessions[0].token).configHash
    for (const session of sessions)
      registry.ready(session.matchId, { token: session.token, ruleset: PVP_RULESET, configHash })
  }
  function sessions(): [PvpSession, PvpSession] {
    return [service.view(profiles[0]).session!, service.view(profiles[1]).session!]
  }
  function winGame(pair = sessions()) {
    ready(pair)
    for (let step = 0; step < 2500; step++) {
      const view = registry.view(pair[0].matchId, pair[0].token)
      if (view.status === 'finished') return view
      if (view.status === 'ready') ready(pair)
      const sequence = registry.view(pair[0].matchId, pair[0].token).nextSequence
      registry.submit(pair[0].matchId, {
        token: pair[0].token,
        packet: { sequence, input: 0, commands: [{ kind: 'move', action: 'ranged', input: 0 }] },
      })
      now += 100
      registry.view(pair[1].matchId, pair[1].token)
    }
    throw Error('Authoritative duel did not finish')
  }
  return {
    service,
    registry,
    seasons,
    credentials,
    profiles,
    enqueue,
    ready,
    sessions,
    winGame,
    clock,
    random,
    advance: (ms: number) => {
      now += ms
    },
    setTime: (time: number) => {
      now = time
    },
  }
}
