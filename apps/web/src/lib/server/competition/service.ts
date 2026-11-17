import { createFightEnvironment } from '$lib/fighting/fightEnvironment'
import { PVP_RULESET, type PvpSession } from '$lib/fighting/pvp/types'
import type {
  OnlinePlayer,
  OnlinePreferences,
  OnlineSeries,
  OnlineView,
} from '$lib/fighting/online/types'
import { ClashPvpError, type ClashPvpRegistry } from '../clashPvp'
import type { ClashSeasons, RankedProfile } from '../clashSeasons'
import type { CompetitionStorage } from './file'
import { CompetitionStore } from './store'
import { CompetitionQueue } from './queue'
import { requireCompetition } from './error'
import { settleTerminal, flushCompetitionRanking, recoverCompetition } from './settlement'
import {
  addTournament,
  joinTournament,
  startTournament,
  cancelTournament,
  scheduled,
} from './tournamentActions'
import { currentBout, verifyBrackets } from './tournaments'
import { competitionHistory, competitionStatistics, publicTournament } from './views'
import { trimVoidAttempts } from './retention'

export interface CompetitionOptions {
  registry: ClashPvpRegistry
  seasons: ClashSeasons
  now?: () => number
  random?: () => string
  storage?: CompetitionStorage
}
export class ClashCompetition {
  readonly store: CompetitionStore
  private queue: CompetitionQueue
  private sessions = new Map<string, [PvpSession, PvpSession]>()
  private now: () => number
  private random: () => string
  constructor(private options: CompetitionOptions) {
    this.now = options.now ?? Date.now
    this.random = options.random ?? (() => crypto.randomUUID())
    this.store = new CompetitionStore(options.storage)
    this.queue = new CompetitionQueue(this.now, this.random)
    try {
      verifyBrackets(this.store.data)
      recoverCompetition(this.store, this.now())
    } catch {
      this.store.available = false
    }
    options.registry.observeTerminals((event) => {
      settleTerminal(this.store, event, this.now())
      if (!this.store.data.series.some((s) => s.current === event.id))
        this.sessions.delete(event.id)
    })
  }
  profile(token: string) {
    const profile = this.options.seasons.identify(token)
    requireCompetition(profile, 'UNAUTHORIZED')
    requireCompetition(this.store.available, 'COMPETITION_STORAGE')
    return profile
  }
  probe(profile: RankedProfile) {
    return this.queue.probe(profile)
  }
  enqueue(profile: RankedProfile, options: OnlinePreferences & { nonce: string }) {
    this.queue.sweep()
    requireCompetition(!this.active(profile.id) && !scheduled(this.store.data, profile.id), 'BUSY')
    requireCompetition(!this.queue.tickets.has(profile.id), 'BUSY')
    requireCompetition(this.queue.tickets.size < 200, 'CAPACITY')
    const rtt = this.queue.measure(profile, options.nonce)
    requireCompetition(rtt <= options.maxRtt, 'CONNECTION')
    const ticket = {
      ...options,
      profile: { ...profile },
      rtt,
      measuredAt: this.now(),
      joinedAt: this.now(),
      seenAt: this.now(),
      rating: this.options.seasons.rating(profile.id),
    }
    this.queue.tickets.set(profile.id, ticket)
    try {
      this.pair(profile.id)
    } catch (error) {
      this.queue.tickets.delete(profile.id)
      throw error
    }
    return this.view(profile)
  }
  refreshProbe(profile: RankedProfile, nonce: string) {
    const rtt = this.queue.measure(profile, nonce),
      ticket = this.queue.tickets.get(profile.id)
    requireCompetition(ticket, 'NOT_FOUND')
    requireCompetition(rtt <= ticket.maxRtt, 'CONNECTION')
    ticket.rtt = rtt
    ticket.measuredAt = this.now()
    ticket.seenAt = this.now()
    this.pair(profile.id)
  }
  cancel(profile: RankedProfile) {
    this.queue.tickets.delete(profile.id)
  }
  view(profile: RankedProfile): OnlineView {
    this.queue.sweep()
    const ticket = this.queue.tickets.get(profile.id)
    if (ticket) {
      ticket.seenAt = this.now()
      this.pair(profile.id)
    }
    let series = this.active(profile.id)
    if (series?.current) this.poll(series.current)
    series = this.active(profile.id)
    flushCompetitionRanking(this.store, this.options.seasons)
    const visible = this.active(profile.id) ?? this.latest(profile.id)
    return {
      profile: { ...profile },
      ticket:
        ticket && !series
          ? {
              queue: ticket.queue,
              rtt: ticket.rtt,
              maxRtt: ticket.maxRtt,
              joinedAt: ticket.joinedAt,
            }
          : null,
      series: visible ? structuredClone(visible) : null,
      session: this.ownSession(profile.id, visible?.current),
      history: competitionHistory(this.store.data, profile),
      statistics: competitionStatistics(this.store.data, profile),
      tournaments: this.store.data.tournaments
        .filter((t) => t.players.some((p) => p.id === profile.id))
        .map((t) => publicTournament(this.store.data, t.id)!),
    }
  }
  continue(profile: RankedProfile) {
    const series = this.active(profile.id)
    requireCompetition(series, 'NOT_FOUND')
    if (series.current) this.poll(series.current)
    const current = this.active(profile.id)
    requireCompetition(current, 'NOT_READY')
    if (!current.current) this.openGame(current)
    return this.view(profile)
  }
  withdraw(profile: RankedProfile) {
    const series = this.active(profile.id)
    requireCompetition(series, 'NOT_FOUND')
    if (!series.current) this.openGame(series)
    const current = this.active(profile.id)!
    const session = this.ownSession(profile.id, current.current)
    requireCompetition(session, 'NOT_READY')
    this.options.registry.leave(session.matchId, session.token)
    return this.view(profile)
  }
  report(
    profile: RankedProfile,
    options: { series: string; reason: 'conduct' | 'connection' | 'suspected-cheating' },
  ) {
    this.store.transact((data) => {
      const series = data.series.find((s) => s.id === options.series)
      requireCompetition(series && series.players.some((p) => p.id === profile.id), 'UNAUTHORIZED')
      requireCompetition(
        !data.reports.some((r) => r.series === series.id && r.reporter === profile.id),
        'ALREADY_REPORTED',
      )
      requireCompetition(data.reports.length < 5000, 'CAPACITY')
      requireCompetition(
        data.reports.filter((r) => r.reporter === profile.id && this.now() - r.at < 3600000)
          .length < 10,
        'RATE_LIMITED',
      )
      data.reports.push({
        series: series.id,
        reporter: profile.id,
        subject: series.players.find((p) => p.id !== profile.id)!.id,
        reason: options.reason,
        at: this.now(),
      })
    })
    return { reported: true }
  }
  createTournament(
    profile: RankedProfile,
    options: { name: string; fighter: OnlinePlayer['fighter'] },
  ) {
    this.available(profile.id)
    return this.store.transact((data) =>
      addTournament(data, {
        id: this.random(),
        secret: this.random(),
        profile: { ...profile, fighter: options.fighter },
        name: options.name,
        now: this.now(),
      }),
    )
  }
  joinTournament(
    profile: RankedProfile,
    options: { id: string; secret: string; fighter: OnlinePlayer['fighter'] },
  ) {
    this.available(profile.id)
    this.store.transact((data) =>
      joinTournament(data, {
        id: options.id,
        secret: options.secret,
        profile: { ...profile, fighter: options.fighter },
      }),
    )
  }
  startTournament(profile: RankedProfile, id: string) {
    this.store.transact((data) => startTournament(data, profile, id))
  }
  cancelTournament(profile: RankedProfile, id: string) {
    this.store.transact((data) => cancelTournament(data, profile, id))
  }
  tournament(id: string) {
    return publicTournament(this.store.data, id)
  }
  playTournament(profile: RankedProfile, id: string) {
    const tournament = this.store.data.tournaments.find((t) => t.id === id)
    requireCompetition(
      tournament && tournament.players.some((p) => p.id === profile.id),
      'UNAUTHORIZED',
    )
    const bout = currentBout(tournament, profile.id)
    requireCompetition(bout, 'NOT_READY')
    let series = this.store.data.series.find(
      (s) => s.tournament?.id === id && s.tournament.bout === bout.id && s.status === 'active',
    )
    if (!series) {
      const players = bout.seats.map((id) => tournament.players.find((p) => p.id === id)!) as [
        OnlinePlayer,
        OnlinePlayer,
      ]
      series = this.newSeries(players, { queue: 'casual', tournament: { id, bout: bout.id } })
    }
    if (!series.current) this.openGame(series)
    return this.view(profile)
  }
  private pair(id: string) {
    const ticket = this.queue.tickets.get(id)
    if (!ticket) return
    const other = this.queue.opponent(ticket)
    if (!other) return
    const players = [
      { ...other.profile, fighter: other.fighter },
      { ...ticket.profile, fighter: ticket.fighter },
    ] as [OnlinePlayer, OnlinePlayer]
    const series = this.newSeries(players, { queue: ticket.queue })
    this.queue.tickets.delete(id)
    this.queue.tickets.delete(other.profile.id)
    this.openGame(series)
  }
  private newSeries(
    players: [OnlinePlayer, OnlinePlayer],
    options: Pick<OnlineSeries, 'queue' | 'tournament'>,
  ) {
    requireCompetition(this.store.data.series.length < 10000, 'CAPACITY')
    return this.store.transact((data) => {
      const series: OnlineSeries = {
        id: this.random(),
        players,
        queue: options.queue,
        tournament: options.tournament,
        score: [0, 0],
        games: [],
        current: null,
        status: 'active',
        winner: null,
        createdAt: this.now(),
        counted: options.queue === 'casual',
      }
      data.series.push(series)
      return series
    })
  }
  private openGame(series: OnlineSeries) {
    if (series.games.length >= 31)
      this.store.transact((data) => trimVoidAttempts(data.series.find((s) => s.id === series.id)!))
    const host = this.options.registry.create({
      player: series.players[0].fighter,
      opponent: series.players[1].fighter,
      formatId: 'knockout',
      environment: createFightEnvironment({ stageId: 'heavens-arena', arenaInteractions: false }),
    })
    try {
      const guest = this.options.registry.join(host.matchId, PVP_RULESET, {
        invitation: host.inviteHref.split('#')[1],
      })
      this.store.transact((data) => {
        data.series.find((s) => s.id === series.id)!.current = host.matchId
      })
      this.sessions.set(host.matchId, [host, guest])
    } catch (error) {
      this.options.registry.leave(host.matchId, host.token)
      throw error
    }
  }
  private poll(id: string) {
    const sessions = this.sessions.get(id)
    if (!sessions) return
    try {
      this.options.registry.expireWaiting(id, sessions[0].token)
      this.options.registry.peek(id, sessions[0].token)
    } catch (error) {
      if (!(error instanceof ClashPvpError) || error.code !== 'NOT_FOUND') throw error
      this.store.transact((data) => {
        const series = data.series.find((s) => s.current === id)
        if (!series) return
        trimVoidAttempts(series)
        series.games.push({ id, winner: null, reason: 'restart', at: this.now() })
        series.current = null
      })
      this.sessions.delete(id)
    }
  }
  private ownSession(profile: string, match?: string | null) {
    if (!match) return null
    const series = this.store.data.series.find((s) => s.current === match)
    const index = series?.players.findIndex((p) => p.id === profile) ?? -1
    return index < 0 ? null : structuredClone(this.sessions.get(match)?.[index] ?? null)
  }
  private active(id: string) {
    return this.store.data.series.find(
      (s) => s.status === 'active' && s.players.some((p) => p.id === id),
    )
  }
  private latest(id: string) {
    return [...this.store.data.series].reverse().find((s) => s.players.some((p) => p.id === id))
  }
  private available(id: string) {
    requireCompetition(
      !this.active(id) && !this.queue.tickets.has(id) && !scheduled(this.store.data, id),
      'BUSY',
    )
  }
}
