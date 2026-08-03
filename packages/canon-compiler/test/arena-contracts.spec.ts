import { describe, expect, it } from 'vitest'
import { abilityModules } from '@black-whale/ability-modules'
import type { AbilityArenaContract, NenAbilityModule } from '@black-whale/nen-engine'
import { compileArenaContracts } from '../src/arena/contracts'
import { loadCatalogue } from '../src/catalogue'

/**
 * The arena used to keep its own table of costs and conditions beside modules
 * that already enforced them. The compiler is what makes the two one thing, so
 * it is shown here compiling the real twenty-eight and refusing the two ways a
 * contract can be meaningless: one nothing can select, and one that repeats a
 * tactic the roster already has.
 */

const CATALOGUE = loadCatalogue()

const CONTRACT: AbilityArenaContract = {
  effect: 'bind',
  cost: 18,
  persistent: true,
  condition: 'anchor-or-contact',
  risk: 'tether-counterforce',
}

function fakeModule(
  id: string,
  overrides: Partial<NenAbilityModule['manifest']> = {},
): NenAbilityModule {
  const ability = CATALOGUE.abilities.find((entry) => entry.id === id)
  if (!ability) throw new Error(`no such ability in data/: ${id}`)
  return {
    manifest: {
      id,
      name: ability.name,
      ownerId: ability.ownerId ?? '',
      category: ability.category,
      version: '0.0.1',
      site: {
        kind: 'elastic',
        instruction: 'Point at something.',
        rule: 'It stops at ten metres.',
        cost: 'Aura',
        color: '#ffffff',
        action: 'Attach',
      },
      arena: CONTRACT,
      ...overrides,
    },
  } as NenAbilityModule
}

function compile(modules: NenAbilityModule[]) {
  const wanted = new Set(modules.map((module) => module.manifest.id))
  return compileArenaContracts({
    catalogue: { abilities: CATALOGUE.abilities.filter((ability) => wanted.has(ability.id)) },
    modules,
  })
}

describe('compiling the arena contracts', () => {
  it('joins the module contract to the id the arena selects it by', () => {
    const { contracts, problems } = compile([fakeModule('bungee-gum')])

    expect(problems).toEqual([])
    expect(contracts).toEqual([{ id: 'bungee-gum', ...CONTRACT }])
  })

  it('ignores an ability that declares no arena contract: most never duel', () => {
    const { contracts, problems } = compile([fakeModule('bungee-gum', { arena: undefined })])

    expect(problems).toEqual([])
    expect(contracts).toEqual([])
  })

  it('refuses a contract on an ability the site cannot present', () => {
    const { problems } = compile([fakeModule('bungee-gum', { site: undefined })])

    expect(problems).toEqual([
      'bungee-gum: declares an `arena` block but no `site` block, so nothing can select it',
    ])
  })

  it('refuses two abilities bringing the same mechanic to the roster', () => {
    const withMechanic = { ...CONTRACT, mechanic: 'theft' } as const
    const { contracts, problems } = compile([
      fakeModule('bungee-gum', { arena: withMechanic }),
      fakeModule('emperor-time', { arena: withMechanic }),
    ])

    expect(contracts.map((contract) => contract.id)).toEqual(['bungee-gum'])
    expect(problems).toEqual([
      'emperor-time: mechanic "theft" is already bungee-gum\'s — the roster individualises them',
    ])
  })

  it('compiles the contracts the repository actually ships', () => {
    const { contracts, problems } = compileArenaContracts({
      modules: abilityModules,
      catalogue: CATALOGUE,
    })

    expect(problems).toEqual([])
    expect(contracts).toHaveLength(28)
    // Twenty-four individualised tactics, and the four the mode inherited from
    // the earlier arcs, which bring none.
    expect(contracts.filter((contract) => contract.mechanic)).toHaveLength(24)
    // The order a fighter sees is the catalogue's order, as in the registry.
    const catalogueOrder = CATALOGUE.abilities.map((ability) => ability.id)
    expect(contracts.map((contract) => contract.id)).toEqual(
      catalogueOrder.filter((id) => contracts.some((contract) => contract.id === id)),
    )
  })
})
