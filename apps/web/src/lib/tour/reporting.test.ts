import { describe, expect, it } from 'vitest'

import { REPORT_STEP, REPORT_TURN, angleGap, reporter } from './reporting'

describe('what the loop bothers to report', () => {
  it('says nothing until the visitor has walked a step', () => {
    const look = reporter()
    expect(look.stepped([REPORT_STEP / 2, 0])).toBe(false)
    expect(look.stepped([REPORT_STEP, 0])).toBe(true)
    // And then holds its tongue again until the next step, measured from there.
    expect(look.stepped([REPORT_STEP, 0])).toBe(false)
    expect(look.stepped([REPORT_STEP * 2, 0])).toBe(true)
  })

  it('reports a turn on the spot, which is the whole of the repair', () => {
    const look = reporter()
    expect(look.stepped([0, 0])).toBe(false)
    expect(look.turned(REPORT_TURN / 2)).toBe(false)
    expect(look.turned(REPORT_TURN * 2)).toBe(true)
    expect(look.turned(REPORT_TURN * 2)).toBe(false)
  })

  it('reports a head tipped up without the visitor turning or moving', () => {
    const look = reporter()
    expect(look.tilted(0.5)).toBe(true)
    expect(look.turned(0)).toBe(false)
    expect(look.stepped([0, 0])).toBe(false)
  })

  it('takes the short way round the circle, so ±π is not a full turn', () => {
    expect(angleGap(Math.PI - 0.01, -Math.PI + 0.01)).toBeCloseTo(-0.02, 9)
    const look = reporter()
    look.seen([0, 0], Math.PI - 0.001, 0)
    expect(look.turned(-Math.PI + 0.001)).toBe(false)
  })

  it('swallows a jump the thresholds would otherwise report twice', () => {
    const look = reporter()
    look.seen([100, 100], 2, 0.4)
    expect(look.stepped([100, 100])).toBe(false)
    expect(look.turned(2)).toBe(false)
    expect(look.tilted(0.4)).toBe(false)
  })
})
