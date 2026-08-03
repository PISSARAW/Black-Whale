import { describe, expect, it } from 'vitest'
import characterCatalog from '../../../../../../data/characters/characters.json'
import { dressedRoles, wardrobeFor } from './wardrobe'

interface CatalogueEntry {
  id: string
  shipLocation?: { role?: string } | null
  mapTrajectory?: unknown[]
}

const characters = characterCatalog as CatalogueEntry[]

describe('the wardrobe', () => {
  /**
   * The invariant ADR-003 asks for, and the reason the table is closed: a role
   * the catalogue gains and the table has not heard of is a build failure here
   * rather than a body the walk quietly refuses to draw.
   */
  it('dresses every role the catalogue uses', () => {
    const undressed = characters
      .filter((character) => (character.mapTrajectory ?? []).length > 0)
      .map((character) => character.shipLocation?.role ?? '')
      .filter((role) => !wardrobeFor(role))
    expect([...new Set(undressed)]).toEqual([])
  })

  /** And the other way: a costume for a role nobody holds is dead weight. */
  it('holds no costume the catalogue has no use for', () => {
    const held = new Set(characters.map((character) => character.shipLocation?.role ?? ''))
    expect(dressedRoles().filter((role) => !held.has(role))).toEqual([])
  })

  it('refuses a role it has never been told about', () => {
    expect(wardrobeFor('ship rat')).toBe(null)
    expect(wardrobeFor('')).toBe(null)
    expect(wardrobeFor(null)).toBe(null)
  })

  it('puts the queens in gowns and the guards in uniform', () => {
    expect(wardrobeFor('kakin royal family')).toEqual({ role: 'witness', dress: 'gown' })
    expect(wardrobeFor('Royal Bodyguard for Prince Woble Hui Guo Rou')).toEqual({ role: 'guard' })
  })
})
