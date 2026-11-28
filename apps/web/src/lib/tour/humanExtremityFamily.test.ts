import { describe, expect, it } from 'vitest'
import type { HumanProfile } from './humanProfiles'
import {
  footFamilyScale,
  handFamilyScale,
  humanExtremityFamily,
  usesSkinnedFeet,
  usesSkinnedHands,
} from './humanExtremityFamily'

function profile(overrides: Partial<HumanProfile>): HumanProfile {
  return {
    build: 'average',
    height: 1,
    shoulders: 1,
    skin: 0,
    hair: 0,
    hairStyle: 'short',
    face: 'round',
    expression: 'neutral',
    jacket: 0,
    trousers: 0,
    shirt: 0,
    accent: 0,
    clothing: 'civilian',
    frame: 'adult',
    signatures: [],
    likeness: 'kurapika',
    ...overrides,
  }
}

describe('roster extremity families', () => {
  it('maps body plans to bounded family scales', () => {
    expect(humanExtremityFamily(profile({ frame: 'child' }))).toBe('child')
    expect(humanExtremityFamily(profile({ build: 'slim' }))).toBe('delicate')
    expect(humanExtremityFamily(profile({ build: 'broad' }))).toBe('broad')
    expect(handFamilyScale('child')[0]).toBeLessThan(handFamilyScale('average')[0])
    expect(footFamilyScale('broad')[0]).toBeGreaterThan(footFamilyScale('average')[0])
  })

  it('keeps anonymous bodies and Franklin finger cannons on their authored geometry', () => {
    expect(usesSkinnedHands(profile({ likeness: null }))).toBe(false)
    expect(usesSkinnedFeet(profile({ likeness: null }))).toBe(false)
    expect(usesSkinnedHands(profile({ likeness: 'franklin-bordeau' }))).toBe(false)
    expect(usesSkinnedFeet(profile({ likeness: 'franklin-bordeau' }))).toBe(true)
  })
})
