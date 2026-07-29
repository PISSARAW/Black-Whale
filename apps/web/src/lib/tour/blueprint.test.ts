import { describe, expect, it } from 'vitest'
import locationCatalog from '../../../../../data/locations/locations.json'
import {
  blueprint,
  buildShip,
  ceilingOf,
  spaceAt,
  spawnFacing,
  spawnPoint,
  validateBlueprint,
} from './blueprint'
import { pointInPolygon, polygonArea, sealKey, structureFootprint } from './geometry'
import type { Vec2 } from './types'

const ship = buildShip()

describe('the ship blueprint', () => {
  it('satisfies every reconstruction invariant', () => {
    // Reported in full: a hand edit to a footprint usually breaks several
    // things at once, and one failure at a time is a slow way to find out.
    expect(validateBlueprint()).toEqual([])
  })

  it('reconstructs all five tiers', () => {
    expect(ship.decks.map((tier) => tier.id)).toEqual([
      'tier-1',
      'tier-2',
      'tier-3',
      'tier-4',
      'tier-5',
    ])
  })

  it('stacks the tiers in the order the cross-section gives them', () => {
    const elevations = ship.decks.map((tier) => tier.elevation)
    expect([...elevations].sort((a, b) => b - a)).toEqual(elevations)
  })

  it('opens at least one doorway on every level that has two rooms to join', () => {
    for (const [tierId, plan] of ship.plans) {
      // A lifeboat is one room: nothing to open onto, and the link that puts
      // it on the ship is what the connectivity check tests instead.
      if (plan.spaces.length < 2) continue
      expect(plan.doorways.length, `${tierId} has no doorway`).toBeGreaterThan(0)
    }
  })

  it('walls in every space it draws', () => {
    for (const [tierId, plan] of ship.plans) {
      expect(plan.walls.length, `${tierId} has no walls`).toBeGreaterThan(plan.spaces.length)
    }
  })
})

describe('party walls and apartment envelopes', () => {
  const declared = new Set(ship.doors.map((door) => sealKey(door.a, door.b)))

  /** Doorways that leave the envelope they start in. */
  const boundaryDoors = (envelope: string) =>
    [...ship.plans.values()].flatMap((plan) =>
      plan.doorways.filter((door) => {
        const a = ship.spaces.get(door.a)!
        const b = ship.spaces.get(door.b)!
        return (
          (a.envelope === envelope) !== (b.envelope === envelope) &&
          (a.envelope === envelope || b.envelope === envelope)
        )
      }),
    )

  it('never opens a wall between two units that nothing declares', () => {
    const undeclared: string[] = []
    for (const plan of ship.plans.values()) {
      for (const door of plan.doorways) {
        const a = ship.spaces.get(door.a)!
        const b = ship.spaces.get(door.b)!
        if (a.envelope === b.envelope) continue
        if (declared.has(sealKey(door.a, door.b))) continue
        undeclared.push(`${door.a} <-> ${door.b}`)
      }
    }
    expect(undeclared).toEqual([])
  })

  it("gives every prince's room on the deck one door, onto the guarded corridor", () => {
    for (let n = 1; n <= 14; n++) {
      const number = String(1000 + n)
      const doors = boundaryDoors(`apartment-${number}`)
      expect(doors, `room ${number} has ${doors.length} ways in`).toHaveLength(1)

      const [door] = doors
      expect([door.a, door.b]).toContain('tier-1-royal-residential-corridor')
      expect([door.a, door.b]).toContain(`tier-1-royal-residential-sector-room-${number}`)
    }
  })

  it("gives every queen's room one door, onto the block corridor", () => {
    for (let n = 1; n <= 8; n++) {
      const doors = boundaryDoors(`queen-room-0${n}`)
      expect(doors, `queen's room 0${n} has ${doors.length} ways in`).toHaveLength(1)
      const [door] = doors
      expect([door.a, door.b]).toContain('tier-1-queens-corridor')
    }
  })
})

describe('interiors', () => {
  const interiors = ship.tiers.filter((tier) => tier.kind === 'interior')

  it('draws an interior for every prince, at its own scale', () => {
    for (let n = 1; n <= 14; n++) {
      expect(interiors.some((tier) => tier.id === `interior-room-${1000 + n}`)).toBe(true)
    }
  })

  it('draws an interior for every room plan that has more than one room', () => {
    // The eight multi-room plans under $lib/assets/maps/local. The rest of the
    // local plans draw a single room, which the deck already carries.
    for (const slug of [
      'vip-detention',
      'soldiers-quarters',
      'justice-bureau',
      'central-hospital',
      'cineplex',
      'cha-r-office',
      'general-cabins',
      'tier3-cabins',
    ]) {
      expect(
        interiors.some((tier) => tier.id === `interior-${slug}`),
        `${slug} has no interior`,
      ).toBe(true)
    }
  })

  it('hangs every interior off a room that exists on a deck', () => {
    for (const tier of interiors) {
      const parent = ship.spaces.get(tier.parentSpaceId!)
      expect(parent, `${tier.id} hangs off nothing`).toBeDefined()
      expect(ship.decks.some((deck) => deck.id === parent!.tierId)).toBe(true)
    }
  })

  it('gives every interior a way in and a way back out', () => {
    for (const tier of interiors) {
      // The room may also have a stairwell in it, so the door is picked by
      // what it joins rather than by being the first link that names the room.
      const link = ship.links.find(
        (candidate) =>
          candidate.kind === 'door' &&
          (candidate.from === tier.parentSpaceId || candidate.to === tier.parentSpaceId),
      )
      expect(link, `${tier.id} cannot be entered`).toBeDefined()
      // Both ends given, since the two sides have different origins.
      expect(link!.atTo).toBeDefined()
    }
  })

  it('gives the apartment the seven rooms its plan draws', () => {
    for (let n = 1; n <= 14; n++) {
      const plan = ship.plans.get(`interior-room-${1000 + n}`)!
      expect(plan.spaces).toHaveLength(7)
    }
  })

  it('is far larger than the box the deck plan reserves for it', () => {
    const onDeck = ship.spaces.get('tier-1-royal-residential-sector-room-1004')!
    const inside = ship.plans
      .get('interior-room-1004')!
      .spaces.reduce((total, space) => total + polygonArea(space.footprint), 0)
    // The point of drawing interiors on their own level at all.
    expect(inside).toBeGreaterThan(polygonArea(onDeck.footprint) * 3)
  })

  it('is entered through the door of the room it belongs to', () => {
    for (let n = 1; n <= 14; n++) {
      const number = String(1000 + n)
      const room = `tier-1-royal-residential-sector-room-${number}`
      const link = ship.links.find((candidate) => candidate.from === room || candidate.to === room)

      expect(link, `room ${number} has no way into its interior`).toBeDefined()
      expect(link!.kind).toBe('door')
      expect(link!.to).toBe(`${room}-entrance`)
      // Its two ends are in different coordinate spaces, so both are given.
      expect(link!.atTo).toBeDefined()
    }
  })

  it('reaches every room of an apartment from its entrance hall', () => {
    for (let n = 1; n <= 14; n++) {
      const number = String(1000 + n)
      const prefix = `tier-1-royal-residential-sector-room-${number}`
      const plan = ship.plans.get(`interior-room-${number}`)!

      const reached = new Set([`${prefix}-entrance`])
      const queue = [`${prefix}-entrance`]
      while (queue.length) {
        for (const next of ship.adjacency.get(queue.shift()!) ?? []) {
          if (reached.has(next) || !next.startsWith(prefix)) continue
          reached.add(next)
          queue.push(next)
        }
      }
      for (const room of plan.spaces) {
        expect(reached.has(room.id), `${room.id} is walled off inside its own apartment`).toBe(true)
      }
    }
  })

  it('keeps the walls the apartment plan draws solid', () => {
    for (let n = 1; n <= 14; n++) {
      const prefix = `tier-1-royal-residential-sector-room-${String(1000 + n)}`
      const neighbours = (id: string) => new Set(ship.adjacency.get(id) ?? [])
      expect(neighbours(`${prefix}-bedroom`).has(`${prefix}-bathroom`)).toBe(false)
      expect(neighbours(`${prefix}-servants`).has(`${prefix}-entrance`)).toBe(false)
      expect(neighbours(`${prefix}-entrance`).has(`${prefix}-kitchen`)).toBe(false)
      expect(neighbours(`${prefix}-living`).has(`${prefix}-bedroom`)).toBe(true)
    }
  })
})

describe('what stands in the rooms', () => {
  const inRoom = (spaceId: string) =>
    ship.structures.filter((structure) => structure.spaceId === spaceId)

  it('stands everything it draws in a room that exists', () => {
    for (const structure of ship.structures) {
      expect(ship.spaces.get(structure.spaceId), `${structure.id} stands nowhere`).toBeDefined()
    }
  })

  it('sets the ring of coffins the burial chamber is drawn as', () => {
    const chamber = ship.spaces.get('tier-1-princes-burial-chamber')!
    const standing = inRoom(chamber.id)
    expect(standing.filter((structure) => structure.id.includes('coffin'))).toHaveLength(14)

    // Every one of them radial, inside the chamber, and clear of its walls.
    for (const coffin of standing) {
      for (const corner of structureFootprint(coffin)) {
        expect(pointInPolygon(corner, chamber.footprint), `${coffin.id} is in a wall`).toBe(true)
      }
    }
  })

  it('leaves the way into the burial chamber open', () => {
    const plan = ship.plans.get('tier-1')!
    const door = plan.doorways.find(
      (candidate) =>
        [candidate.a, candidate.b].includes('tier-1-princes-burial-chamber') &&
        [candidate.a, candidate.b].includes('tier-1-burial-passage'),
    )
    expect(door, 'the burial chamber has no doorway').toBeDefined()

    // Walk in from the threshold: a coffin set on the axis of the door would
    // seal the room the derived doorway says is open.
    const from: Vec2 = [(door!.start[0] + door!.end[0]) / 2, (door!.start[1] + door!.end[1]) / 2]
    const inside: Vec2 = [from[0], from[1] - 4]
    for (const coffin of inRoom('tier-1-princes-burial-chamber')) {
      expect(
        pointInPolygon(inside, structureFootprint(coffin)),
        `${coffin.id} blocks the doorway`,
      ).toBe(false)
    }
  })

  it('carries the springs the hull holds the ship on', () => {
    const springs = inRoom('tier-5-hull-suspension-bay')
    expect(springs.length).toBeGreaterThan(1)
    for (const spring of springs) {
      expect(spring.kind).toBe('spring')
      // Taller than a deck: the reason the bay is a level of its own.
      expect(spring.height).toBeGreaterThan(ship.decks[0].ceiling)
    }
  })

  it('collides with everything it draws', () => {
    for (const plan of ship.plans.values()) {
      for (const structure of plan.structures) {
        const faces = plan.walls.filter((wall) => wall.spaceId === structure.spaceId)
        const outline = structureFootprint(structure)
        for (const corner of outline) {
          expect(
            faces.some(
              (wall) =>
                Math.hypot(wall.start[0] - corner[0], wall.start[1] - corner[1]) < 0.01 ||
                Math.hypot(wall.end[0] - corner[0], wall.end[1] - corner[1]) < 0.01,
            ),
            `${structure.id} can be walked through`,
          ).toBe(true)
        }
      }
    }
  })

  it('never drops the visitor inside a solid', () => {
    for (const plan of ship.plans.values()) {
      for (const space of plan.spaces) {
        const at = spawnPoint(space, plan.structures)
        for (const structure of plan.structures) {
          if (structure.spaceId !== space.id) continue
          expect(
            pointInPolygon(at, structureFootprint(structure)),
            `${space.id} spawns inside ${structure.id}`,
          ).toBe(false)
        }
      }
    }
  })

  it('states every structure source in both languages', () => {
    for (const structure of ship.structures) {
      expect(structure.sourceFr.trim(), `${structure.id} has no French source`).not.toBe('')
      expect(structure.sourceFr, `${structure.id} was not translated`).not.toBe(structure.source)
      expect(structure.nameFr, `${structure.id} was not translated`).not.toBe('')
    }
  })
})

describe('the link back to the catalogue', () => {
  const catalogIds = new Set((locationCatalog as Array<{ id: string }>).map((entry) => entry.id))

  it('only points at locations that exist', () => {
    const dangling = blueprint.spaces
      .filter((space) => space.locationId !== null && !catalogIds.has(space.locationId))
      .map((space) => `${space.id} → ${space.locationId}`)
    expect(dangling).toEqual([])
  })

  it('reconstructs every room the catalogue places aboard the ship', () => {
    // Tiers and the ship itself are containers, not rooms, and Zodiac HQ is
    // not aboard at all — none of them is something the visitor walks into.
    const containers = new Set([
      'black-whale-1',
      'zodiac-hq',
      'tier-1',
      'tier-2',
      'tier-3',
      'tier-4',
      'tier-5',
      'tier-1-queens-living-quarters',
      'tier-1-royal-residential-sector',
      'tier-3-political-ward',
    ])
    const reconstructed = new Set(
      blueprint.spaces.map((space) => space.locationId).filter(Boolean) as string[],
    )
    const missing = (locationCatalog as Array<{ id: string }>)
      .map((entry) => entry.id)
      .filter((id) => !containers.has(id) && !reconstructed.has(id))

    expect(missing).toEqual([])
  })

  it('marks as inferred everything the manga does not show', () => {
    for (const space of blueprint.spaces) {
      if (space.provenance !== 'inferred') continue
      expect(space.source, `${space.id} claims a source it should not have`).not.toMatch(/^Ch\./)
    }
  })

  it('sources every space it does claim as canon', () => {
    for (const space of blueprint.spaces) {
      if (space.provenance === 'inferred') continue
      expect(space.source.length, `${space.id} has no source`).toBeGreaterThan(8)
    }
  })

  // `/tour/sources` publishes these strings as the account of the whole
  // reconstruction. A source left untranslated would read as an English
  // footnote on a French page, which is exactly the sort of unexplained
  // surface the page exists to remove.
  it('states every source and every reason in both languages', () => {
    for (const tier of blueprint.tiers) {
      expect(tier.sourceFr.trim(), `${tier.id} has no French source`).not.toBe('')
      expect(tier.sourceFr, `${tier.id} was not translated`).not.toBe(tier.source)
    }
    for (const space of blueprint.spaces) {
      expect(space.sourceFr.trim(), `${space.id} has no French source`).not.toBe('')
      expect(space.sourceFr, `${space.id} was not translated`).not.toBe(space.source)
    }
    for (const connection of blueprint.links) {
      const id = `${connection.from} → ${connection.to}`
      expect(connection.sourceFr.trim(), `${id} has no French source`).not.toBe('')
      expect(connection.sourceFr, `${id} was not translated`).not.toBe(connection.source)
    }
    for (const wall of [...blueprint.seals, ...blueprint.doors]) {
      const id = `${wall.a} | ${wall.b}`
      expect(wall.reasonFr.trim(), `${id} has no French reason`).not.toBe('')
      expect(wall.reasonFr, `${id} was not translated`).not.toBe(wall.reason)
    }
  })

  // The same source told two ways is two claims to check instead of one.
  it('phrases one source one way, in each language', () => {
    const byEnglish = new Map<string, Set<string>>()
    for (const space of blueprint.spaces) {
      const translations = byEnglish.get(space.source) ?? new Set<string>()
      translations.add(space.sourceFr)
      byEnglish.set(space.source, translations)
    }
    for (const [english, translations] of byEnglish) {
      expect(
        [...translations],
        `"${english}" is translated ${translations.size} ways`,
      ).toHaveLength(1)
    }
  })
})

describe('placing the visitor', () => {
  it('spawns inside the space it was asked for', () => {
    for (const space of blueprint.spaces) {
      const point = spawnPoint(space)
      expect(pointInPolygon(point, space.footprint), `${space.id} spawns outside itself`).toBe(true)
    }
  })

  it('resolves a point back to the space it stands in', () => {
    const plan = ship.plans.get('tier-1')!
    const banquet = ship.spaces.get('tier-1-banquet-hall')!
    expect(spaceAt(plan, spawnPoint(banquet))?.id).toBe('tier-1-banquet-hall')
  })

  it('resolves nothing out beyond the hull', () => {
    expect(spaceAt(ship.plans.get('tier-1')!, [10_000, 10_000])).toBeNull()
  })
})

describe('ceilings', () => {
  it('falls back to the tier when a space does not set one', () => {
    const tier = ship.tiers.find((candidate) => candidate.id === 'tier-1')!
    const corridor = ship.spaces.get('tier-1-main-corridor')!
    expect(corridor.ceiling).toBeNull()
    expect(ceilingOf(corridor, tier)).toBe(tier.ceiling)
  })

  it('lets a hall stand taller than its deck', () => {
    const tier = ship.tiers.find((candidate) => candidate.id === 'tier-1')!
    const banquet = ship.spaces.get('tier-1-banquet-hall')!
    expect(ceilingOf(banquet, tier)).toBeGreaterThan(tier.ceiling)
  })
})

describe('spawnFacing', () => {
  const ship2 = buildShip()

  it('looks down the long axis of a hall, away from the near end', () => {
    const banquet = ship2.spaces.get('tier-1-banquet-hall')!
    const at = spawnPoint(banquet)
    const yaw = spawnFacing(banquet, at)

    // Step forward along the bearing and stay inside the room.
    const ahead: [number, number] = [at[0] - Math.sin(yaw) * 5, at[1] - Math.cos(yaw) * 5]
    expect(pointInPolygon(ahead, banquet.footprint)).toBe(true)
  })

  it('gives a bearing that keeps the visitor inside every space it is asked about', () => {
    for (const space of blueprint.spaces) {
      const at = spawnPoint(space)
      const yaw = spawnFacing(space, at)
      const ahead: [number, number] = [at[0] - Math.sin(yaw) * 0.5, at[1] - Math.cos(yaw) * 0.5]
      expect(pointInPolygon(ahead, space.footprint), `${space.id} faces a wall`).toBe(true)
    }
  })
})
