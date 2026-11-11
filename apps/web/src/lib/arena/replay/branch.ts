import { stateAtTick } from './player'
import { ArenaRecorder } from './recorder'
import type { ArenaReplay } from './types'

export function forkReplayAtTick(replay: ArenaReplay, requestedTick: number) {
  const tick = Math.max(0, Math.min(replay.ticks, Math.floor(requestedTick)))
  const state = stateAtTick(replay, tick)
  return {
    tick,
    state,
    recorder: new ArenaRecorder({
      setup: replay.setup,
      doctrine: replay.doctrine,
      difficulty: replay.difficulty,
      tickRate: replay.tickRate,
      initialTick: tick,
      initialCommands: replay.commands.filter((command) => command.tick < tick),
    }),
  }
}
