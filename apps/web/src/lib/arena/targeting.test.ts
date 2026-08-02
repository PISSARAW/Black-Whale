import { describe, expect, it } from 'vitest'
import { zoneFromPitch } from './targeting'

describe('reticle body targeting', () => {
  it('turns camera elevation into stable body bands', () => {
    expect(zoneFromPitch(-0.35)).toBe('head')
    expect(zoneFromPitch(-0.15)).toBe('arms')
    expect(zoneFromPitch(0)).toBe('torso')
    expect(zoneFromPitch(0.15)).toBe('arms')
    expect(zoneFromPitch(0.35)).toBe('legs')
  })
})
