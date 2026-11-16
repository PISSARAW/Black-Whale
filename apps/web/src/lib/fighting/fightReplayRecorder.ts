import { FIGHTING_ROSTER } from './roster'
import { encodeFightSnapshot } from './fightReplaySnapshot'
import { fightReplayHash } from './fightReplayHash'
import {
  REPLAY_RULESET,
  REPLAY_VERSION,
  MAX_REPLAY_PACKETS,
  MAX_REPLAY_SECONDS,
  MAX_REPLAY_BYTES,
  type FightReplay,
  type ReplayPacket,
  type ReplaySetup,
} from './fightReplayTypes'
import { initialReplayState } from './fightReplayCommands'
import type { FightState } from './types'

export function replaySetup(state: FightState): ReplaySetup | null {
  if (state.forecastSimulation) return null
  if (
    !FIGHTING_ROSTER.some(({ id }) => id === state.player.id) ||
    !FIGHTING_ROSTER.some(({ id }) => id === state.opponent.id)
  )
    return null
  return JSON.parse(
    JSON.stringify({
      seed: state.rng,
      initial: encodeFightSnapshot(state),
      player: state.player.id,
      opponent: state.opponent.id,
      mode: state.mode,
      formatId: state.formatId,
      environment: state.environment,
    }),
  ) as ReplaySetup
}
export function createReplayRecorder(state: FightState) {
  const setup = replaySetup(state)
  if (!setup || fightReplayHash(state) !== fightReplayHash(initialReplayState(setup))) return null
  const packets: ReplayPacket[] = []
  const checkpoints = [{ packet: 0, hash: fightReplayHash(state) }]
  let last = state
  let duration = 0
  let bytes = JSON.stringify(setup).length
  let error = ''
  return {
    get count() {
      return packets.length
    },
    get error() {
      return error
    },
    invalidate() {
      error = 'untracked'
    },
    append(before: FightState, packet: ReplayPacket, after: FightState) {
      if (error) return
      if (before !== last && fightReplayHash(before) !== fightReplayHash(last)) {
        error = 'untracked'
        return
      }
      const packetBytes = JSON.stringify(packet).length
      if (
        packets.length >= MAX_REPLAY_PACKETS ||
        duration + packet[0] > MAX_REPLAY_SECONDS ||
        bytes + packetBytes > MAX_REPLAY_BYTES - 1_000_000
      ) {
        error = 'limit'
        return
      }
      bytes += packetBytes
      packets.push(packet)
      duration += packet[0]
      last = after
      if (packets.length % 120 === 0 || after.phase !== before.phase)
        checkpoints.push({ packet: packets.length, hash: fightReplayHash(after) })
    },
    snapshot(): FightReplay | null {
      if (error === 'untracked' || duration <= 0) return null
      const hash = fightReplayHash(last)
      const end = { packet: packets.length, hash }
      const verified =
        checkpoints.at(-1)?.packet === packets.length ? checkpoints.slice(0, -1) : checkpoints
      return {
        version: REPLAY_VERSION,
        ruleset: REPLAY_RULESET,
        setup,
        packets: packets.slice(),
        checkpoints: [...verified, end],
        duration,
        complete: !error && Boolean(last.matchWinner),
      }
    },
  }
}
export type FightReplayRecorder = NonNullable<ReturnType<typeof createReplayRecorder>>
