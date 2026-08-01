import { describe, expect, it } from 'vitest'
import { abilityModules } from '@black-whale/ability-modules'
import { ABILITY_COMPONENTS, componentFor } from './abilityComponents'

/**
 * The keys the modules actually publish, in the shape `getUIComponent` gives
 * them. `defineAbility` invents `${id}-ui` for anything that does not declare
 * one, so most of these are placeholders and are expected to resolve to
 * nothing at all.
 */
const declared = abilityModules.map((module) => ({
  id: module.manifest.id,
  key: module.getUIComponent().componentKey,
  custom: module.getInteractionManifest()?.customComponent ?? null,
}))

describe('the map from a componentKey to the thing that draws it', () => {
  it('resolves every key it holds, and nothing it does not', () => {
    for (const key of Object.keys(ABILITY_COMPONENTS)) {
      expect(componentFor(key), `${key} maps to nothing`).toBeTruthy()
    }
    expect(componentFor('no-such-view')).toBeNull()
    expect(componentFor(null)).toBeNull()
    expect(componentFor(undefined)).toBeNull()
  })

  it('is not holding a key no ability asks for', () => {
    // A view nobody names is a view nobody reaches, which is worse than a
    // missing one: it looks finished and is not wired to anything.
    const asked = new Set(declared.flatMap(({ key, custom }) => [key, custom].filter(Boolean)))
    for (const key of Object.keys(ABILITY_COMPONENTS)) {
      expect(asked.has(key), `nothing declares ${key}`).toBe(true)
    }
  })

  it('draws Contagion, which is the ability that asked first', () => {
    const contagion = declared.find((entry) => entry.id === 'contagion')!
    expect(contagion.key).toBe('ContagionDashboard')
    expect(contagion.custom).toBe('ContagionDashboard')
    expect(componentFor(contagion.key)).toBeTruthy()
  })

  it('leaves every other ability to the generic rendering', () => {
    // Stated rather than assumed: the map is meant to be nearly empty, and a
    // day when it is not is a day somebody should have to change this test.
    const drawn = declared.filter((entry) => componentFor(entry.key) !== null)
    expect(drawn.map((entry) => entry.id)).toEqual(['contagion'])
  })
})
