import { combatReducer, initialCombatState } from '../../combat/reducer'
import { advanceArena } from '../ai'
import { stateChecksum } from './checksum'
import type { ArenaReplay, ReplayResult } from './types'

export function playReplay(replay: ArenaReplay): ReplayResult {
  const state = stateAtTick(replay, replay.ticks)
  return { state, checksum: stateChecksum(state) }
}

export function stateAtTick(replay: ArenaReplay, requestedTick: number) {
  let state = initialCombatState(replay.setup)
  let commandIndex = 0
  const end = Math.max(0, Math.min(replay.ticks, Math.floor(requestedTick)))
  for (let tick = 0; tick < end && state.outcome === 'playing'; tick += 1) {
    while (replay.commands[commandIndex]?.tick === tick) {
      state = combatReducer(state, replay.commands[commandIndex].action)
      commandIndex += 1
    }
    state = advanceArena(state, 1 / replay.tickRate, replay.doctrine, replay.difficulty)
  }
  return state
}
