import type { FightEnvironment } from './fightEnvironment'
import type { FightFormatId } from './formats'
import type { EasterEggSlot } from './easterEggCatalogue'
import type { FightSide, MoveAction, FighterId, FightMode } from './types'

export const REPLAY_VERSION = 1
export const REPLAY_RULESET = 'clash-combat-50-nen-exchanges'
export const REPLAY_FIGHTERS = ['kurapika', 'hisoka', 'chrollo', 'benjamin'] as const
export type ReplayFighter = FighterId
export interface ReplaySetup {
  player: ReplayFighter
  opponent: ReplayFighter
  formatId: FightFormatId
  mode: FightMode
  seed?: number
  initial?: string
  environment: FightEnvironment
}
export type ReplayCommand =
  | import('./fightReplayPanels').PanelReplayCommand
  | { kind: 'move'; side: FightSide; action: MoveAction | 'ranged'; input: number }
  | { kind: 'emperor'; side: FightSide }
  | { kind: 'easter'; side: FightSide; slot: EasterEggSlot }
  | { kind: 'start' | 'round' }
/** Preserve the engine's actual tick batches, including zero-step batches and accumulator timing. */
export type ReplayPacket = [dt: number, player: number, opponent: number, commands: ReplayCommand[]]
export interface ReplayCheckpoint {
  packet: number
  hash: string
}
export interface FightReplay {
  version: typeof REPLAY_VERSION
  ruleset: typeof REPLAY_RULESET
  setup: ReplaySetup
  packets: ReplayPacket[]
  checkpoints: ReplayCheckpoint[]
  duration: number
  complete: boolean
}
export interface SavedFightReplay {
  id: string
  createdAt: number
  replay: FightReplay
}
export const MAX_REPLAY_PACKETS = 300000
export const MAX_REPLAY_SECONDS = 20 * 60
export const MAX_REPLAY_BYTES = 16_000_000
