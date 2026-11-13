import { stateAtTick } from './player'
import { ArenaRecorder } from './recorder'
import type { ArenaReplay } from './types'
import { countArenaAction, type ArenaActionCounts } from '../match'

export function forkReplayAtTick(replay: ArenaReplay, requestedTick: number) {
  const tick = Math.max(0, Math.min(replay.ticks, Math.floor(requestedTick)))
  const state = stateAtTick(replay, tick)
  const commands = replay.commands.filter((command) => command.tick < tick)
  const actions = commands.reduce<ArenaActionCounts>(
    (counts, command) => countArenaAction(counts, command.action),
    {},
  )
  return {
    tick,
    state,
    actions,
    recorder: new ArenaRecorder({
      setup: replay.setup,
      doctrine: replay.doctrine,
      difficulty: replay.difficulty,
      match: replay.match,
      initialState: replay.initialState,
      tickRate: replay.tickRate,
      initialTick: tick,
      initialCommands: commands,
    }),
  }
}
