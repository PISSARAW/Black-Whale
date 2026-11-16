import { createFight } from '../../src/lib/fighting/engine'
import { createFightMatchRuntime } from '../../src/lib/fighting/fightMatchRuntime'
import { executeReplayPacket } from '../../src/lib/fighting/fightReplayCommands'
import { packReplayInput } from '../../src/lib/fighting/fightReplayInput'
import { fightReplayHash } from '../../src/lib/fighting/fightReplayHash'
import {
  REPLAY_FIGHTERS,
  type ReplayFighter,
  type ReplayCommand,
} from '../../src/lib/fighting/fightReplayTypes'
import { EMPTY_INPUT } from '../../src/lib/fighting/types'

export function distribution(samples: number[]) {
  const sorted = samples.slice().sort((a, b) => a - b)
  const quantile = (p: number) =>
    sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)] ?? 0
  return {
    count: sorted.length,
    p50: quantile(0.5),
    p95: quantile(0.95),
    p99: quantile(0.99),
    max: sorted.at(-1) ?? 0,
    mean: samples.reduce((a, b) => a + b, 0) / Math.max(1, samples.length),
    over16ms: sorted.filter((n) => n > 1000 / 60).length / Math.max(1, sorted.length),
  }
}
export function benchmarkEngine(count = 1800) {
  const report = []
  for (const id of REPLAY_FIGHTERS)
    for (const recording of [false, true]) {
      const runtime = createFightMatchRuntime(undefined, { record: recording })
      let state = fresh(id)
      runtime.begin(state)
      state = runtime.apply(state, { kind: 'start' })
      const samples: number[] = []
      for (let i = 0; i < count + 300; i++) {
        if (state.phase === 'finished') {
          if (!state.matchWinner) state = runtime.apply(state, { kind: 'round' })
          else {
            state = fresh(id)
            runtime.begin(state)
            state = runtime.apply(state, { kind: 'start' })
          }
        }
        const commands: ReplayCommand[] = []
        if (i % 40 === 0)
          commands.push({
            kind: 'move',
            side: 'player',
            action: i % 80 === 0 ? 'heavy' : 'light',
            input: 0,
          })
        if (i % 90 === 0)
          commands.push({ kind: 'move', side: 'opponent', action: 'ranged', input: 0 })
        for (const command of commands) runtime.enqueue(state, command)
        const start = performance.now()
        state = runtime.advance(
          state,
          { ...EMPTY_INPUT, right: true },
          { dt: 1 / 60, opponentInput: { ...EMPTY_INPUT, left: true } },
        )
        if (i >= 300) samples.push(performance.now() - start)
      }
      report.push({
        id,
        recording,
        milliseconds: distribution(samples),
        finalHash: fightReplayHash(state),
      })
    }
  for (const id of REPLAY_FIGHTERS) {
    const pair = report.filter((row) => row.id === id)
    if (pair[0].finalHash !== pair[1].finalHash)
      throw new Error(`Recording changed the simulation: ${id}`)
  }
  return report
}
export function fresh(id: ReplayFighter) {
  return createFight(id, id === 'chrollo' ? 'hisoka' : 'chrollo', {
    mode: 'versus-local',
    formatId: 'knockout',
    environment: { stageId: 'heavens-arena', arenaInteractions: false },
  })
}
export function referencePacket(state: ReturnType<typeof fresh>, tick: number) {
  const commands: ReplayCommand[] =
    tick % 40 === 0 ? [{ kind: 'move', side: 'player', action: 'heavy', input: 0 }] : []
  return executeReplayPacket(state, [
    1 / 60,
    packReplayInput({ ...EMPTY_INPUT, right: true }),
    packReplayInput({ ...EMPTY_INPUT, left: true }),
    commands,
  ])
}
