import { combatReducer, initialCombatState } from '../../combat/reducer'
import { advanceArena } from '../ai'
import { stateChecksum } from './checksum'
import type { ArenaReplay, ReplayResult } from './types'

export function playReplay(replay: ArenaReplay): ReplayResult {
  let state = initialCombatState(replay.setup)
  let commandIndex = 0
  for (let tick = 0; tick < replay.ticks && state.outcome === 'playing'; tick += 1) {
    while (replay.commands[commandIndex]?.tick === tick) {
      state = combatReducer(state, replay.commands[commandIndex].action)
      commandIndex += 1
    }
    state = advanceArena(state, 1 / replay.tickRate, replay.doctrine, replay.difficulty)
  }
  return { state, checksum: stateChecksum(state) }
}
