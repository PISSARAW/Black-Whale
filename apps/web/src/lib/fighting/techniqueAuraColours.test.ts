import { describe, expect, it } from 'vitest'
import { fighterAuraColour } from './auraColours'
import { attackAuraColour, TECHNIQUE_AURA_COLOURS } from './techniqueAuraColours'
import type { ArcadeFighter } from './types'

function throwing(moveId: string | undefined): Pick<ArcadeFighter, 'id' | 'attack'> {
  return {
    id: 'kurapika',
    attack: {
      moveId,
      kind: 'special',
      frame: 0,
      impacted: false,
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
      projectileSpawned: false,
      reversal: false,
    },
  }
}

describe('technique aura colours', () => {
  it('gives each of Kurapika’s chains the aura the anime showed', () => {
    expect(attackAuraColour(throwing('kurapika:forwardSpecial'))).toBe('#e8d44d')
    expect(attackAuraColour(throwing('kurapika:downSpecial'))).toBe('#4ee6d6')
  })

  it('falls back to the fighter’s aura for an unlisted move', () => {
    expect(attackAuraColour(throwing('kurapika:backSpecial'))).toBe(fighterAuraColour('kurapika'))
    expect(attackAuraColour({ id: 'kurapika', attack: null })).toBe(fighterAuraColour('kurapika'))
  })

  it('cites a source for every technique colour', () => {
    for (const aura of Object.values(TECHNIQUE_AURA_COLOURS)) {
      expect(aura.source.length).toBeGreaterThan(0)
      expect(aura.colour).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})
