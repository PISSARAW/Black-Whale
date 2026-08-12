import { describe, expect, it } from 'vitest'
import { BUDGETS, FrameMeter, overspends, WINDOW_MS, type FrameSnapshot } from './frameBudget'

/** A frame that costs nothing, so a test can say what it is actually about. */
function idle(over: Partial<FrameSnapshot> = {}): FrameSnapshot {
  return { calls: 40, triangles: 20_000, geometries: 120, textures: 8, programs: 14, ...over }
}

/**
 * Run a meter over `frames` frames of a fixed interval, and hand back every
 * reading it chose to emit. `cost` is how long the callback itself took.
 */
function sweep(
  meter: FrameMeter,
  frames: { count: number; interval: number; cost?: number },
  snapshot: FrameSnapshot = idle(),
) {
  const readings = []
  let clock = 1000
  for (let i = 0; i < frames.count; i += 1) {
    meter.begin(clock)
    const reading = meter.end(clock + (frames.cost ?? 1), snapshot)
    if (reading) readings.push(reading)
    clock += frames.interval
  }
  return readings
}

describe('the ceilings', () => {
  it('gives the light palier the looser interval and the tighter geometry', () => {
    // The two paliers are not a scale — a phone is allowed to be slower and is
    // not allowed to draw more, because what it is short of is fill rate and
    // not memory.
    expect(BUDGETS.low.frameMs).toBeGreaterThan(BUDGETS.high.frameMs)
    expect(BUDGETS.low.triangles).toBeLessThan(BUDGETS.high.triangles)
  })

  it('caps a frame at the deck bound `mesh.test.ts` already enforces', () => {
    // 120 000 is MAX_DECK_TRIANGLES. `visibility.ts` names about a quarter of a
    // deck at depth two, so a frame at this line is one where portal culling
    // has stopped happening — a defect, not a heavy room.
    expect(BUDGETS.low.triangles).toBe(120_000)
    expect(BUDGETS.high.triangles).toBe(BUDGETS.low.triangles * 2)
  })
})

describe('reading a window against its budget', () => {
  const within = {
    tier: 'high' as const,
    fps: 60,
    frameMs: 16,
    worstMs: 40,
    cpuMs: 5,
    snapshot: idle(),
  }

  it('says nothing when every line is under', () => {
    expect(overspends(within)).toEqual([])
  })

  it('ignores a single slow frame and judges the median', () => {
    // A 40 ms worst frame is a deck being built or a collection running. If
    // that alerted, walking into a room would alert.
    expect(overspends({ ...within, worstMs: 400 })).toEqual([])
  })

  it('names the frame when half the frames are over', () => {
    expect(overspends({ ...within, frameMs: 20 })).toEqual(['frame'])
  })

  it('names each line it is over, so a miss says which repair it needs', () => {
    const broken = {
      ...within,
      tier: 'low' as const,
      frameMs: 30,
      snapshot: idle({ calls: 900, triangles: 300_000 }),
    }
    expect(overspends(broken)).toEqual(['frame', 'triangles', 'calls'])
  })

  it('can be over on geometry with a healthy interval', () => {
    // The case the instrument was written for: a workstation absorbs a culling
    // regression without dropping a frame, and ships it to the phone that will
    // not.
    expect(overspends({ ...within, snapshot: idle({ triangles: 300_000 }) })).toEqual(['triangles'])
  })
})

describe('the meter', () => {
  it('says nothing until a window is up', () => {
    // Four 16 ms frames is 48 ms of wall clock against a 500 ms window.
    expect(sweep(new FrameMeter('high'), { count: 4, interval: 16 })).toHaveLength(0)
  })

  it('reports once a window closes, and measures the real frame rate', () => {
    const readings = sweep(new FrameMeter('high'), { count: 40, interval: 16 })
    expect(readings).toHaveLength(1)
    expect(readings[0].fps).toBeCloseTo(1000 / 16, 0)
    expect(readings[0].frameMs).toBe(16)
    expect(readings[0].over).toEqual([])
  })

  it('measures the interval and not the callback', () => {
    // A frame callback that returns in 2 ms on a display that only gave it a
    // frame every 40 ms is a slow walk, however idle the main thread looked.
    const readings = sweep(new FrameMeter('high'), { count: 40, interval: 40, cost: 2 })
    expect(readings[0].frameMs).toBe(40)
    expect(readings[0].cpuMs).toBe(2)
    expect(readings[0].over).toEqual(['frame'])
  })

  it('keeps the worst interval, which the median is there to hide', () => {
    const meter = new FrameMeter('high')
    let clock = 0
    let last = null
    for (let i = 0; i < 60; i += 1) {
      meter.begin(clock)
      last = meter.end(clock + 1, idle()) ?? last
      clock += i === 30 ? 120 : 16
    }
    expect(last?.worstMs).toBe(120)
    expect(last?.frameMs).toBe(16)
  })

  it('carries the palier into the reading, so the alert names a budget', () => {
    const readings = sweep(new FrameMeter('low'), { count: 40, interval: 16 })
    expect(readings[0].tier).toBe('low')
  })

  it('reports the last frame rather than an average of the counters', () => {
    // A count has no average: half a draw call is not a thing, and what a
    // reader wants from "84 calls" is a number they can go and find in a
    // profiler, not a blend of the last thirty frames.
    const readings = sweep(new FrameMeter('high'), { count: 40, interval: 16 }, idle({ calls: 77 }))
    expect(readings[0].snapshot.calls).toBe(77)
  })

  it('does not charge the walk for the time the canvas was off screen', () => {
    // `animateVisibleScene` stops the loop on scroll. Without `resume` the gap
    // would come back as one enormous interval and one alert per scroll.
    const meter = new FrameMeter('high')
    sweep(meter, { count: 4, interval: 16 })
    meter.resume()
    const readings = sweep(meter, { count: 40, interval: 16 })
    expect(readings[0].worstMs).toBe(16)
  })

  it('starts a fresh window after each report', () => {
    const readings = sweep(new FrameMeter('high'), { count: 100, interval: WINDOW_MS / 8 })
    expect(readings.length).toBeGreaterThan(1)
    for (const reading of readings) expect(reading.frameMs).toBe(WINDOW_MS / 8)
  })
})
