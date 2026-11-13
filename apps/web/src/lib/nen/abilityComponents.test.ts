import { describe, expect, it } from 'vitest'
import { render } from 'svelte/server'
import { readable } from 'svelte/store'
import {
  ABILITY_COMPONENTS,
  ABILITY_VIEW_FAMILIES,
  componentFor,
  familyFor,
} from './abilityComponents'
import { previewViewModel } from './abilityPresentation'
import { ABILITY_PRESENTATIONS } from './abilityPresentations.gen'

/** The exhaustive keys the modules publish through `getUIComponent`. */
const declared = ABILITY_PRESENTATIONS.map(({ abilityId, componentKey }) => ({
  id: abilityId,
  key: componentKey,
}))

const renderContext = new Map([
  [
    '__svelte__',
    {
      page: readable({
        url: new URL('https://black-whale.test/abilities'),
        data: { localizedContent: {} },
      }),
      navigating: readable(null),
      updated: readable(false),
    },
  ],
])

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

  it('assigns one explicit primitive and one loader to every declared key', () => {
    expect(Object.keys(ABILITY_VIEW_FAMILIES)).toEqual(Object.keys(ABILITY_COMPONENTS))
    expect(new Set(Object.values(ABILITY_COMPONENTS)).size).toBe(70)
    for (const { key } of declared) expect(familyFor(key), `${key} has no family`).toBeTruthy()
    expect(familyFor('no-such-view')).toBeNull()
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
    expect(new Set(loaded.map(({ default: view }) => view)).size).toBe(70)
  }, 60_000)

  it('renders every ability from a canonical preview without live state', async () => {
    const firstBodyByKey = new Map<string, string>()
    for (const presentation of ABILITY_PRESENTATIONS) {
      const model = previewViewModel({
        presentation,
        name: presentation.identity.name,
        owner: presentation.identity.ownerId,
      })!
      const { default: view } = await componentFor(presentation.componentKey)!()
      let body = ''
      try {
        body = render(view, { props: { model }, context: renderContext }).body
      } catch (error) {
        throw new Error(`${presentation.componentKey} failed to render`, { cause: error })
      }
      if (!firstBodyByKey.has(presentation.componentKey)) {
        firstBodyByKey.set(presentation.componentKey, body)
      }
    }
    expect(firstBodyByKey.size).toBe(70)
    const composed = [...firstBodyByKey]
      .filter(([key]) => key !== 'ContagionDashboard')
      .map(([, body]) => body)
    expect(composed).toHaveLength(69)
    expect(new Set(composed).size).toBe(69)
  }, 60_000)
})
