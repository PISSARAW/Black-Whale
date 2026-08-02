import { combatReducer, initialCombatState } from '../../combat/reducer'
import { advanceArena } from '../ai'
import { stateChecksum } from './checksum'
import type { ArenaReplay, ReplayResult } from './types'
import type { CombatEvent } from '../../combat/types'

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

export function eventsFromReplay(replay: ArenaReplay): CombatEvent[] {
  const events: CombatEvent[] = []
  let previousAt: number | null = null
  for (let tick = 1; tick <= replay.ticks; tick += 1) {
    const event = stateAtTick(replay, tick).lastEvent
    if (event && event.at !== previousAt) {
      events.push(event)
      previousAt = event.at
    }
  }
  return events
}
