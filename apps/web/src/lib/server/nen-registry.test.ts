import { describe, expect, it } from 'vitest'
import { abilityModules } from '@black-whale/ability-modules'
import abilityCatalog from '../../../../../data/abilities/abilities.json'

interface CatalogEntry {
  id: string
  ownerId?: string | null
  moduleKey?: string | null
}

const catalog = abilityCatalog as CatalogEntry[]

describe('ability module registry', () => {
  it('registers exactly the abilities whose moduleKey is filled in', () => {
    const declared = catalog
      .filter((ability) => ability.moduleKey)
      .map((ability) => ability.moduleKey)
      .sort()
    const registered = abilityModules.map((module) => module.manifest.id).sort()
    expect(registered).toEqual(declared)
  })

  it('points every moduleKey at the ability it belongs to', () => {
    const mismatched = catalog
      .filter((ability) => ability.moduleKey && ability.moduleKey !== ability.id)
      .map((ability) => ability.id)
    expect(mismatched).toEqual([])
  })

  it('keeps each module owned by the character the catalogue names', () => {
    const owners = new Map(catalog.map((ability) => [ability.id, ability.ownerId]))
    const wrongOwner = abilityModules
      .filter((module) => owners.get(module.manifest.id) !== module.manifest.ownerId)
      .map((module) => module.manifest.id)
    expect(wrongOwner).toEqual([])
  })

  it('does not register the same ability twice', () => {
    const ids = abilityModules.map((module) => module.manifest.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
