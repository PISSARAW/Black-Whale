import type { ArenaDifficulty, OpponentDoctrine } from '../ai'
import type { CombatSetup, CombatState } from '../../combat/types'
import { stateChecksum } from './checksum'
import { ARENA_REPLAY_VERSION, type ArenaReplay, type ReplayCommand } from './types'

export class ArenaRecorder {
  private tick = 0
  private readonly commands: ArenaReplay['commands'] = []

  constructor(
    private readonly setup: CombatSetup,
    private readonly doctrine: OpponentDoctrine,
    private readonly difficulty: ArenaDifficulty,
    private readonly tickRate = 60,
  ) {}

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
