import type { ArenaDifficulty, OpponentDoctrine } from '../ai'
import type { CombatSetup, CombatState } from '../../combat/types'
import { stateChecksum } from './checksum'
import { ARENA_REPLAY_VERSION, type ArenaReplay, type ReplayCommand } from './types'

export interface ArenaRecording {
  setup: CombatSetup
  doctrine: OpponentDoctrine
  difficulty: ArenaDifficulty
  tickRate?: number
}

export class ArenaRecorder {
  private tick = 0
  private readonly commands: ArenaReplay['commands'] = []

  private readonly setup: CombatSetup
  private readonly doctrine: OpponentDoctrine
  private readonly difficulty: ArenaDifficulty
  private readonly tickRate: number

  /** Everything a replay has to restate to be re-playable, in one argument. */
  constructor({ setup, doctrine, difficulty, tickRate = 60 }: ArenaRecording) {
    this.setup = setup
    this.doctrine = doctrine
    this.difficulty = difficulty
    this.tickRate = tickRate
  }

  record(action: ReplayCommand) {
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
      commands: structuredClone(this.commands),
      checksum: stateChecksum(state),
    }
  }
}
