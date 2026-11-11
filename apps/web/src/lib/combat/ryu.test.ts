import { describe, expect, it } from 'vitest'
import { initialFighter } from './types'
import { ryuDistribution } from './ryu'

describe('detailed Ryu distribution', () => {
  it('conserves aura while exposing unguarded zones', () => {
    const reading = ryuDistribution({
      ...initialFighter([0, 0]),
      attackShare: 0.65,
      guard: 'head',
    })
    const total =
      reading.attack + Object.values(reading.defence).reduce((sum, value) => sum + value, 0)
    expect(total).toBeCloseTo(1)
    expect(reading.defence.head).toBeGreaterThan(reading.defence.torso)
  })

  it('shows Ko as total commitment with every defensive zone exposed', () => {
    const reading = ryuDistribution({
      ...initialFighter([0, 0]),
      ko: { zone: 'arms', remaining: 0.5 },
    })
    expect(reading.attack).toBe(1)
    expect(Object.values(reading.defence).every((share) => share === 0)).toBe(true)
  })
})
