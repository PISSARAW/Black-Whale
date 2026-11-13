import { combatReducer } from '../../combat/reducer'
import type { CombatAction, CombatSetup, CombatSide, CombatState } from '../../combat/types'
import { stateChecksum } from '../replay/checksum'
import {
  applyArenaMatchRules,
  countArenaAction,
  initialArenaMatchState,
  type ArenaActionCounts,
} from '../match'
import { DEFAULT_REPLAY_MATCH, type ArenaReplayMatch } from '../replay/types'

export type NetworkAction = Exclude<CombatAction, { type: 'TICK' } | { type: 'SYNC_POSITION' }>

export interface ArenaPlayerCommand {
  matchId: string
  playerId: string
  sequence: number
  action: NetworkAction
}

export interface ArenaServerSnapshot {
  matchId: string
  tick: number
  state: CombatState
  checksum: string
}

export type ArenaCommandRejection =
  'MATCH_MISMATCH' | 'UNKNOWN_PLAYER' | 'OUT_OF_ORDER' | 'WRONG_SIDE' | 'MATCH_FINISHED'

interface AuthoritativeArenaOptions {
  players: Record<CombatSide, string>
  match?: ArenaReplayMatch
}

export class AuthoritativeArenaMatch {
  private state: CombatState
  private tick = 0
  private readonly sequenceByPlayer = new Map<string, number>()
  private actionCounts: ArenaActionCounts = {}

  constructor(
    readonly id: string,
    setup: CombatSetup,
    private readonly options: AuthoritativeArenaOptions,
  ) {
    this.state = initialArenaMatchState(setup, options.match ?? DEFAULT_REPLAY_MATCH)
    this.sequenceByPlayer.set(options.players.player, 0)
    this.sequenceByPlayer.set(options.players.opponent, 0)
  }

  submit(
    command: ArenaPlayerCommand,
  ): { accepted: true } | { accepted: false; reason: ArenaCommandRejection } {
    if (command.matchId !== this.id) return { accepted: false, reason: 'MATCH_MISMATCH' }
    const side = this.sideFor(command.playerId)
    if (!side) return { accepted: false, reason: 'UNKNOWN_PLAYER' }
    if (this.state.outcome !== 'playing') return { accepted: false, reason: 'MATCH_FINISHED' }
    if (command.sequence !== this.sequenceByPlayer.get(command.playerId))
      return { accepted: false, reason: 'OUT_OF_ORDER' }
    if ('side' in command.action && command.action.side !== side)
      return { accepted: false, reason: 'WRONG_SIDE' }
    this.state = combatReducer(this.state, command.action)
    this.actionCounts = countArenaAction(this.actionCounts, command.action)
    this.state = applyArenaMatchRules(
      this.state,
      this.options.match ?? DEFAULT_REPLAY_MATCH,
      this.actionCounts,
    )
    this.sequenceByPlayer.set(command.playerId, command.sequence + 1)
    return { accepted: true }
  }

  advance(dt: number): ArenaServerSnapshot {
    if (this.state.outcome === 'playing') {
      this.state = combatReducer(this.state, { type: 'TICK', dt })
      this.state = applyArenaMatchRules(
        this.state,
        this.options.match ?? DEFAULT_REPLAY_MATCH,
        this.actionCounts,
      )
      this.tick += 1
    }
    return this.snapshot()
  }

  snapshot(): ArenaServerSnapshot {
    return {
      matchId: this.id,
      tick: this.tick,
      state: structuredClone(this.state),
      checksum: stateChecksum(this.state),
    }
  }

  nextSequence(playerId: string): number | null {
    return this.sequenceByPlayer.get(playerId) ?? null
  }

  private sideFor(playerId: string): CombatSide | null {
    if (this.options.players.player === playerId) return 'player'
    if (this.options.players.opponent === playerId) return 'opponent'
    return null
  }
}
