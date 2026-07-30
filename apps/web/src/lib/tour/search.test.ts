import { describe, expect, it } from 'vitest'
import { buildShip } from './blueprint'
import {
  filterSpaces,
  findPlaces,
  matchesTerms,
  placeOf,
  searchTerms,
  textOfSpace,
  type Naming,
} from './search'

const ship = buildShip()

const english: Naming = {
  nameOf: (entity) => entity.name,
  sourceOf: (entity) => entity.source,
  insideOf: (room) => `inside ${room}`,
}

const french: Naming = {
  nameOf: (entity) => entity.nameFr,
  sourceOf: (entity) => entity.sourceFr,
  insideOf: (room) => `intérieur de ${room}`,
}

describe('searchTerms', () => {
  it('cuts a query into lowercase terms', () => {
    expect(searchTerms('  Banquet   Hall ')).toEqual(['banquet', 'hall'])
  })

  it('gives nothing for an empty query', () => {
    expect(searchTerms('   ')).toEqual([])
  })
})

describe('matchesTerms', () => {
  it('matches when every term appears, in any order', () => {
    expect(matchesTerms('Banquet Hall, Tier 1', ['1', 'banquet'])).toBe(true)
  })

  it('does not match when one term is missing', () => {
    expect(matchesTerms('Banquet Hall, Tier 1', ['banquet', 'kitchen'])).toBe(false)
  })

  it('matches everything on an empty query', () => {
    expect(matchesTerms('anything at all', [])).toBe(true)
  })
})

describe('placeOf', () => {
  it('gives the deck for a space on a deck', () => {
    const space = ship.blueprint.spaces.find((candidate) => candidate.tierId === 'tier-1')!
    expect(placeOf(ship, space, english)).toBe('Tier 1-A')
  })

  it('gives the deck and the room for a space inside an interior', () => {
    const interior = ship.tiers.find((tier) => tier.kind === 'interior')!
    const space = ship.blueprint.spaces.find((candidate) => candidate.tierId === interior.id)!
    const said = placeOf(ship, space, english)
    expect(said).toContain('inside')
    // The deck, not the interior level, comes first: an interior sits on a deck.
    expect(said.startsWith(interior.name)).toBe(false)
  })
})

describe('filterSpaces', () => {
  const textOf = (space: Parameters<typeof textOfSpace>[1]) => textOfSpace(ship, space, english)

  it('keeps everything when nothing is asked', () => {
    const kept = filterSpaces(ship.blueprint.spaces, { query: '', evidence: 'all' }, textOf)
    expect(kept.length).toBe(ship.blueprint.spaces.length)
  })

  it('narrows to one rank of evidence', () => {
    const kept = filterSpaces(ship.blueprint.spaces, { query: '', evidence: 'inferred' }, textOf)
    expect(kept.length).toBeGreaterThan(0)
    expect(kept.every((space) => space.provenance === 'inferred')).toBe(true)
  })

  it('finds a room by a word of its name', () => {
    const kept = filterSpaces(ship.blueprint.spaces, { query: 'banquet', evidence: 'all' }, textOf)
    expect(kept.some((space) => space.id === 'tier-1-banquet-hall')).toBe(true)
  })

  it('finds a room by its source, which is why the sources page can be searched', () => {
    const source = ship.blueprint.spaces[0].source
    const kept = filterSpaces(ship.blueprint.spaces, { query: source, evidence: 'all' }, textOf)
    expect(kept.length).toBeGreaterThan(0)
  })

  it('answers the same query in French', () => {
    const kept = filterSpaces(
      ship.blueprint.spaces,
      { query: 'banquet', evidence: 'all' },
      (space) => textOfSpace(ship, space, french),
    )
    expect(kept.some((space) => space.id === 'tier-1-banquet-hall')).toBe(true)
  })
})

describe('findPlaces', () => {
  it('offers every space and every interior when nothing is typed', () => {
    const interiors = ship.tiers.filter((tier) => tier.kind === 'interior').length
    const { total } = findPlaces(ship, '', english, 10)
    expect(total).toBe(ship.blueprint.spaces.length + interiors)
  })

  it('caps what it shows without hiding how much matched', () => {
    const { shown, total } = findPlaces(ship, '', english, 10)
    expect(shown.length).toBe(10)
    expect(total).toBeGreaterThan(10)
  })

  it('puts a name that starts with the query first', () => {
    const { shown } = findPlaces(ship, 'banquet', english)
    expect(shown[0].label.toLowerCase().startsWith('banquet')).toBe(true)
  })

  it('finds an interior level in its own right, not only its rooms', () => {
    const interior = ship.tiers.find((tier) => tier.kind === 'interior')!
    const { shown } = findPlaces(ship, interior.name, english, 200)
    const level = shown.find((place) => place.id === `level:${interior.id}`)
    expect(level).toBeDefined()
    // And it is walkable: the level resolves to a room inside itself.
    expect(ship.spaces.get(level!.spaceId)?.tierId).toBe(interior.id)
  })

  it('offers the level before the rooms inside it', () => {
    const interior = ship.tiers.find((tier) => tier.kind === 'interior')!
    const { shown } = findPlaces(ship, interior.name, english, 200)
    const level = shown.findIndex((place) => place.kind === 'level')
    const room = shown.findIndex((place) => place.kind === 'space')
    expect(level).toBeGreaterThanOrEqual(0)
    expect(room).toBeGreaterThan(level)
  })

  it('finds nothing for a name the ship does not hold', () => {
    expect(findPlaces(ship, 'zzzzz nothing', english).total).toBe(0)
  })

  it('reaches a room on a level the walk is not on, which is the whole point', () => {
    const { shown } = findPlaces(ship, 'kitchen', english, 200)
    expect(shown.length).toBeGreaterThan(0)
    const levels = new Set(shown.map((place) => ship.spaces.get(place.spaceId)?.tierId))
    expect(levels.size).toBeGreaterThan(1)
  })
})
