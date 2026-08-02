import { describe, expect, it } from 'vitest'
import { HATSU_PROFILES } from '$lib/nen/hatsuRegistry'
import { hatsuAudioSignature } from './hatsuSounds'

describe('Hatsu audiovisual coverage', () => {
  it('gives every published Hatsu a stable dedicated audio signature', () => {
    const signatures = HATSU_PROFILES.map((profile) => hatsuAudioSignature(profile.id))
    expect(signatures).toHaveLength(HATSU_PROFILES.length)
    expect(new Set(signatures.map((signature) => JSON.stringify(signature))).size).toBe(
      HATSU_PROFILES.length,
    )
    for (const signature of signatures) {
      expect(signature.lowHz).toBeGreaterThanOrEqual(72)
      expect(signature.highHz).toBeGreaterThan(signature.lowHz)
      expect(signature.pulses).toBeGreaterThanOrEqual(2)
    }
  })
})
