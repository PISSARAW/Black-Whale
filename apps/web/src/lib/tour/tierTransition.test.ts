import { describe, expect, it } from 'vitest'

import { beginTierTransition, stepTierTransition } from './tierTransition'

describe('the eye crossing a deck seam', () => {
  it('flares while climbing into a brighter register and returns to neutral', () => {
    let transition = beginTierTransition(31.5, 63)
    const middle = stepTierTransition(transition, 0.4)
    expect(middle.exposure).toBeGreaterThan(1)
    transition = middle.transition
    expect(stepTierTransition(transition, 2).transition).toBeNull()
  })

  it('starts dark while descending and adapts more slowly', () => {
    const down = beginTierTransition(63, 31.5)!
    const up = beginTierTransition(31.5, 63)!
    expect(down.duration).toBeGreaterThan(up.duration)
    expect(stepTierTransition(down, 0).exposure).toBeLessThan(1)
  })

  it('does nothing between rooms on the same physical deck', () => {
    expect(beginTierTransition(128, 128)).toBeNull()
    expect(stepTierTransition(null, 1)).toEqual({ transition: null, exposure: 1 })
  })
})
