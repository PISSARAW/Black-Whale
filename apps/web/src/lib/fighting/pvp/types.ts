import type { FightEnvironment } from '../fightEnvironment'
import type { FightFormatId } from '../formats'
import type { FightSide, FighterId, MoveAction, FightNenZone } from '../types'
import type { BlinkyCommand, BlinkyTarget } from '../blinky'
import type { PaperCommand } from '../kallutoPaper'
import type { MaryCommand } from '../bloodyMary'
import type { LynchQuestionId } from '../lynchTypes'
import { REPLAY_RULESET } from '../fightReplayTypes'

export const PVP_RULESET = `clash-pvp-4:${REPLAY_RULESET}`
export const PVP_HEARTBEAT_MS = 3_000
export const PVP_GRACE_MS = 30_000
export interface PvpSetup {
  player: FighterId
  opponent: FighterId
  formatId: FightFormatId
  environment: FightEnvironment
}
/** A seat is supplied by its authenticated session, never by a client command. */
export type PvpCommand =
  | { kind: 'move'; action: MoveAction | 'ranged'; input: number }
  | { kind: 'emperor' | 'call' | 'offer' }
  | { kind: 'easter'; slot: 1 | 2 | 3 | 4 }
  | { kind: 'battle'; moveId: string }
  | { kind: 'talk'; words: string }
  | { kind: 'blinky-target'; target: BlinkyTarget }
  | { kind: 'blinky-command'; command: BlinkyCommand }
  | { kind: 'paper-target'; zone: FightNenZone }
  | { kind: 'paper-command' | 'paper-use'; command: PaperCommand }
  | { kind: 'mary'; command: MaryCommand }
  | { kind: 'poem'; text: string }
  | { kind: 'respond'; accept: boolean }
  | { kind: 'question'; question: LynchQuestionId }
export interface PvpInputPacket {
  sequence: number
  input: number
  commands: PvpCommand[]
}
/** Receipt only; application, Nen and combat results arrive in the private view. */
export interface PvpInputReceipt {
  matchId: string
  side: FightSide
  nextSequence: number
  round: number
}
export interface PvpSession {
  matchId: string
  token: string
  side: FightSide
  inviteHref: string
  watchHref?: string
}
export type PvpStatus = 'waiting' | 'ready' | 'playing' | 'interrupted' | 'finished' | 'abandoned'
export interface PvpView {
  matchId: string
  side: FightSide
  ruleset: string
  configHash: string
  setup: PvpSetup
  status: PvpStatus
  ready: Record<FightSide, boolean>
  connected: Record<FightSide, boolean>
  nextSequence: number
  /** Number of packets fully consumed by simulation, including refused commands. */
  appliedSequence: number
  /** Authoritative tick at which that cumulative acknowledgement advanced. */
  appliedAtTick: number
  /** Monotonic snapshot envelope revision, also across round/status transitions. */
  revision: number
  tick: number
  authorityHash: string
  snapshot: string
  snapshotHash: string
  disconnectedSide: FightSide | null
  practice?: import('../career/types').MatchPractice
  names?: Partial<Record<FightSide, string>>
  ranking?: 'counted' | 'pending' | 'unranked'
}
export interface PvpSpectatorView {
  status: PvpStatus
  setup: PvpSetup
  tick: number
  snapshot: string
  snapshotHash: string
}
export const pvpSessionKey = (id: string) => `black-whale:clash:pvp:${id}`
