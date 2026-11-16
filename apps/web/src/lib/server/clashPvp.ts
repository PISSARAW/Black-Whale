import { beginFight, createFight, nextRound } from '$lib/fighting/engine'
import { pvpConfigHash } from '$lib/fighting/pvp/config'
import { fightReplayHash } from '$lib/fighting/fightReplayHash'
import { AuthoritativeClashMatch } from '$lib/fighting/pvp/serverMatch'
import { pvpSnapshot } from '$lib/fighting/pvp/view'
import { PVP_GRACE_MS, PVP_HEARTBEAT_MS, PVP_RULESET } from '$lib/fighting/pvp/types'
import type {
  PvpInputPacket,
  PvpSession,
  PvpSetup,
  PvpStatus,
  PvpView,
} from '$lib/fighting/pvp/types'
import type { FightSide } from '$lib/fighting/types'
import { clashSeasons, type ClashSeasons, type RankedProfile } from './clashSeasons'
import { spectatorSnapshot } from '$lib/fighting/pvp/spectator'

interface Seat {
  token: string
  seenAt: number
}
interface Lobby {
  id: string
  setup: PvpSetup
  configHash: string
  createdAt: number
  touchedAt: number
  seats: { player: Seat; opponent: Seat | null }
  ready: Record<FightSide, boolean>
  status: PvpStatus
  disconnectedSide: FightSide | null
  lastAdvancedAt: number
  match: AuthoritativeClashMatch
  profiles: Partial<Record<FightSide, RankedProfile>>
  watchToken: string
  joinToken: string
  ranked: boolean
  revision: number
}
export class ClashPvpError extends Error {
  constructor(readonly code: string) {
    super(code)
    this.name = 'ClashPvpError'
  }
}
export class ClashPvpRegistry {
  private lobbies = new Map<string, Lobby>()
  constructor(
    private now = Date.now,
    private randomId: () => string = () => crypto.randomUUID(),
    private seasons: ClashSeasons = clashSeasons,
  ) {}
  create(setup: PvpSetup, profile?: RankedProfile): PvpSession {
    this.sweep()
    if (this.lobbies.size >= 100) throw new ClashPvpError('CAPACITY')
    const id = this.randomId(),
      token = this.randomId(),
      now = this.now()
    const state = createFight(setup.player, setup.opponent, { ...setup, mode: 'versus-local' })
    state.rng = crypto.getRandomValues(new Uint32Array(1))[0]
    this.lobbies.set(id, {
      id,
      setup: structuredClone(setup),
      configHash: pvpConfigHash(setup),
      createdAt: now,
      touchedAt: now,
      lastAdvancedAt: now,
      seats: { player: { token, seenAt: now }, opponent: null },
      ready: { player: false, opponent: false },
      status: 'waiting',
      disconnectedSide: null,
      match: new AuthoritativeClashMatch(state),
      profiles: { player: profile },
      watchToken: this.randomId(),
      joinToken: this.randomId(),
      ranked: false,
      revision: 0,
    })
    const result = session(id, 'player', token)
    result.inviteHref += `#${this.lobbies.get(id)!.joinToken}`
    result.watchHref = `/fighting/pvp/watch/${id}#${this.lobbies.get(id)!.watchToken}`
    return result
  }
  join(
    id: string,
    ruleset: string,
    options: { invitation: string; profile?: RankedProfile },
  ): PvpSession {
    if (ruleset !== PVP_RULESET) throw new ClashPvpError('VERSION')
    const lobby = this.lobby(id)
    if (lobby.seats.opponent) throw new ClashPvpError('FULL')
    if (lobby.status !== 'waiting') throw new ClashPvpError('NOT_READY')
    if (options.invitation !== lobby.joinToken) throw new ClashPvpError('INVITATION')
    const token = this.randomId()
    lobby.seats.opponent = { token, seenAt: this.now() }
    lobby.profiles.opponent = options.profile
    lobby.status = 'ready'
    return session(id, 'opponent', token)
  }
  view(id: string, token: string): PvpView {
    const { lobby, side } = this.access(id, token)
    this.advance(lobby)
    lobby.seats[side]!.seenAt = this.now()
    lobby.touchedAt = this.now()
    this.resume(lobby)
    return this.snapshotView(lobby, side)
  }
  /** Server push never refreshes a player's presence: only incoming requests do. */
  peek(id: string, token: string): PvpView {
    const { lobby, side } = this.access(id, token)
    this.advance(lobby)
    return this.snapshotView(lobby, side)
  }
  private snapshotView(lobby: Lobby, side: FightSide): PvpView {
    const state = lobby.match.snapshot()
    return {
      matchId: lobby.id,
      side,
      setup: structuredClone(lobby.setup),
      configHash: lobby.configHash,
      ruleset: PVP_RULESET,
      status: lobby.status,
      ready: { ...lobby.ready },
      connected: {
        player: this.connected(lobby, 'player'),
        opponent: this.connected(lobby, 'opponent'),
      },
      nextSequence: lobby.match.nextSequence(side),
      ...lobby.match.acknowledgement(side),
      revision: ++lobby.revision,
      tick: lobby.match.tick,
      authorityHash: fightReplayHash(state),
      ...pvpSnapshot(state, side),
      disconnectedSide: lobby.disconnectedSide,
      practice: lobby.match.summary(),
      ranking: this.rankingStatus(lobby),
      names: { player: lobby.profiles.player?.name, opponent: lobby.profiles.opponent?.name },
    }
  }
  watch(id: string, token: string) {
    const lobby = this.lobby(id)
    if (token !== lobby.watchToken) throw new ClashPvpError('UNAUTHORIZED')
    this.advance(lobby)
    return {
      status: lobby.status,
      setup: structuredClone(lobby.setup),
      tick: lobby.match.tick,
      ...spectatorSnapshot(lobby.match.snapshot()),
    }
  }
  ready(id: string, options: { token: string; ruleset: string; configHash: string }): PvpView {
    const { lobby, side } = this.access(id, options.token)
    if (options.ruleset !== PVP_RULESET || options.configHash !== lobby.configHash)
      throw new ClashPvpError('VERSION')
    this.advance(lobby)
    if (!['ready', 'waiting'].includes(lobby.status)) throw new ClashPvpError('NOT_READY')
    lobby.ready[side] = true
    lobby.seats[side]!.seenAt = this.now()
    this.beginConfirmedRound(lobby)
    return this.view(id, options.token)
  }
  submit(id: string, options: { token: string; packet: PvpInputPacket }): PvpView {
    const { lobby, side } = this.access(id, options.token)
    this.advance(lobby)
    if (lobby.status !== 'playing') throw new ClashPvpError('NOT_PLAYING')
    const result = lobby.match.submit(side, options.packet, this.now())
    if (result === 'sequence' || result === 'busy') throw new ClashPvpError(result.toUpperCase())
    return this.view(id, options.token)
  }
  leave(id: string, token: string): void {
    const { lobby, side } = this.access(id, token)
    this.advance(lobby)
    if (lobby.status === 'finished') return
    lobby.status = 'abandoned'
    lobby.disconnectedSide = side
    lobby.match.release()
  }
  private advance(lobby: Lobby) {
    const now = this.now()
    if (lobby.status === 'finished') {
      this.rank(lobby)
      return
    }
    if (lobby.status === 'abandoned') return
    this.detectDisconnect(lobby)
    if (lobby.status !== 'playing') {
      lobby.lastAdvancedAt = now
      return
    }
    const steps = Math.min(15, Math.floor(((now - lobby.lastAdvancedAt) * 60) / 1000 + 1e-6))
    for (let step = 0; step < steps; step++)
      lobby.match.advance(lobby.lastAdvancedAt + ((step + 1) * 1000) / 60)
    lobby.lastAdvancedAt += (steps * 1000) / 60
    if (now - lobby.lastAdvancedAt > 250) lobby.lastAdvancedAt = now
    const state = lobby.match.snapshot()
    if (state.phase === 'finished') {
      lobby.status = state.matchWinner ? 'finished' : 'ready'
      lobby.ready = { player: false, opponent: false }
      lobby.match.release()
      this.rank(lobby)
    }
  }
  private rank(lobby: Lobby) {
    const winner = lobby.match.snapshot().matchWinner
    if (!winner || lobby.ranked) return
    lobby.ranked = this.seasons.record({
      id: lobby.id,
      player: lobby.profiles.player,
      opponent: lobby.profiles.opponent,
      winner,
    })
  }
  private rankingStatus(lobby: Lobby): PvpView['ranking'] {
    const a = lobby.profiles.player,
      b = lobby.profiles.opponent
    if (!a || !b || a.id === b.id || lobby.status !== 'finished') return 'unranked'
    return lobby.ranked ? 'counted' : 'pending'
  }
  private detectDisconnect(lobby: Lobby) {
    if (!lobby.seats.opponent) return
    if (lobby.match.snapshot().phase === 'ready') return
    const missing = (['player', 'opponent'] as const).find((side) => !this.connected(lobby, side))
    if (!missing) return
    const elapsed = this.now() - lobby.seats[missing]!.seenAt
    lobby.status = elapsed > PVP_GRACE_MS ? 'abandoned' : 'interrupted'
    lobby.disconnectedSide = missing
    lobby.match.release()
  }
  private resume(lobby: Lobby) {
    if (lobby.status === 'ready') {
      this.beginConfirmedRound(lobby)
      return
    }
    if (
      lobby.status !== 'interrupted' ||
      !this.connected(lobby, 'player') ||
      !this.connected(lobby, 'opponent')
    )
      return
    lobby.status = lobby.ready.player && lobby.ready.opponent ? 'playing' : 'ready'
    lobby.disconnectedSide = null
    lobby.lastAdvancedAt = this.now()
    lobby.match.release()
  }
  private beginConfirmedRound(lobby: Lobby) {
    if (
      !lobby.seats.opponent ||
      !lobby.ready.player ||
      !lobby.ready.opponent ||
      !this.connected(lobby, 'player') ||
      !this.connected(lobby, 'opponent')
    )
      return
    const state = lobby.match.snapshot()
    lobby.match.replaceRound(beginFight(state.phase === 'finished' ? nextRound(state) : state))
    lobby.lastAdvancedAt = this.now()
    lobby.status = 'playing'
  }
  private connected(lobby: Lobby, side: FightSide) {
    const seat = lobby.seats[side]
    return Boolean(seat && this.now() - seat.seenAt <= PVP_HEARTBEAT_MS)
  }
  private access(id: string, token: string) {
    const lobby = this.lobby(id)
    const side = (['player', 'opponent'] as const).find(
      (candidate) => lobby.seats[candidate]?.token === token,
    )
    if (!side) throw new ClashPvpError('UNAUTHORIZED')
    return { lobby, side }
  }
  private lobby(id: string) {
    this.sweep()
    const lobby = this.lobbies.get(id)
    if (!lobby) throw new ClashPvpError('NOT_FOUND')
    return lobby
  }
  private sweep() {
    for (const [id, lobby] of this.lobbies)
      if (this.now() - lobby.touchedAt > 30 * 60_000) this.lobbies.delete(id)
  }
}
function session(matchId: string, side: FightSide, token: string): PvpSession {
  return { matchId, side, token, inviteHref: `/fighting/pvp/${matchId}` }
}
const shared = globalThis as typeof globalThis & {
  __clashPvp?: ClashPvpRegistry
  __clashPvpRules?: string
  __clashPvpSeasons?: ClashSeasons
}
if (shared.__clashPvpRules !== PVP_RULESET || shared.__clashPvpSeasons !== clashSeasons)
  shared.__clashPvp = new ClashPvpRegistry()
shared.__clashPvpRules = PVP_RULESET
shared.__clashPvpSeasons = clashSeasons
export const clashPvpRegistry = shared.__clashPvp ?? (shared.__clashPvp = new ClashPvpRegistry())
