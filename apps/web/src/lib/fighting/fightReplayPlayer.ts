import { executeReplayPacket, initialReplayState } from './fightReplayCommands'
import { fightReplayHash } from './fightReplayHash'
import type { FightReplay } from './fightReplayTypes'

/** Re-simulation, not a sequence of restored screenshots or recorded result states. */
export function createReplayPlayer(replay: FightReplay) {
  let state = initialReplayState(replay.setup)
  let cursor = 0
  let elapsed = 0
  let budget = 0
  let error = ''
  const hashes = new Map(replay.checkpoints.map((entry) => [entry.packet, entry.hash]))
  function verify() {
    const expected = hashes.get(cursor)
    if (expected && expected !== fightReplayHash(state)) error = `divergence:${cursor}`
  }
  verify()
  return {
    get state() {
      return state
    },
    get cursor() {
      return cursor
    },
    get elapsed() {
      return elapsed
    },
    get done() {
      return cursor >= replay.packets.length || Boolean(error)
    },
    get error() {
      return error
    },
    advance(dt: number, speed = 1) {
      if (!Number.isFinite(dt) || !Number.isFinite(speed) || speed <= 0) return state
      budget += Math.max(0, dt) * speed
      let steps = 0
      while (cursor < replay.packets.length && !error && steps++ < 240) {
        const packet = replay.packets[cursor]
        if (packet[0] > budget + 1e-9) break
        budget = Math.max(0, budget - packet[0])
        try {
          state = executeReplayPacket(state, packet)
        } catch {
          error = `invalid:${cursor}`
          break
        }
        elapsed += packet[0]
        cursor++
        verify()
      }
      return state
    },
  }
}
