import { describe, expect, it } from 'vitest'
import abilityCatalog from '../../../../../data/abilities/abilities.json'
import { HATSU_PROFILES, HATSU_SITE_IMPACT_BY_KIND, hatsuById, siteImpactFor } from './hatsuRegistry.js'

describe('global Hatsu interaction registry', () => {
  it('provides an interaction for every catalogued Hatsu', () => {
    const missing = abilityCatalog
      .filter((ability) => !hatsuById(ability.id))
      .map((ability) => ability.id)

    expect(missing).toEqual([])
  })

  it('contains no duplicate or orphaned profiles', () => {
    const profileIds = HATSU_PROFILES.map((profile) => profile.id)
    const abilityIds = new Set(abilityCatalog.map((ability) => ability.id))

    expect(new Set(profileIds).size).toBe(profileIds.length)
    expect(profileIds.filter((id) => !abilityIds.has(id))).toEqual([])
  })

  it('documents a gesture, rule, cost and site action for every interaction', () => {
    for (const profile of HATSU_PROFILES) {
      expect(profile.instruction.length).toBeGreaterThan(20)
      expect(profile.rule.length).toBeGreaterThan(20)
      expect(profile.cost.length).toBeGreaterThan(3)
      expect(profile.action.length).toBeGreaterThan(3)
    }
  })

  it('requires a non-visual functional site impact for every Hatsu', () => {
    const allowedImpacts = new Set([
      'navigation', 'map-state', 'control', 'content-access',
      'layout', 'storage', 'data-revelation', 'simulation-state'
    ])

    for (const profile of HATSU_PROFILES) {
      expect(siteImpactFor(profile), profile.id).toBeTruthy()
      expect(allowedImpacts.has(siteImpactFor(profile)), profile.id).toBe(true)
    }
    expect(Object.keys(HATSU_SITE_IMPACT_BY_KIND)).toHaveLength(HATSU_PROFILES.length)
  })
})
