import { describe, expect, it } from 'vitest'
import { livingPortraitPose, livingPortraitTierLabel } from './livingPortraitPose'

describe('livingPortraitPose', () => {
  it('produces distinct calm, strained, and critical facial poses for expressive fighters', () => {
    const calm = livingPortraitPose('hisoka', 'calm')
    const strained = livingPortraitPose('hisoka', 'strained')
    const critical = livingPortraitPose('hisoka', 'critical')

    expect(calm.pain).toBe(0)
    expect(strained.effort).toBeGreaterThan(calm.effort)
    expect(critical.pain).toBeGreaterThan(strained.pain)
    expect(critical.smile).toBeLessThanOrEqual(calm.smile)
  })

  it('returns localized coarse vitality labels at Level 1+ and null at Level 0', () => {
    expect(livingPortraitTierLabel({ tier: null, language: 'fr' })).toBeNull()
    expect(livingPortraitTierLabel({ tier: 'intact', language: 'fr' })).toBe('Intact')
    expect(livingPortraitTierLabel({ tier: 'scratched', language: 'fr' })).toBe('Entamé')
    expect(livingPortraitTierLabel({ tier: 'wounded', language: 'fr' })).toBe('Éprouvé')
    expect(livingPortraitTierLabel({ tier: 'critical', language: 'fr' })).toBe('Critique')
    expect(livingPortraitTierLabel({ tier: 'wounded', language: 'en' })).toBe('Wounded')
  })
})
