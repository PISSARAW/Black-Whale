import { describe, expect, it } from 'vitest'
import {
  CANON_AURA_COLOURS,
  CATEGORY_AURA_COLOURS,
  fighterAuraColour,
  fighterAuraHex,
  fighterNenCategory,
} from './auraColours'
import { FIGHTING_ROSTER } from './roster'

describe('fighter aura colours', () => {
  it('uses the colour the manga or the anime showed', () => {
    expect(fighterAuraColour('hisoka')).toBe(CANON_AURA_COLOURS.hisoka?.colour)
  })

  it('falls back to the Nen category colour when none was shown', () => {
    expect(fighterNenCategory('phinks')).toBe('enhancer')
    expect(fighterAuraColour('phinks')).toBe('#3b82f6')
    expect(fighterAuraColour('leorio')).toBe(CATEGORY_AURA_COLOURS.emitter)
  })

  it('gives an unstated category the neutral ivory', () => {
    expect(fighterAuraColour('benjamin')).toBe(CATEGORY_AURA_COLOURS.unknown)
  })

  it('cites a source for every canon colour', () => {
    for (const aura of Object.values(CANON_AURA_COLOURS)) {
      expect(aura?.source.length).toBeGreaterThan(0)
      expect(aura?.colour).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('resolves a valid colour for every fighter in the roster', () => {
    for (const fighter of FIGHTING_ROSTER) {
      expect(fighterAuraColour(fighter.id)).toMatch(/^#[0-9a-f]{6}$/)
      expect(fighterAuraHex(fighter.id)).toBe(
        Number.parseInt(fighterAuraColour(fighter.id).slice(1), 16),
      )
    }
  })
})
