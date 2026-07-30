import { describe, expect, it } from 'vitest'
import { buildShip, ceilingOf } from './blueprint'
import {
  NAMED_UP_TO,
  describeSpace,
  exitsFrom,
  extentOf,
  solidsIn,
  type RoomWords,
} from './describe'
import { placeOf, type Naming } from './search'
import type { StructureKind } from './types'

const ship = buildShip()

const naming: Naming = {
  nameOf: (entity) => entity.name,
  sourceOf: (entity) => entity.source,
  insideOf: (room) => `inside ${room}`,
}

/** Every kind said as "<count> <kind>", which is enough to assert against. */
const solids = Object.fromEntries(
  (
    [
      'spring',
      'casket',
      'platform',
      'counter',
      'table',
      'bed',
      'seat',
      'cabinet',
      'basin',
      'painting',
      'window',
      'lifeboat',
      'pillar',
      'bars',
      'manacle',
      'camera',
      'telephone',
      'duct',
    ] as StructureKind[]
  ).map((kind) => [kind, (count: number) => `${count} ${kind}`]),
) as RoomWords['solids']

const words: RoomWords = {
  nameOf: naming.nameOf,
  placeOf: (space) => placeOf(ship, space, naming),
  size: (long, wide, ceiling) => `${long} × ${wide} m under ${ceiling} m`,
  exits: (count) => `${count} exits`,
  solids,
  bare: 'nothing drawn in it',
}

const banquet = ship.spaces.get('tier-1-banquet-hall')!

describe('extentOf', () => {
  it('reads the long and the short side off the footprint', () => {
    const { long, wide } = extentOf(banquet.footprint)
    expect(Math.round(long)).toBe(134)
    expect(Math.round(wide)).toBe(25)
  })

  it('does not care which way round the polygon is wound', () => {
    const reversed = [...banquet.footprint].reverse()
    expect(extentOf(reversed)).toEqual(extentOf(banquet.footprint))
  })
})

describe('exitsFrom', () => {
  it('counts the doorways and links the blueprint actually derives', () => {
    expect(exitsFrom(ship, banquet)).toBe(ship.adjacency.get(banquet.id)!.length)
    expect(exitsFrom(ship, banquet)).toBeGreaterThan(0)
  })
})

describe('solidsIn', () => {
  it('counts a long run rather than naming each of it', () => {
    const tables = solidsIn(ship, banquet).find((tally) => tally.kind === 'table')
    expect(tables).toBeDefined()
    expect(tables!.name).toBeNull()
    expect(tables!.count).toBeGreaterThan(NAMED_UP_TO)
  })

  it('names a short run one by one, because that is what is interesting', () => {
    // The two counters of the supreme court: the banquet hall's own platforms
    // are a long run now that the galleries down both its side walls are in.
    const court = ship.spaces.get('tier-1-supreme-court')!
    const counters = solidsIn(ship, court).filter((tally) => tally.kind === 'counter')
    expect(counters.length).toBe(2)
    expect(counters.every((tally) => tally.name !== null)).toBe(true)
  })

  it('leaves out what is hung clear of head height', () => {
    const hung = ship.structures.find((structure) => structure.base > 2.1)
    if (!hung) return
    const room = ship.spaces.get(hung.spaceId)!
    expect(solidsIn(ship, room).some((tally) => tally.name === hung.id)).toBe(false)
  })
})

describe('describeSpace', () => {
  it('says what a room is, where it is, how big and what is in it', () => {
    const said = describeSpace(ship, banquet, words)
    expect(said.startsWith('Banquet Hall, Tier 1, ')).toBe(true)
    expect(said).toContain('134 × 25 m under 9 m')
    expect(said).toContain(`${exitsFrom(ship, banquet)} exits`)
    expect(said).toContain('72 table')
    expect(said).toContain('Proscenium Pier')
    expect(said.endsWith('.')).toBe(true)
  })

  it('says a bare room is bare rather than listing nothing', () => {
    const empty = ship.blueprint.spaces.find(
      (space) => !ship.structures.some((structure) => structure.spaceId === space.id),
    )!
    expect(describeSpace(ship, empty, words)).toContain('nothing drawn in it')
  })

  it('takes the room’s own ceiling over the level’s default', () => {
    const own = ship.blueprint.spaces.find((space) => space.ceiling !== null)!
    const tier = ship.tiers.find((candidate) => candidate.id === own.tierId)!
    expect(describeSpace(ship, own, words)).toContain(`under ${Math.round(ceilingOf(own, tier))} m`)
  })

  it('places a room inside an interior by the deck the interior stands on', () => {
    const interior = ship.tiers.find((tier) => tier.kind === 'interior')!
    const inside = ship.blueprint.spaces.find((space) => space.tierId === interior.id)!
    expect(describeSpace(ship, inside, words)).toContain('inside')
  })

  it('says every space in the ship without throwing', () => {
    for (const space of ship.blueprint.spaces) {
      expect(describeSpace(ship, space, words).length).toBeGreaterThan(0)
    }
  })
})
