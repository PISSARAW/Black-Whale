import { describe, expect, it } from 'vitest'
import { appendTrace, liveTraces, MAX_HUNT_TRACES, traceStrength, type HuntTrace } from './traces'

const trace = (createdAt: number, kind: HuntTrace['kind'] = 'footstep'): HuntTrace => ({
  kind,
  actor: 'player',
  terrain: 'tserriednich',
  spaceId: 'hall',
  position: [1, 2],
  createdAt,
  strength: 1,
  falseTrail: false,
})

describe('persistent Hunt traces', () => {
  it('ages signatures according to their nature', () => {
    expect(traceStrength(trace(0), 22.5)).toBeCloseTo(0.5)
    expect(traceStrength(trace(0, 'aura'), 45)).toBeCloseTo(0.5)
    expect(liveTraces([trace(0), trace(50)], 50)).toEqual([trace(50)])
  })

  it('keeps a deterministic bounded history', () => {
    let traces: HuntTrace[] = []
    for (let index = 0; index <= MAX_HUNT_TRACES; index += 1)
      traces = appendTrace(traces, trace(index))
    expect(traces).toHaveLength(MAX_HUNT_TRACES)
    expect(traces[0].createdAt).toBe(1)
  })
})
