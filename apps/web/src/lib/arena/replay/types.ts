import type { ArenaDifficulty, OpponentDoctrine } from '../ai'
import type { CombatAction, CombatSetup, CombatState } from '../../combat/types'

export const ARENA_REPLAY_VERSION = 1

export type ReplayCommand = Exclude<CombatAction, { type: 'TICK' }>

export interface RecordedCommand {
  tick: number
  action: ReplayCommand
}

export interface ArenaReplay {
  version: typeof ARENA_REPLAY_VERSION
  tickRate: number
  ticks: number
  setup: CombatSetup
  doctrine: OpponentDoctrine
  difficulty: ArenaDifficulty
  commands: RecordedCommand[]
  checksum: string
}

export interface ReplayResult {
  state: CombatState
  checksum: string
}
