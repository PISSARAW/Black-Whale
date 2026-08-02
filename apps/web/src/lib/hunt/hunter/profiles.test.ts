import { describe, expect, it } from 'vitest'
import { HUNTER_PROFILES, hunterProfile } from './profiles'

describe('hunter profiles', () => {
  it('make aggression faster but more expensive than caution', () => {
    const aggressive = hunterProfile('aggressive')
    const cautious = hunterProfile('cautious')

    expect(aggressive.sweepInterval).toBeLessThan(cautious.sweepInterval)
    expect(aggressive.searchDrain).toBeGreaterThan(cautious.searchDrain)
    expect(aggressive.listenFor).toBeLessThan(cautious.listenFor)
  })

  it('keeps every profile distinct', () => {
    expect(new Set(HUNTER_PROFILES.map((profile) => JSON.stringify(profile))).size).toBe(3)
  })
})
