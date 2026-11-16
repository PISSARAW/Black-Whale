import { createCombatSchool, advanceCombatSchool } from '../../src/lib/fighting/combatSchool'
import { COMBAT_ROUTES } from '../../src/lib/fighting/combatRoutes'
import { createFightMatchRuntime } from '../../src/lib/fighting/fightMatchRuntime'
import { createCombatCamera } from '../../src/lib/fighting/combatCamera'
import { createCombatRouteFight } from '../../src/lib/fighting/combatRouteFight'
import { fightReplayHash } from '../../src/lib/fighting/fightReplayHash'
import { EMPTY_INPUT } from '../../src/lib/fighting/types'
import { get } from 'svelte/store'

export function distribution(values: number[]) {
  const sorted = values.slice().sort((a, b) => a - b)
  const at = (q: number) =>
    sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * q) - 1)] ?? 0
  return {
    count: sorted.length,
    p50: at(0.5),
    p95: at(0.95),
    p99: at(0.99),
    max: sorted.at(-1) ?? 0,
    mean: values.reduce((a, b) => a + b, 0) / Math.max(1, values.length),
  }
}
export function benchmarkCombat() {
  const results = []
  for (const route of COMBAT_ROUTES)
    for (const recording of [false, true]) {
      const school = createCombatSchool()
      const match = createFightMatchRuntime(undefined, { record: recording })
      match.observeFrames(school.observe)
      let state = school.start(route.id, true)
      match.begin(state)
      const values = []
      for (let i = 0; i < 200 && !get(school)?.complete && !get(school)?.failed; i++) {
        const started = performance.now()
        state = advanceCombatSchool({
          school,
          match,
          state,
          dt: 1 / 60,
          input: EMPTY_INPUT,
          opponentInput: EMPTY_INPUT,
        })
        values.push(performance.now() - started)
      }
      if (!get(school)?.complete) throw Error(`Incomplete benchmark route: ${route.id}`)
      results.push({
        route: route.id,
        recording,
        milliseconds: distribution(values),
        hash: fightReplayHash(state),
      })
    }
  for (const route of COMBAT_ROUTES) {
    const pair = results.filter((result) => result.route === route.id)
    if (pair[0].hash !== pair[1].hash) throw Error(`Recording changed combat: ${route.id}`)
  }
  return results
}
export function benchmarkCamera() {
  const rig = createCombatCamera()
  const state = createCombatRouteFight(COMBAT_ROUTES[0])
  const batches = []
  for (let batch = 0; batch < 50; batch++) {
    const started = performance.now()
    for (let i = 0; i < 250; i++)
      rig.update({
        state,
        base: { x: 0, y: 2.2, z: 8.2, lookY: 1.18 },
        span: { centre: 0, gap: 2 + (i % 80) / 10 },
        aspect: 16 / 9,
        intensity: 1,
        dt: 1 / 60,
      })
    if (batch >= 10) batches.push(performance.now() - started)
  }
  return { callsPerBatch: 250, measuredCalls: 10000, batchMilliseconds: distribution(batches) }
}
