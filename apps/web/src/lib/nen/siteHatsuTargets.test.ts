import { describe, expect, it } from 'vitest'

import { familiesOf, manifestOfKind } from './targeting'
import { CHARACTER_ONLY_SITE_HATSU, requiresCharacterTarget } from './siteHatsuTargets'

describe('global site Hatsu targets', () => {
  it('keeps every character-only interaction backed by a body target', () => {
    for (const kind of CHARACTER_ONLY_SITE_HATSU)
      expect(familiesOf(manifestOfKind(kind)).has('body'), kind).toBe(true)
  })

  it('lets Bungee Gum bind objects and surfaces as well as people', () => {
    expect(requiresCharacterTarget('elastic')).toBe(false)
    expect(familiesOf(manifestOfKind('elastic'))).toEqual(new Set(['body', 'solid', 'room']))
  })

  it('lets Secret Window observe page locations and events', () => {
    expect(requiresCharacterTarget('surveillance')).toBe(false)
    expect(manifestOfKind('surveillance')?.allowedTargets).toEqual(['LOCATION', 'EVENT'])
  })
})
