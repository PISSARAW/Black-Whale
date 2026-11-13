import type { ArenaDifficulty, OpponentDoctrine } from '../ai'
import type { CombatAction, CombatSetup, CombatState } from '../../combat/types'
import type { ArenaFormatId } from '../formats'
import type { ArenaOpponentId } from '../experience'

export const ARENA_REPLAY_VERSION = 2

export type ReplayCommand = Exclude<CombatAction, { type: 'TICK' }>

export interface RecordedCommand {
  tick: number
  action: ReplayCommand
}

export type ArenaBossRule = 'no-visible-intent' | 'aura-tax' | 'sudden-death'

export interface ArenaReplayMatch {
  formatId: ArenaFormatId
  opponentId: ArenaOpponentId
  challengeId: string | null
  missionId: string | null
  bossRule: ArenaBossRule | null
  /** Set only while importing a V1 replay that used the raw combat rules. */
  legacyRules?: boolean
}

export const DEFAULT_REPLAY_MATCH: ArenaReplayMatch = {
  formatId: 'first-to-three',
  opponentId: 'custom',
  challengeId: null,
  missionId: null,
  bossRule: null,
}

export interface ArenaReplay {
  version: typeof ARENA_REPLAY_VERSION
  tickRate: number
  ticks: number
  setup: CombatSetup
  doctrine: OpponentDoctrine
  difficulty: ArenaDifficulty
  match: ArenaReplayMatch
  /** Non-default opening used by a cross-mode handoff. */
  initialState?: CombatState
  commands: RecordedCommand[]
  checksum: string
}

export interface ReplayResult {
  state: CombatState
  checksum: string
}
