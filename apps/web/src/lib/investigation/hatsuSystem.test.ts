import { describe, expect, it } from 'vitest'
import { HATSU_PROFILES } from '$lib/nen/hatsuRegistry'
import { elevenSecondsDefinition } from './cases/elevenSeconds'
import { resolveInvestigationHatsu } from './hatsuSystem'

const profile = (id: string) => HATSU_PROFILES.find((item) => item.id === id)!
const rules = elevenSecondsDefinition('fr').hatsuRules

describe('investigation V3 systemic Hatsu', () => {
  it('resolves effects entirely from case rules', () => {
    const result = resolveInvestigationHatsu(profile('dowsing-chain'), {
      subjectId: 'bill',
      rules,
      context: { availableEvidenceIds: [] },
    })
    expect(result.ruleId).toBe('dowsing-witnesses')
    expect(result.evidenceIds).toEqual(['bill-testimony', 'loberry-vision'])
    expect(result.tone).toBe('success')
  })

  it('enforces costs before revealing evidence', () => {
    const result = resolveInvestigationHatsu(profile('emperor-time'), {
      subjectId: 'body',
      rules,
      context: { availableEvidenceIds: [], remainingLifeHours: 2 },
    })
    expect(result.usable).toBe(false)
    expect(result.evidenceIds).toEqual([])
    expect(result.title).toBe('Cost unaffordable')
  })

  it('spends aura and respects evidence-backed countermeasures', () => {
    const costly = resolveInvestigationHatsu(profile('dowsing-chain'), {
      subjectId: 'bill',
      rules,
      context: { availableEvidenceIds: [], remainingAura: 7 },
    })
    expect(costly.usable).toBe(false)
    expect(costly.auraCost).toBe(0)

    const countered = resolveInvestigationHatsu(profile('little-eye'), {
      subjectId: 'loberry',
      rules,
      context: { availableEvidenceIds: ['death-window'], remainingAura: 100 },
    })
    expect(countered.countered).toBe(true)
    expect(countered.usable).toBe(false)
  })

  it('returns an explicit limitation for an unsupported target', () => {
    const result = resolveInvestigationHatsu(profile('little-eye'), {
      subjectId: 'bill',
      rules,
      context: { availableEvidenceIds: [] },
    })
    expect(result.ruleId).toBeNull()
    expect(result.usable).toBe(false)
  })
})
