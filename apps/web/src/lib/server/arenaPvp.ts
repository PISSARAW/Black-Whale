import { buildCombatTerrain } from '$lib/arena/terrain'
import {
  AuthoritativeArenaMatch,
  type ArenaCommandRejection,
  type NetworkAction,
} from '$lib/arena/pvp/serverMatch'
import type { ArenaPvpSession, ArenaPvpView } from '$lib/arena/pvp/transport'
import type { CombatSide } from '$lib/combat/types'

const TICK_RATE = 60
const MAX_FRAME_SECONDS = 0.25
const LOBBY_TTL_MS = 30 * 60_000
const MAX_LOBBIES = 1_000

interface PlayerSeat {
  id: string
  token: string
}

interface ArenaLobby {
  id: string
  createdAt: number
  touchedAt: number
  lastAdvancedAt: number
  players: { player: PlayerSeat; opponent: PlayerSeat | null }
  match: AuthoritativeArenaMatch | null
}

export type ArenaPvpRegistryErrorCode =
  'MATCH_NOT_FOUND' | 'MATCH_FULL' | 'UNAUTHORIZED' | ArenaCommandRejection

export class ArenaPvpRegistryError extends Error {
  constructor(readonly code: ArenaPvpRegistryErrorCode) {
    super(code)
  }
}

export class ArenaPvpRegistry {
  private readonly lobbies = new Map<string, ArenaLobby>()

  constructor(
    private readonly now: () => number = Date.now,
    private readonly randomId: () => string = () => crypto.randomUUID(),
  ) {}

  create(): ArenaPvpSession {
    this.sweep()
    if (this.lobbies.size >= MAX_LOBBIES) this.lobbies.delete(this.lobbies.keys().next().value!)
    const id = this.randomId()
    const player = this.playerSeat()
    const now = this.now()
    this.lobbies.set(id, {
      id,
      createdAt: now,
      touchedAt: now,
      lastAdvancedAt: now,
      players: { player, opponent: null },
      match: null,
    })
    return sessionFor(id, 'player', player.token)
  }

  join(matchId: string): ArenaPvpSession {
    const lobby = this.lobby(matchId)
    if (lobby.players.opponent) throw new ArenaPvpRegistryError('MATCH_FULL')
    const opponent = this.playerSeat()
    lobby.players.opponent = opponent
    const terrain = buildCombatTerrain()
    lobby.match = new AuthoritativeArenaMatch(
      lobby.id,
      {
        playerAt: [...terrain.spawns[0]],
        opponentAt: [...terrain.spawns[1]],
        terrain: { id: terrain.id, footprint: terrain.footprint, walls: terrain.walls },
      },
      { players: { player: lobby.players.player.id, opponent: opponent.id } },
    )
    lobby.lastAdvancedAt = this.now()
    lobby.touchedAt = lobby.lastAdvancedAt
    return sessionFor(matchId, 'opponent', opponent.token)
  }

  view(matchId: string, token: string): ArenaPvpView {
    const lobby = this.lobby(matchId)
    const side = this.sideFor(lobby, token)
    const player = lobby.players[side]
    if (!player) throw new ArenaPvpRegistryError('UNAUTHORIZED')
    this.advance(lobby)
    const snapshot = lobby.match?.snapshot() ?? null
    return {
      matchId,
      status: !snapshot ? 'waiting' : snapshot.state.outcome === 'playing' ? 'playing' : 'finished',
      side,
      nextSequence: lobby.match?.nextSequence(player.id) ?? 0,
      snapshot,
    }
  }

  submit(
    matchId: string,
    command: { token: string; sequence: number; action: NetworkAction },
  ): ArenaPvpView {
    const lobby = this.lobby(matchId)
    const side = this.sideFor(lobby, command.token)
    const player = lobby.players[side]
    if (!player || !lobby.match) throw new ArenaPvpRegistryError('UNAUTHORIZED')
    this.advance(lobby)
    const result = lobby.match.submit({
      matchId,
      playerId: player.id,
      sequence: command.sequence,
      action: command.action,
    })
    if (!result.accepted) throw new ArenaPvpRegistryError(result.reason)
    return this.view(matchId, command.token)
  }

  private advance(lobby: ArenaLobby): void {
    const now = this.now()
    lobby.touchedAt = now
    if (!lobby.match) return
    const elapsed = Math.min(MAX_FRAME_SECONDS, Math.max(0, (now - lobby.lastAdvancedAt) / 1000))
    const ticks = Math.floor(elapsed * TICK_RATE)
    for (let tick = 0; tick < ticks; tick += 1) lobby.match.advance(1 / TICK_RATE)
    if (ticks > 0) lobby.lastAdvancedAt = now
  }

  private lobby(matchId: string): ArenaLobby {
    this.sweep()
    const lobby = this.lobbies.get(matchId)
    if (!lobby) throw new ArenaPvpRegistryError('MATCH_NOT_FOUND')
    return lobby
  }

  private sideFor(lobby: ArenaLobby, token: string): CombatSide {
    if (lobby.players.player.token === token) return 'player'
    if (lobby.players.opponent?.token === token) return 'opponent'
    throw new ArenaPvpRegistryError('UNAUTHORIZED')
  }

  private playerSeat(): PlayerSeat {
    return { id: this.randomId(), token: this.randomId() }
  }

  private sweep(): void {
    const expiredBefore = this.now() - LOBBY_TTL_MS
    for (const [id, lobby] of this.lobbies) {
      if (lobby.touchedAt < expiredBefore) this.lobbies.delete(id)
    }
  }
}

function sessionFor(matchId: string, side: CombatSide, playerToken: string): ArenaPvpSession {
  return { matchId, side, playerToken, inviteHref: `/arena/pvp/${matchId}` }
}

const globalRegistry = globalThis as typeof globalThis & {
  __blackWhaleArenaPvp?: ArenaPvpRegistry
}

export const arenaPvpRegistry =
  globalRegistry.__blackWhaleArenaPvp ??
  (globalRegistry.__blackWhaleArenaPvp = new ArenaPvpRegistry())
