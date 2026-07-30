import { describe, expect, it } from 'vitest'
import { abilityModules } from '@black-whale/ability-modules'
import abilityCatalog from '../../../../../data/abilities/abilities.json'
import characterCatalog from '../../../../../data/characters/characters.json'

interface CatalogEntry {
  id: string
  ownerId?: string | null
  moduleKey?: string | null
}

const catalog = abilityCatalog as CatalogEntry[]
const characterIds = new Set((characterCatalog as { id: string }[]).map((entry) => entry.id))

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

  it('covers the whole catalogue: every hatsu impacts the site', () => {
    const withoutModule = catalog.filter((ability) => !ability.moduleKey).map((a) => a.id)
    expect(withoutModule).toEqual([])
    expect(abilityModules).toHaveLength(catalog.length)
  })

  it('does not register the same ability twice', () => {
    const ids = abilityModules.map((module) => module.manifest.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  /**
   * `benjamin-aura` and `oito-hatsu` shipped owned by `benjamin-hui-guo-rou` and
   * `oito-hui-guo-rou`, slugs no fiche carries: the module and the catalogue
   * agreed with each other and with nothing else, so both abilities were
   * unreachable from the character page that attaches them by `ownerId`.
   */
  it('names an owner the passenger registry actually holds', () => {
    const unknown = catalog
      .filter((ability) => !ability.ownerId || !characterIds.has(ability.ownerId))
      .map((ability) => `${ability.id} → ${ability.ownerId}`)
    expect(unknown).toEqual([])
  })

  /**
   * The README promises a category, conditions and a cost for every ability, and
   * the plan is where the site reads them. A module with no cost anywhere — not
   * on the ability, not on any of its actions — silently drops the third of
   * those three, so it is a test failure rather than a blank line in the panel.
   */
  it('prices every ability: the plan carries a cost', () => {
    const free = abilityModules
      .filter((module) => {
        const context = {
          abilityId: module.manifest.id,
          actorId: module.manifest.ownerId,
          targets: [],
          eventId: 'nen-registry-test',
        }
        if (module.plan(context).cost) return false
        return module
          .getActionWheel(context)
          .every((entry) => !module.plan({ ...context, actionId: entry.id }).cost)
      })
      .map((module) => module.manifest.id)
    expect(free).toEqual([])
  })
})
