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
import { pointInPolygon, polygonArea, sealKey } from './geometry'

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

  it('opens at least one doorway on every deck', () => {
    for (const [tierId, plan] of ship.plans) {
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
    expect(interiors).toHaveLength(14)
    for (let n = 1; n <= 14; n++) {
      expect(interiors.some((tier) => tier.id === `interior-room-${1000 + n}`)).toBe(true)
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
