import { tickFight } from '../../src/lib/fighting/engine'
import { applyReplayCommand } from '../../src/lib/fighting/fightReplayCommands'
import { fightReplayHash } from '../../src/lib/fighting/fightReplayHash'
import { unpackReplayInput as unpackInput } from '../../src/lib/fighting/fightReplayInput'
import type { ReplayPacket } from '../../src/lib/fighting/fightReplayTypes'
import type { FightState } from '../../src/lib/fighting/types'
import type { BudgetScenario } from './scenarios'

/** Rollback window measured by the bench (plan D3: at most 8 resimulated frames). */
export const ROLLBACK_FRAMES = 8

export interface Quantiles {
  p50: number
  p95: number
  p99: number
  max: number
}
export interface ScenarioBudget {
  id: string
  group: BudgetScenario['group']
  mode: SnapshotMode
  frames: number
  tick: Quantiles
  clone: Quantiles
  hash: Quantiles
  rollback: Quantiles
  bytes: Quantiles
  /** Resimulated states whose hash differs from the state the straight run produced. */
  divergences: number
  /** Reference mode: kept states whose hash changed after capture (in-place mutation). */
  mutations: number
  rollbacks: number
  /** Frames on which the scenario's worst case was on stage. */
  manifestedFrames: number
}

export function quantiles(samples: number[]): Quantiles {
  const sorted = samples.slice().sort((a, b) => a - b)
  const at = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0
  return { p50: at(0.5), p95: at(0.95), p99: at(0.99), max: sorted.at(-1) ?? 0 }
}

function step(state: FightState, packet: ReplayPacket): FightState {
  const [dt, player, opponent, commands] = packet
  const next = commands.reduce(applyReplayCommand, state)
  return tickFight(next, unpackInput(player), {
    dt,
    opponentInput: unpackInput(opponent),
    ai: false,
  })
}

function timed<T>(samples: number[], run: () => T): T {
  const start = performance.now()
  const value = run()
  samples.push(performance.now() - start)
  return value
}

export type SnapshotMode = 'clone' | 'reference'

interface RingEntry {
  state: FightState
  packet: ReplayPacket
  /** Reference mode only: the hash at capture, to detect a later in-place mutation. */
  hash?: string
}

/**
 * Plays the scenario straight, and every `every` frames restores the snapshot taken
 * ROLLBACK_FRAMES earlier and resimulates the same packets: the cost a rollback client
 * pays, and a determinism check of the resimulated state against the straight run.
 * `reference` keeps the engine's own immutable states instead of deep copies, and
 * checks that no later frame mutated a kept state in place.
 */
export function measureScenario(
  scenario: BudgetScenario,
  options: { mode?: SnapshotMode; every?: number } = {},
): ScenarioBudget {
  const { mode = 'clone', every = 10 } = options
  const tick: number[] = []
  const clone: number[] = []
  const hash: number[] = []
  const rollback: number[] = []
  const bytes: number[] = []
  const ring: RingEntry[] = []
  let state = scenario.state
  let divergences = 0
  let mutations = 0
  let manifestedFrames = 0
  for (let frame = 0; frame < scenario.frames; frame++) {
    const packet = scenario.packet(state, frame)
    const kept =
      mode === 'clone'
        ? { state: timed(clone, () => structuredClone(state)), packet }
        : { state, packet, hash: fightReplayHash(state) }
    ring.push(kept)
    if (ring.length > ROLLBACK_FRAMES) ring.shift()
    state = timed(tick, () => step(state, packet))
    if (scenario.manifested(state)) manifestedFrames++
    if (frame % 30 === 0) bytes.push(JSON.stringify(state).length)
    if (frame % every !== 0 || ring.length < ROLLBACK_FRAMES) continue
    const expected = timed(hash, () => fightReplayHash(state))
    const oldest = ring[0]
    if (oldest.hash && fightReplayHash(oldest.state) !== oldest.hash) mutations++
    const replayed = timed(rollback, () => {
      const from = mode === 'clone' ? structuredClone(oldest.state) : oldest.state
      return ring.reduce((current, entry) => step(current, entry.packet), from)
    })
    if (fightReplayHash(replayed) !== expected) divergences++
  }
  return {
    id: scenario.id,
    group: scenario.group,
    mode,
    frames: scenario.frames,
    tick: quantiles(tick),
    clone: quantiles(clone),
    hash: quantiles(hash),
    rollback: quantiles(rollback),
    bytes: quantiles(bytes),
    divergences,
    mutations,
    rollbacks: rollback.length,
    manifestedFrames,
  }
}
