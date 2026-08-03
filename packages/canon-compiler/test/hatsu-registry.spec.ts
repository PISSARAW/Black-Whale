import { describe, expect, it } from 'vitest'
import { abilityModules } from '@black-whale/ability-modules'
import type { NenAbilityModule } from '@black-whale/nen-engine'
import { loadCatalogue } from '../src/catalogue'
import { compileHatsuProfiles } from '../src/hatsu/profiles'

/**
 * The compiler decides on the catalogue and the modules alone, so it can be
 * shown both compiling the real eighty-two and refusing each way the two
 * declarations drift apart. The last test is the one that matters in practice:
 * `data/` and `packages/ability-modules` as they actually stand today.
 */

const CATALOGUE = loadCatalogue()

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
      ...overrides,
    },
  } as NenAbilityModule
}

/**
 * Compiles against the real catalogue narrowed to the abilities under test —
 * otherwise every focused case also reports the eighty-one modules it did not
 * pass, which is right of the compiler and useless to the assertion.
 */
function compile(modules: NenAbilityModule[], ids?: readonly string[]) {
  const wanted = new Set(ids ?? modules.map((module) => module.manifest.id))
  return compileHatsuProfiles({
    modules,
    catalogue: {
      ...CATALOGUE,
      abilities: CATALOGUE.abilities.filter((ability) => wanted.has(ability.id)),
    },
  })
}

describe('compiling the hatsu registry', () => {
  it('joins the catalogue, the owner and the module presentation', () => {
    const { profiles, problems } = compile([fakeModule('bungee-gum')])

    expect(problems).toEqual([])
    expect(profiles).toHaveLength(1)
    expect(profiles[0]).toMatchObject({
      id: 'bungee-gum',
      name: 'Bungee Gum',
      // The catalogue spells the owner out; the registry used to say "Hisoka".
      owner: 'Hisoka Morrow',
      kind: 'elastic',
    })
  })

  it('refuses a module that names the ability differently from the catalogue', () => {
    const { profiles, problems } = compile([fakeModule('bungee-gum', { name: 'Bungy Gum' })])

    expect(profiles).toEqual([])
    expect(problems).toEqual([
      'bungee-gum: the module calls it "Bungy Gum", the catalogue "Bungee Gum"',
    ])
  })

  it('refuses a module that gives the ability to someone else', () => {
    const { problems } = compile([fakeModule('bungee-gum', { ownerId: 'kurapika' })])

    expect(problems).toEqual([
      'bungee-gum: the module gives it to "kurapika", the catalogue to "hisoka"',
    ])
  })

  it('refuses a module with no site block: the site could not cast it', () => {
    const { problems } = compile([fakeModule('bungee-gum', { site: undefined })])

    expect(problems).toEqual([
      'bungee-gum: the module declares no `site` block, so the site cannot cast it',
    ])
  })

  it('refuses two abilities sharing one kind, which renderers switch on', () => {
    const { profiles, problems } = compile([fakeModule('bungee-gum'), fakeModule('emperor-time')])

    expect(profiles.map((profile) => profile.id)).toEqual(['bungee-gum'])
    expect(problems).toEqual([
      'emperor-time: kind "elastic" is already bungee-gum\'s — renderers switch on it',
    ])
  })

  it('reports an ability whose declared module answers to nobody', () => {
    const { problems } = compile([], ['bungee-gum'])

    expect(problems).toContain('bungee-gum: declares a moduleKey but no module answers to it')
  })

  it('compiles every ability the repository actually ships', () => {
    const { profiles, problems } = compileHatsuProfiles({
      modules: abilityModules,
      catalogue: CATALOGUE,
    })

    expect(problems).toEqual([])
    expect(profiles).toHaveLength(CATALOGUE.abilities.length)
    // The order a visitor sees in the picker is the catalogue's order.
    expect(profiles.map((profile) => profile.id)).toEqual(
      CATALOGUE.abilities.map((ability) => ability.id),
    )
  })
})
