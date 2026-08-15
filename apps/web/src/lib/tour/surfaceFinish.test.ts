import { describe, expect, it } from 'vitest'
import { structureSheenOf } from './surfaceFinish'

describe('surface finish by solid kind', () => {
  it('keeps fabric and composite electronics matte', () => {
    for (const kind of ['bed', 'seat', 'telephone', 'painting'] as const) {
      expect(structureSheenOf(kind)).toBe(0)
    }
  })

  it('gives bare metal more sheen than furniture and painted housings', () => {
    expect(structureSheenOf('spring')).toBeGreaterThan(structureSheenOf('table'))
    expect(structureSheenOf('manacle')).toBeGreaterThan(structureSheenOf('camera'))
    expect(structureSheenOf('bars')).toBeGreaterThan(structureSheenOf('cabinet'))
  })

  it('keeps every finish within the structural steel reference', () => {
    for (const value of Object.values({
      spring: structureSheenOf('spring'),
      basin: structureSheenOf('basin'),
      lifeboat: structureSheenOf('lifeboat'),
    })) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(1)
    }
  })
})
