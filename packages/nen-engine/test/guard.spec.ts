import { describe, expect, it } from 'vitest'
import { focusedRyuDistribution, resolvesParry } from '../src/guard.js'

describe('shared guard contract', () => {
  it('accepts only readable blocked impacts inside the six-frame window', () => {
    expect(resolvesParry({ blocked: true, readable: true, guardFrames: 1 })).toBe(true)
    expect(resolvesParry({ blocked: true, readable: true, guardFrames: 6 })).toBe(true)
    expect(resolvesParry({ blocked: true, readable: true, guardFrames: 7 })).toBe(false)
    expect(resolvesParry({ blocked: false, readable: true, guardFrames: 1 })).toBe(false)
    expect(resolvesParry({ blocked: true, readable: false, guardFrames: 1 })).toBe(false)
  })

  it('extends the timing window with a non-negative perception bonus', () => {
    expect(resolvesParry({ blocked: true, readable: true, guardFrames: 8, bonusFrames: 2 })).toBe(
      true,
    )
    expect(resolvesParry({ blocked: true, readable: true, guardFrames: 9, bonusFrames: -4 })).toBe(
      false,
    )
  })

  it('focuses 76 percent on one zone and preserves a unit distribution', () => {
    const distribution = focusedRyuDistribution({
      zones: ['head', 'torso', 'hands', 'feet'] as const,
      focus: 'head',
    })

    expect(distribution).toEqual({ head: 0.76, torso: 0.08, hands: 0.08, feet: 0.08 })
    expect(Object.values(distribution).reduce((sum, share) => sum + share, 0)).toBeCloseTo(1)
  })
})
