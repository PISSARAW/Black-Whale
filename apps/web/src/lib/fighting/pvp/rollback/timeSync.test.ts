import { describe, expect, it } from 'vitest'
import { TimeSync } from './timeSync'

describe('rollback time sync (lot L3)', () => {
  it('measures the round trip with a smoothed average', () => {
    const time = new TimeSync()
    time.observePong(0, 100)
    expect(time.roundTripMs).toBe(100)
    time.observePong(1000, 1020)
    expect(time.roundTripMs).toBeCloseTo(90)
  })

  it('makes only the side that runs ahead wait, one frame in ten at most', () => {
    const ahead = new TimeSync()
    for (let frame = 0; frame < 40; frame++)
      ahead.observeRemote({ remoteFrame: frame, remoteAdvantage: -3, localFrame: frame + 3 })
    expect(ahead.advantage).toBe(3)
    expect(ahead.skew).toBe(3)
    const waits = Array.from({ length: 30 }, (_, frame) => ahead.shouldWait(100 + frame))
    expect(waits.filter(Boolean)).toHaveLength(3)

    const behind = new TimeSync()
    for (let frame = 0; frame < 40; frame++)
      behind.observeRemote({ remoteFrame: frame + 3, remoteAdvantage: 3, localFrame: frame })
    expect(behind.shouldWait(100)).toBe(false)
  })

  it('counts half the round trip as transit', () => {
    const time = new TimeSync()
    time.observePong(0, 100)
    time.observeRemote({ remoteFrame: 10, remoteAdvantage: 0, localFrame: 13 })
    expect(time.advantage).toBeCloseTo(0)
  })
})
