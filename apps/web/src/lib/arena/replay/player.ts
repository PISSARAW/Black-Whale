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
  return reconstructReplay(replay, requestedTick)
}

export interface ArenaReplayFrame {
  tick: number
  before: ReturnType<typeof initialArenaMatchState>
  after: ReturnType<typeof initialArenaMatchState>
}

/** One deterministic pass for diagnostics; unlike repeated seeks, this stays linear in replay length. */
export function scanReplayFrames(replay: ArenaReplay, visit: (frame: ArenaReplayFrame) => void) {
  return reconstructReplay(replay, replay.ticks, visit)
}

function reconstructReplay(
  replay: ArenaReplay,
  requestedTick: number,
  visit?: (frame: ArenaReplayFrame) => void,
) {
  let state = replay.initialState
    ? structuredClone(replay.initialState)
    : initialArenaMatchState(replay.setup, replay.match)
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
    const before = state
    applyCommandsAt(tick)
    state = advanceArena(state, 1 / replay.tickRate, {
      doctrine: replay.doctrine,
      difficulty: replay.difficulty,
      fighterId: replay.match.opponentFighterId,
    })
    state = applyArenaMatchRules(state, replay.match, actions)
    visit?.({ tick: tick + 1, before, after: state })
  }
  // A command issued after the last advance — the blow that ends a match on
  // the player's input — is recorded at `ticks` and has no advance after it.
  if (state.outcome === 'playing') {
    const before = state
    applyCommandsAt(end)
    if (state !== before) visit?.({ tick: end, before, after: state })
  }
  return state
}

export function eventsFromReplay(replay: ArenaReplay): CombatEvent[] {
  const events: CombatEvent[] = []
  let previousAt: number | null = null
  scanReplayFrames(replay, ({ after }) => {
    const event = after.lastEvent
    if (event && event.at !== previousAt) {
      events.push(event)
      previousAt = event.at
    }
  })
  return events
}
