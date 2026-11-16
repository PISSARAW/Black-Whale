import { describe, expect, it } from 'vitest'
import { performanceTape } from '../../../ui-tests/fighting-performance/scenario'
import {
  STRESS_FIGHTERS,
  stressManifested,
  type StressScenario,
} from '../../../ui-tests/fighting-performance/stressScenario'
import { createLiveDriver } from '../../../ui-tests/fighting-performance/liveDriver'
import { createReplayPlayer } from './fightReplayPlayer'
import { fightReplayHash } from './fightReplayHash'
import { fightingPerformanceCases } from '../../../scripts/fighting-performance-cases.mjs'
import {
  fightingPerformanceBudget,
  resourceDrift,
} from '../../../scripts/fighting-performance-budget.mjs'

describe('expensive Nen sequences remain real and replayable', () => {
  it.each(Object.keys(STRESS_FIGHTERS) as StressScenario[])(
    '%s is activated through engine commands',
    (scenario) => {
      const tape = performanceTape({
        fighter: STRESS_FIGHTERS[scenario],
        stage: scenario === 'guards' ? 'heilly-hideout' : 'banquet-hall',
        effects: true,
        live: true,
        scenario,
      })
      const live = createLiveDriver(tape)
      const replay = createReplayPlayer(tape)
      let manifested = false
      for (let i = 0; i < 1300 && !live.done; i++) {
        live.advance(1 / 60)
        replay.advance(1 / 60)
        manifested ||= stressManifested(live.state, scenario)
      }
      expect(manifested).toBe(true)
      expect(live.done).toBe(true)
      expect(live.error).toBe('')
      expect(replay.error).toBe('')
      expect(
        tape.packets
          .filter((packet) =>
            packet[3].some((command) => command.kind === 'round' || command.kind === 'start'),
          )
          .every((packet) => packet[0] === 0),
      ).toBe(true)
      expect(fightReplayHash(live.state)).toBe(fightReplayHash(replay.state))
      expect(
        tape.packets
          .flatMap((packet) => packet[3])
          .every((command) => ['start', 'round', 'move'].includes(command.kind)),
      ).toBe(true)
    },
  )
  it('compares graphics profiles with exactly the same simulation', () => {
    const base = {
      fighter: 'franklin',
      scenario: 'projectiles',
      stage: 'banquet-hall',
      effects: true,
    } as const
    const full = performanceTape({ ...base, graphics: 'quality' })
    const low = performanceTape({ ...base, graphics: 'performance' })
    expect(low).toEqual(full)
  })
})

describe('performance evidence does not silently accept partial or invalid runs', () => {
  const passing = {
    intervals: { count: 2700, min: 16.6, p95: 16.8, p99: 17 },
    fps: 60,
    over25ms: 0,
    renderCpu: { p95: 5 },
    droppedSamples: 0,
    verified: 2,
    failure: '',
    requiredEffectSeen: true,
    failedScene: false,
  }
  it('retains twenty reference cases and fifteen explicit stress/profile combinations', () => {
    expect(fightingPerformanceCases()).toHaveLength(20)
    const cases = fightingPerformanceCases('stress')
    expect(cases).toHaveLength(15)
    expect(new Set(cases.map(({ id }) => id)).size).toBe(15)
    expect(() => fightingPerformanceCases('misspelled')).toThrow()
  })
  it('passes a complete run without treating GPU work as physical display latency', () => {
    expect(fightingPerformanceBudget(passing).pass).toBe(true)
  })
  it.each([
    { droppedSamples: 1 },
    { scenario: 'future', predictionContexts: 0 },
    { scenario: 'future', predictionContexts: 2 },
    { intervals: { count: 2700, min: 0, p95: 16.8, p99: 17 } },
    { verified: 0 },
    { requiredEffectSeen: false },
    { fps: 55 },
    { intervals: { count: 2700, p95: 40, p99: 50 } },
    { renderCpu: { p95: 20 } },
    { over25ms: 100 },
    { failure: 'divergence' },
    { failedScene: true },
  ])('rejects an incomplete or over-budget measurement %j', (patch) => {
    expect(fightingPerformanceBudget({ ...passing, ...patch }).pass).toBe(false)
  })
  it('reports resource growth rather than discarding the end of a long session', () => {
    expect(
      resourceDrift([
        { geometries: 10, textures: 2 },
        { geometries: 25, textures: 6 },
      ]),
    ).toEqual({ window: 1, geometries: 15, textures: 4 })
    expect(resourceDrift([])).toBeNull()
  })
})
