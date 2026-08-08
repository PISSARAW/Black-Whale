import { describe, expect, it, vi } from 'vitest'

import { HATSU_PROFILES } from '$lib/nen/hatsuRegistry'
import { hatsuAudioSignature, playHatsuActivationSignature } from './hatsuSounds'

vi.mock('./hatsuSounds', async (loadOriginal) => {
  const original = await loadOriginal<typeof import('./hatsuSounds')>()
  return {
    ...original,
    playHatsuActivationSignature: vi.fn(),
  }
})

import { playSiteHatsuInteraction, SITE_HATSU_SOUND_BY_KIND } from './siteHatsuAudio'

describe('site Hatsu sound', () => {
  it('gives all 85 techniques a distinct activation voice', () => {
    const signatures = HATSU_PROFILES.map(({ id }) => JSON.stringify(hatsuAudioSignature(id)))

    expect(signatures).toHaveLength(85)
    expect(new Set(signatures).size).toBe(85)
  })

  it('plays the ability-specific voice for every interaction kind', () => {
    for (const profile of HATSU_PROFILES) playSiteHatsuInteraction(profile.id, profile.kind)

    expect(playHatsuActivationSignature).toHaveBeenCalledTimes(85)
    for (const profile of HATSU_PROFILES)
      expect(playHatsuActivationSignature).toHaveBeenCalledWith(profile.id)
  })

  it('adds physical accents only where the manga provides an audible source', () => {
    expect(SITE_HATSU_SOUND_BY_KIND.elastic).toBeTypeOf('function')
    expect(SITE_HATSU_SOUND_BY_KIND['chain-bind']).toBeTypeOf('function')
    expect(SITE_HATSU_SOUND_BY_KIND.portal).toBeTypeOf('function')
    expect(SITE_HATSU_SOUND_BY_KIND.resurrection).toBeTypeOf('function')
    expect(SITE_HATSU_SOUND_BY_KIND.future).toBeTypeOf('function')
    expect(SITE_HATSU_SOUND_BY_KIND.scarlet).toBeUndefined()
  })
})
