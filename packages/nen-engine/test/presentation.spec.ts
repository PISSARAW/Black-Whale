import { describe, expect, it } from 'vitest'
import { NEN_PRESENTATION, NEN_TECHNIQUES } from '../src/index.js'

describe('shared Nen presentation', () => {
  it('defines one complete audiovisual signature per technique', () => {
    expect(Object.keys(NEN_PRESENTATION).sort()).toEqual([...NEN_TECHNIQUES].sort())
    for (const profile of Object.values(NEN_PRESENTATION)) {
      expect(profile.intensity).toBeGreaterThanOrEqual(0)
      expect(profile.intensity).toBeLessThanOrEqual(1)
      expect(profile.sound.lowHz).toBeLessThan(profile.sound.highHz)
      expect(profile.envelope.attack).toBeGreaterThan(0)
      expect(profile.envelope.release).toBeGreaterThan(0)
    }
  })
})
