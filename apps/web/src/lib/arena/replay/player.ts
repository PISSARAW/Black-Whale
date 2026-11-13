import { combatReducer } from '../../combat/reducer'
import { advanceArena } from '../ai'
import { stateChecksum } from './checksum'
import type { ArenaReplay, ReplayResult } from './types'
import type { CombatEvent } from '../../combat/types'
import { applyArenaMatchRules, countArenaAction, initialArenaMatchState } from '../match'

export function playReplay(replay: ArenaReplay): ReplayResult {
  const state = stateAtTick(replay, replay.ticks)
  return { state, checksum: stateChecksum(state) }
}

export function stateAtTick(replay: ArenaReplay, requestedTick: number) {
  let state = initialArenaMatchState(replay.setup, replay.match)
  let actions = {}
  let commandIndex = 0
  const end = Math.max(0, Math.min(replay.ticks, Math.floor(requestedTick)))
  const applyCommandsAt = (tick: number) => {
    while (replay.commands[commandIndex]?.tick === tick) {
      const action = replay.commands[commandIndex].action
      state = combatReducer(state, action)
      actions = countArenaAction(actions, action)
      state = applyArenaMatchRules(state, replay.match, actions)
      commandIndex += 1
    }
  }
  for (let tick = 0; tick < end && state.outcome === 'playing'; tick += 1) {
    applyCommandsAt(tick)
    state = advanceArena(state, 1 / replay.tickRate, {
      doctrine: replay.doctrine,
      difficulty: replay.difficulty,
    })
    state = applyArenaMatchRules(state, replay.match, actions)
  }
  // A command issued after the last advance — the blow that ends a match on
  // the player's input — is recorded at `ticks` and has no advance after it.
  if (state.outcome === 'playing') applyCommandsAt(end)
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
