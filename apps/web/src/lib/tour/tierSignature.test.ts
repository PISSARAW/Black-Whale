import { describe, expect, it } from 'vitest'

import { TIER_SIGNATURES, tierSignatureAt } from './tierSignature'

describe('the sensory signature of a deck', () => {
  it('gets rougher, dirtier and more crowded towards the keel', () => {
    const hold = tierSignatureAt(0)
    const royal = tierSignatureAt(128)

    expect(hold.wear).toBeGreaterThan(royal.wear)
    expect(hold.soil).toBeGreaterThan(royal.soil)
    expect(hold.airLoad).toBeGreaterThan(royal.airLoad)
    expect(hold.humanDensity).toBeGreaterThan(royal.humanDensity)
    expect(hold.ventilationStability).toBeLessThan(royal.ventilationStability)
  })

  it('interpolates secondary decks instead of assigning them another class system', () => {
    const halfway = tierSignatureAt((63 + 96) / 2)
    expect(halfway.wear).toBeCloseTo((0.54 + 0.3) / 2)
    expect(halfway.ventilationStability).toBeCloseTo((0.66 + 0.86) / 2)
  })

  it('is bounded outside the hull and keeps every authored value normalized', () => {
    expect(tierSignatureAt(-100)).toEqual(tierSignatureAt(0))
    expect(tierSignatureAt(1000)).toEqual(tierSignatureAt(128))
    for (const signature of TIER_SIGNATURES) {
      for (const value of Object.values(signature).slice(1)) {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      }
    }
  })
})
