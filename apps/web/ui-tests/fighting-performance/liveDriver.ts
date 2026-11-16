import { createFightMatchRuntime } from '../../src/lib/fighting/fightMatchRuntime'
import { initialReplayState } from '../../src/lib/fighting/fightReplayCommands'
import { unpackReplayInput } from '../../src/lib/fighting/fightReplayInput'
import { fightReplayHash } from '../../src/lib/fighting/fightReplayHash'
import type { FightReplay, ReplayPacket } from '../../src/lib/fighting/fightReplayTypes'

/** The live command queue, recorder and response diagnostics, driven by the reference inputs. */
export function createLiveDriver(tape: FightReplay) {
  const runtime = createFightMatchRuntime()
  let state = initialReplayState(tape.setup)
  let cursor = 0
  let budget = 0
  let error = ''
  const checkpoints = new Map(tape.checkpoints.map((entry) => [entry.packet, entry.hash]))
  runtime.begin(state)
  const unsubscribe = runtime.replays.subscribe((view) => {
    if (view.captureIssue) error = view.captureIssue
  })
  function step(packet: ReplayPacket) {
    if (packet[0] === 0) {
      for (const command of packet[3]) state = runtime.apply(state, command)
    } else {
      for (const command of packet[3]) runtime.enqueue(state, command)
      state = runtime.advance(state, unpackReplayInput(packet[1]), {
        dt: packet[0],
        opponentInput: unpackReplayInput(packet[2]),
      })
    }
    const expected = checkpoints.get(++cursor)
    if (expected && fightReplayHash(state) !== expected) error = `live-divergence:${cursor}`
    if (cursor >= tape.packets.length || error) unsubscribe()
  }
  return {
    get state() {
      return state
    },
    get done() {
      return cursor >= tape.packets.length || Boolean(error)
    },
    get error() {
      return error
    },
    advance(dt: number) {
      budget += Math.max(0, dt)
      let steps = 0
      while (cursor < tape.packets.length && !error && steps++ < 240) {
        const packet = tape.packets[cursor]
        if (packet[0] > budget + 1e-9) break
        budget = Math.max(0, budget - packet[0])
        step(packet)
      }
      return state
    },
  }
}
