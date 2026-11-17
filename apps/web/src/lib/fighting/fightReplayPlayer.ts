import { executeObservedReplayPacket, initialReplayState } from './fightReplayCommands'
import { fightReplayHash } from './fightReplayHash'
import type { FightReplay } from './fightReplayTypes'
import type { FightState } from './types'

/** Re-simulation, not a sequence of restored screenshots or recorded result states. */
export function createReplayPlayer(
  replay: FightReplay,
  onFrame?: (before: FightState, after: FightState, packet: number) => void,
) {
  let state = initialReplayState(replay.setup)
  let cursor = 0
  let elapsed = 0
  let budget = 0
  let error = ''
  let target: number | null = null
  const hashes = new Map(replay.checkpoints.map((entry) => [entry.packet, entry.hash]))
  function verify() {
    const expected = hashes.get(cursor)
    if (expected && expected !== fightReplayHash(state)) error = `divergence:${cursor}`
  }
  function consume() {
    const packet = replay.packets[cursor]
    try {
      state = executeObservedReplayPacket(state, packet, {
        onFrame: onFrame ? (before, after) => onFrame(before, after, cursor) : undefined,
      })
      elapsed += packet[0]
      cursor++
      verify()
    } catch {
      error = `invalid:${cursor}`
    }
  }
  function reconstruct() {
    if (target === null) return
    let steps = 0
    while (cursor < target && !error && steps++ < 240) consume()
    if (cursor === target || error) target = null
  }
  function playBudget() {
    let steps = 0
    while (cursor < replay.packets.length && !error && steps++ < 240) {
      const packet = replay.packets[cursor]
      if (packet[0] > budget + 1e-9) break
      budget = Math.max(0, budget - packet[0])
      consume()
    }
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
      return (target === null && cursor >= replay.packets.length) || Boolean(error)
    },
    get error() {
      return error
    },
    get seeking() {
      return target !== null
    },
    seek(packet: number) {
      if (!Number.isInteger(packet) || packet < 0 || packet > replay.packets.length) return false
      budget = 0
      if (packet < cursor || error) {
        state = initialReplayState(replay.setup)
        cursor = 0
        elapsed = 0
        error = ''
        verify()
      }
      target = packet === cursor ? null : packet
      return true
    },
    advance(dt: number, speed = 1) {
      if (!Number.isFinite(dt) || !Number.isFinite(speed) || speed <= 0) return state
      if (target !== null) {
        reconstruct()
        return state
      }
      budget += Math.max(0, dt) * speed
      playBudget()
      return state
    },
  }
}
