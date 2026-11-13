import { describe, expect, it } from 'vitest'
import { ABILITY_COMPONENTS, componentFor } from './abilityComponents'
import { ABILITY_PRESENTATIONS } from './abilityPresentations.gen'

/** The exhaustive keys the modules publish through `getUIComponent`. */
const declared = ABILITY_PRESENTATIONS.map(({ abilityId, componentKey }) => ({
  id: abilityId,
  key: componentKey,
}))

describe('the map from a componentKey to the thing that draws it', () => {
  it('resolves all seventy declared composed views, and nothing else', () => {
    expect(Object.keys(ABILITY_COMPONENTS)).toHaveLength(70)
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
    const asked = new Set(declared.map(({ key }) => key))
    for (const key of Object.keys(ABILITY_COMPONENTS)) {
      expect(asked.has(key), `nothing declares ${key}`).toBe(true)
    }
  })

  it('draws Contagion with the view its manifest names', () => {
    const contagion = declared.find((entry) => entry.id === 'contagion')!
    expect(contagion.key).toBe('ContagionDashboard')
    expect(componentFor(contagion.key)).toBeTruthy()
  })

  it('leaves no declared view unresolved', () => {
    expect(declared.filter(({ key }) => componentFor(key) === null)).toEqual([])
  })

  it('loads every declared view without an eager bundle registry', async () => {
    const loaded = await Promise.all(Object.values(ABILITY_COMPONENTS).map((load) => load()))
    expect(loaded.every(({ default: view }) => Boolean(view))).toBe(true)
  }, 15_000)
})
