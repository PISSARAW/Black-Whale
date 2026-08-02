import { describe, expect, it } from 'vitest'
import { HATSU_PROFILES } from '$lib/nen/hatsuRegistry'
import { investigationHatsuUse } from './hatsu'

const profile = (id: string) => HATSU_PROFILES.find((item) => item.id === id)!

describe('investigation Hatsu', () => {
  it('uses Dowsing Chain to corroborate without granting omniscience', () => {
    const use = investigationHatsuUse(profile('dowsing-chain'), 'loberry')
    expect(use.evidenceIds).toEqual(['loberry-vision'])
    expect(use.finding).toContain('ne détecte pas de mensonge volontaire')
  })

  it('charges Emperor Time for the complete Nen analysis', () => {
    const use = investigationHatsuUse(profile('emperor-time'), 'body')
    expect(use.lifeHours).toBe(3)
    expect(use.evidenceIds).toEqual(['death-window', 'nen-residue'])
  })

  it('does not let surveillance rewrite the past', () => {
    const use = investigationHatsuUse(profile('little-eye'), 'loberry')
    expect(use.tone).toBe('limited')
    expect(use.evidenceIds).toHaveLength(0)
  })
})
