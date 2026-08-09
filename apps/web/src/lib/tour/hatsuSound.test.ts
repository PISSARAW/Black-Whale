import { describe, expect, it, vi } from 'vitest'
import { HATSU_PROFILES } from '$lib/nen/hatsuRegistry'

vi.mock('$lib/audio/hatsuSounds', () => ({ playHatsuActivationSignature: vi.fn() }))
vi.mock('./reportSound', () => ({ playTourReportSound: vi.fn() }))

import { playHatsuActivationSignature } from '$lib/audio/hatsuSounds'
import { playTourReportSound } from './reportSound'
import { playTourHatsuSound } from './hatsuSound'
import { worksInTour } from './hatsu'

describe('tour Hatsu sound', () => {
  it('gives every Hatsu carried by the tour its own voice and its result accent', () => {
    const report = { kind: 'no-target' } as const
    const carried = HATSU_PROFILES.filter(worksInTour)
    for (const profile of carried) playTourHatsuSound(profile, report)

    expect(playHatsuActivationSignature).toHaveBeenCalledTimes(carried.length)
    for (const profile of carried) {
      expect(playHatsuActivationSignature).toHaveBeenCalledWith(profile.id)
    }
    expect(playTourReportSound).toHaveBeenCalledTimes(carried.length)
  })
})
