import { describe, expect, it } from 'vitest'
import { cadenceResult, latencyResult } from '../apps/web/scripts/command-qualification-report.mjs'
import { soakSegment } from '../apps/web/ui-tests/fighting-qualification/soakSchedule'

describe('qualification acceptance uses all requested observations', () => {
  it('keeps a same-frame RAF timestamp before setup in the first segment', () => {
    expect(soakSegment(999, 1000)).toBe(0)
    expect(soakSegment(1000, 1000)).toBe(0)
    expect(soakSegment(100999, 1000)).toBe(0)
    expect(soakSegment(101000, 1000)).toBe(1)
    expect(soakSegment(601000, 1000)).toBe(5)
  })
  it('never turns a missing animation or duplicate trial into a successful latency measurement', () => {
    const trial = { drawMs: 16, executionMs: 8, queueMs: 8 }
    expect(latencyResult([trial], 1).pass).toBe(true)
    expect(latencyResult([{ drawMs: null, executionMs: 8 }], 1).pass).toBe(false)
    expect(latencyResult([trial], 2).pass).toBe(false)
    expect(latencyResult([trial, trial], 1).pass).toBe(false)
    expect(latencyResult([{ ...trial, drawMs: 84 }], 1).pass).toBe(false)
  })
  it('retains a slow tail and a replay divergence even when mean cadence looks acceptable', () => {
    const sample = { interval: 1000 / 60, work: 2, geometries: 100, textures: 2, calls: 50 }
    const raw = {
      samples: Array.from({ length: 100 }, () => ({ ...sample })),
      dropped: 0,
      verified: 1,
      failure: '',
      failedScene: false,
      effectSeen: true,
    }
    expect(cadenceResult(raw).pass).toBe(true)
    const slow = {
      ...raw,
      samples: raw.samples.map((row, index) => (index >= 98 ? { ...row, interval: 26 } : row)),
    }
    expect(cadenceResult(slow).checks.p99).toBe(false)
    expect(cadenceResult({ ...raw, failure: 'divergence:120' }).pass).toBe(false)
    expect(cadenceResult({ ...raw, dropped: 1 }).pass).toBe(false)
  })
})
