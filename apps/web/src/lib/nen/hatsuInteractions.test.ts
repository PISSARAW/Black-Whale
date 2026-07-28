import { describe, expect, it } from 'vitest'
import { HATSU_INTERACTION_BY_KIND, HATSU_KINDS_HANDLED_IN_COMPONENT } from './hatsuInteractions.js'
import { HATSU_PROFILES } from './hatsuRegistry.js'

/**
 * The interaction table replaced an `else if (profile.kind === …)` chain whose
 * final `else return false` swallowed any kind nobody had written a branch for.
 * A Hatsu could therefore ship with a documented instruction and do nothing on
 * click. These tests close that hole from both sides: no kind without a home,
 * and no entry for a kind that no profile carries.
 */
describe('Hatsu interaction table', () => {
  const kinds = [...new Set(HATSU_PROFILES.map((profile) => profile.kind))]

  it('routes every registered kind to a handler or to the component', () => {
    const orphaned = kinds.filter(
      (kind) => !HATSU_INTERACTION_BY_KIND[kind] && !HATSU_KINDS_HANDLED_IN_COMPONENT.has(kind),
    )

    expect(orphaned).toEqual([])
  })

  it('never claims a kind in both places', () => {
    const both = kinds.filter(
      (kind) => HATSU_INTERACTION_BY_KIND[kind] && HATSU_KINDS_HANDLED_IN_COMPONENT.has(kind),
    )

    expect(both).toEqual([])
  })

  it('carries no entry for a kind no Hatsu uses', () => {
    const registered = new Set<string>(kinds)
    const dead = Object.keys(HATSU_INTERACTION_BY_KIND).filter((kind) => !registered.has(kind))
    const deadInComponent = [...HATSU_KINDS_HANDLED_IN_COMPONENT].filter(
      (kind) => !registered.has(kind),
    )

    expect(dead).toEqual([])
    expect(deadInComponent).toEqual([])
  })

  it('covers the whole catalogue between the two routes', () => {
    expect(
      Object.keys(HATSU_INTERACTION_BY_KIND).length + HATSU_KINDS_HANDLED_IN_COMPONENT.size,
    ).toBe(kinds.length)
  })
})
