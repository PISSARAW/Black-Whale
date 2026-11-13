import type { ArenaDifficulty, OpponentDoctrine } from '../ai'
import type { CombatSetup, CombatState } from '../../combat/types'
import { stateChecksum } from './checksum'
import {
  ARENA_REPLAY_VERSION,
  DEFAULT_REPLAY_MATCH,
  type ArenaReplay,
  type ArenaReplayMatch,
  type ReplayCommand,
} from './types'

export interface ArenaRecording {
  setup: CombatSetup
  doctrine: OpponentDoctrine
  difficulty: ArenaDifficulty
  tickRate?: number
  initialTick?: number
  initialCommands?: ArenaReplay['commands']
  match?: ArenaReplayMatch
  initialState?: CombatState
}

export class ArenaRecorder {
  private tick: number
  private readonly commands: ArenaReplay['commands']

  private readonly setup: CombatSetup
  private readonly doctrine: OpponentDoctrine
  private readonly difficulty: ArenaDifficulty
  private readonly tickRate: number
  private readonly match: ArenaReplayMatch
  private readonly initialState: CombatState | undefined

  /** Everything a replay has to restate to be re-playable, in one argument. */
  constructor({
    setup,
    doctrine,
    difficulty,
    tickRate = 60,
    initialTick = 0,
    initialCommands = [],
    match = { ...DEFAULT_REPLAY_MATCH, legacyRules: true },
    initialState,
  }: ArenaRecording) {
    this.setup = setup
    this.doctrine = doctrine
    this.difficulty = difficulty
    this.tickRate = tickRate
    this.match = structuredClone(match)
    this.initialState = initialState ? structuredClone(initialState) : undefined
    this.tick = initialTick
    this.commands = structuredClone(initialCommands)
  }

  record(action: ReplayCommand) {
    const previous = this.commands.at(-1)
    if (
      previous?.tick === this.tick &&
      (action.type === 'SYNC_POSITION' || action.type === 'FACE') &&
      previous.action.type === action.type &&
      previous.action.side === action.side
    ) {
      previous.action = structuredClone(action)
      return
    }
    this.commands.push({ tick: this.tick, action: structuredClone(action) })
  }

  advance() {
    this.tick += 1
  }

  finish(state: CombatState): ArenaReplay {
    return {
      version: ARENA_REPLAY_VERSION,
      tickRate: this.tickRate,
      ticks: this.tick,
      setup: structuredClone(this.setup),
      doctrine: this.doctrine,
      difficulty: this.difficulty,
      match: structuredClone(this.match),
      ...(this.initialState ? { initialState: structuredClone(this.initialState) } : {}),
      commands: structuredClone(this.commands),
      checksum: stateChecksum(state),
    }
  }
}
