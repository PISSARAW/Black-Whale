import { describe, expect, it } from 'vitest'
import type { WorldSnapshot } from '@black-whale/canon-engine'
import { applySpoilerFilters } from './spoilerWorld'

/**
 * Gon is revealed. Kite is not, and wears Gon's face on the body `b-7f3a`.
 * Pariston is not revealed at all, and his mind sits in Gon's body.
 */
function world(): WorldSnapshot {
  return {
    atEventId: 'e1',
    characters: [
      { id: 'gon', canonicalName: 'Gon' },
      { id: 'kite', canonicalName: 'Kite' },
      { id: 'pariston', canonicalName: 'Pariston' },
    ],
    bodies: [
      { id: 'b-gon', originalCharacterId: 'gon', label: "Gon's body" },
      { id: 'b-7f3a', originalCharacterId: 'kite', label: "Kite's body" },
      { id: 'b-pariston', originalCharacterId: 'pariston', label: "Pariston's body" },
    ],
    consciousnesses: [
      { id: 'c-gon', originCharacterId: 'gon', label: 'Gon' },
      { id: 'c-pariston', originCharacterId: 'pariston', label: 'Pariston' },
    ],
    presences: [
      { id: 'p1', entityId: 'b-gon', locationId: 'l1' },
      { id: 'p2', entityId: 'b-7f3a', locationId: 'l2' },
      { id: 'p3', entityId: 'b-pariston', locationId: 'l3' },
    ],
    occupancies: [
      { id: 'o1', bodyId: 'b-gon', consciousnessId: 'c-pariston' },
      { id: 'o2', bodyId: 'b-pariston', consciousnessId: 'c-gon' },
    ],
    appearances: [
      { id: 'a1', entityId: 'b-7f3a', appearanceCharacterId: 'gon' },
      { id: 'a2', entityId: 'b-gon', appearanceCharacterId: 'pariston' },
    ],
    bodyStates: { 'b-gon': 'ALIVE', 'b-7f3a': 'ALIVE', 'b-pariston': 'DEAD' },
    locations: [],
    activeAbilities: [],
    knownFacts: [],
  } as unknown as WorldSnapshot
}

const ids = (rows: { id: string }[]) => rows.map((row) => row.id)

describe('applySpoilerFilters', () => {
  const capped = applySpoilerFilters(world(), new Set(['gon']))

  it('keeps only revealed characters', () => {
    expect(ids(capped.characters)).toEqual(['gon'])
  })

  it('sends no body, presence or state of an unrevealed character', () => {
    expect(ids(capped.bodies)).toEqual(['b-gon', 'b-7f3a'])
    expect(capped.presences.map((presence) => presence.entityId)).toEqual(['b-gon', 'b-7f3a'])
    expect(Object.keys(capped.bodyStates)).toEqual(['b-gon', 'b-7f3a'])
  })

  it('keeps a body that wears a revealed face, stripped of its hidden owner', () => {
    const kiteBody = capped.bodies.find((body) => body.id === 'b-7f3a')
    expect(kiteBody?.originalCharacterId).toBeUndefined()
    expect(kiteBody?.label).toBe('')
    expect(JSON.stringify(capped)).not.toMatch(/kite/i)
  })

  it('drops a hidden mind and every occupancy that names it', () => {
    expect(ids(capped.consciousnesses)).toEqual(['c-gon'])
    expect(capped.occupancies).toEqual([])
  })

  it('drops an appearance of an unrevealed character', () => {
    expect(capped.appearances.map((appearance) => appearance.entityId)).toEqual(['b-7f3a'])
    expect(JSON.stringify(capped)).not.toMatch(/pariston/i)
  })

  it('leaves the identity records whole when the reader has no cap', () => {
    const full = applySpoilerFilters(world(), null)
    expect(ids(full.bodies)).toHaveLength(3)
    expect(ids(full.consciousnesses)).toHaveLength(2)
    expect(full.occupancies).toHaveLength(2)
    expect(full.appearances).toHaveLength(2)
    expect(full.presences).toHaveLength(3)
  })
})
