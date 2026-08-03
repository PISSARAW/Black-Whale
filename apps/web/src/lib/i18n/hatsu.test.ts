import { describe, expect, it } from 'vitest'
import { HATSU_PROFILES, hatsuById } from '$lib/nen/hatsuRegistry'
import { hatsuFr } from './messages/hatsu-fr'
import { localizeHatsu, localizeHatsuList } from './hatsu'

/**
 * The French overlay translates prose and nothing else. What a hatsu *is* —
 * its id, its kind, its colour, and whose it is — comes from the compiled
 * registry in both languages, so the two pages cannot name different owners
 * for the same ability the way they did before ADR-001 chantier 3.
 */

describe('localising a hatsu', () => {
  it('translates the prose', () => {
    const bungeeGum = hatsuById('bungee-gum')!

    expect(localizeHatsu(bungeeGum, 'fr').instruction).toBe(hatsuFr['bungee-gum'].instruction)
    expect(localizeHatsu(bungeeGum, 'fr').instruction).not.toBe(bungeeGum.instruction)
  })

  it('leaves the id, the kind and the colour alone: branches dispatch on them', () => {
    for (const profile of HATSU_PROFILES) {
      const french = localizeHatsu(profile, 'fr')

      expect(french.id).toBe(profile.id)
      expect(french.kind).toBe(profile.kind)
      expect(french.color).toBe(profile.color)
    }
  })

  it('gives both languages the same owner, a proper noun being no translation', () => {
    const translated = Object.entries(hatsuFr)
      .filter(([, override]) => override.owner !== undefined)
      .map(([id]) => id)

    // The one exception, and the reason `owner` survives as an optional field:
    // the catalogue names this owner by description rather than by name.
    expect(translated).toEqual(['silent-majority'])
    for (const profile of HATSU_PROFILES) {
      if (profile.id === 'silent-majority') continue
      expect(localizeHatsu(profile, 'fr').owner).toBe(profile.owner)
    }
  })

  it('falls back to English for a profile no locale knows', () => {
    const invented = { ...HATSU_PROFILES[0], id: 'not-a-hatsu' }

    expect(localizeHatsu(invented, 'fr')).toEqual(invented)
  })

  it('localises a whole list without reordering it', () => {
    const french = localizeHatsuList(HATSU_PROFILES, 'fr')

    expect(french.map((profile) => profile.id)).toEqual(HATSU_PROFILES.map((profile) => profile.id))
  })
})
