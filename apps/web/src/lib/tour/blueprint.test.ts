import { describe, expect, it } from 'vitest'
import locationCatalog from '../../../../../data/locations/locations.json'
import {
  blueprint,
  buildShip,
  ceilingOf,
  floorOf,
  spaceAt,
  spaceForLocation,
  spawnFacing,
  spawnPoint,
  validateBlueprint,
} from './blueprint'
import {
  blocksTheFloor,
  grilleBars,
  longestSharedWall,
  pointInPolygon,
  polygonArea,
  sealKey,
  structureFootprint,
} from './geometry'
import type { Blueprint, Provenance, Space, Structure, Vec2 } from './types'

const ship = buildShip()

/**
 * Catalogue entries that are not rooms: the ship, the tiers, the zones that
 * hold rooms rather than being one, and the one location that is not aboard.
 * Nothing here is something the visitor walks into.
 */
const CONTAINERS = new Set([
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

  it("gives every prince's room one door, facing the numbered door of its own", () => {
    for (let n = 1; n <= 14; n++) {
      const number = String(1000 + n)
      const doors = boundaryDoors(`apartment-${number}`)
      expect(doors, `room ${number} has ${doors.length} ways in`).toHaveLength(1)

      // Ch. 363 stands the apartments free inside the inner bulkhead: the one
      // door of each is on the face that looks straight at the numbered door
      // assigned to it, with the approach between the two.
      const [door] = doors
      expect([door.a, door.b]).toContain(`tier-1-royal-residential-approach-${number}`)
      expect([door.a, door.b]).toContain(`tier-1-royal-residential-sector-room-${number}`)
    }
  })

  // The double page draws the apartments as fourteen boxes with air on every
  // side of them, not as two terraces: nothing an apartment stands against can
  // be another apartment or the bulkhead, only the ground that is walked.
  it('stands the fourteen apartments free of each other and of the bulkhead', () => {
    const rooms = [...ship.spaces.values()].filter((space) =>
      /^tier-1-royal-residential-sector-room-\d{4}$/.test(space.id),
    )
    expect(rooms).toHaveLength(14)

    for (const room of rooms) {
      const touching = [...ship.spaces.values()].filter(
        (other) =>
          other.id !== room.id &&
          other.tierId === room.tierId &&
          longestSharedWall(room.footprint, other.footprint),
      )
      expect(touching.length, `${room.id} touches nothing at all`).toBeGreaterThan(0)
      for (const other of touching) {
        expect(other.envelope, `${room.id} is built against ${other.id}`).toBe(
          'princes-inner-court',
        )
      }
    }
  })

  // The second bulkhead: the fourteen numbered doors are the only way off the
  // guards' round and into the court the apartments stand in, and each of them
  // opens on one approach and one only — odd to starboard, even to port.
  it('opens the inner bulkhead by its fourteen numbered doors and nothing else', () => {
    const court = (id: string) => ship.spaces.get(id)!.envelope === 'princes-inner-court'
    const fromOutside = [...ship.plans.values()]
      .flatMap((plan) => plan.doorways)
      .filter((door) => court(door.a) !== court(door.b))
      .filter((door) => !door.a.includes('-sector-room-10') && !door.b.includes('-sector-room-10'))

    expect(fromOutside).toHaveLength(14)
    for (let n = 1; n <= 14; n++) {
      const side = n % 2 ? 'starboard' : 'port'
      const numbered = fromOutside.filter((door) =>
        [door.a, door.b].includes(`tier-1-royal-residential-approach-${1000 + n}`),
      )
      expect(numbered, `door n° ${n} is not in the inner bulkhead`).toHaveLength(1)
      expect([numbered[0].a, numbered[0].b]).toContain(`tier-1-royal-residential-corridor-${side}`)
    }
  })

  // The first bulkhead: the round the guards walk runs all the way round the
  // block and stops at the aft wall, so the shared-wall rule opened it onto the
  // aft promenade — a way in that walks past the gate the panels post soldiers on.
  it("lets nothing onto the guards' round but the guarded gate", () => {
    const sector = new Set([
      'tier-1-royal-residential-corridor-port',
      'tier-1-royal-residential-corridor-starboard',
      'tier-1-royal-residential-corridor-aft',
    ])
    const fromOutside = [...ship.plans.values()]
      .flatMap((plan) => plan.doorways)
      .filter((door) => sector.has(door.a) !== sector.has(door.b))
      .filter((door) => !door.a.includes('-approach-10') && !door.b.includes('-approach-10'))

    expect(fromOutside).toHaveLength(2)
    for (const door of fromOutside) {
      expect([door.a, door.b]).toContain('tier-1-princes-quarters-gate')
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

  // The hold abuts a corridor on three sides and the starboard promenade on the
  // fourth, so left to the shared-wall rule it opened four ways. The plan draws
  // one entrance and puts four guard posts and a camera on it; a hold anyone can
  // stroll into off the promenade is not the room that plan describes.
  it('lets the Cha-R warehouse be entered only by its guarded freight door', () => {
    const doors = boundaryDoors('tier-5-warehouse')
    expect(doors, `the hold has ${doors.length} ways in`).toHaveLength(1)

    const [door] = doors
    expect([door.a, door.b]).toContain('tier-5-transverse-corridor')
    expect(door.width).toBeGreaterThanOrEqual(6)
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
    // The nine multi-room plans under $lib/assets/maps/local. The rest of the
    // local plans draw a single room, which the deck already carries.
    for (const slug of [
      'beyond-cell',
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

  // Six rooms the plan names, the entrance hall it draws between them, and the
  // closet it partitions off the staff room — which the `/ship` plan has always
  // drawn and the walk used to leave out.
  it('gives the apartment the eight rooms its plan draws', () => {
    for (let n = 1; n <= 14; n++) {
      const plan = ship.plans.get(`interior-room-${1000 + n}`)!
      expect(plan.spaces).toHaveLength(8)
      expect(plan.spaces.map((space) => space.id)).toContain(
        `tier-1-royal-residential-sector-room-${1000 + n}-servants-wc`,
      )
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

/**
 * A cell is not a room with a door in it. Every detention plan the archive
 * publishes draws the whole front of every cell as bars — and a tour that
 * walls that front in and cuts a three-metre doorway through it draws a store
 * room, whoever is named on the door.
 */
describe('the cells', () => {
  /** Each cell, and the space its bars front onto. */
  const cells: Array<[string, string]> = [
    ['tier-1-vip-jail-cell-first-class', 'tier-1-vip-jail-corridor'],
    ['tier-1-vip-jail-cell-vip', 'tier-1-vip-jail-corridor'],
    ['tier-1-vip-jail-cell-standard', 'tier-1-vip-jail-corridor'],
    ['tier-1-vip-jail-cell-standard-2', 'tier-1-vip-jail-corridor'],
    ['tier-1-vvip-prison-beyond-cell', 'tier-1-vvip-prison-beyond-watch'],
  ]

  it('opens the whole front of every cell, and stands a grille in it', () => {
    for (const [cellId, outside] of cells) {
      const cell = ship.spaces.get(cellId)!
      const plan = ship.plans.get(cell.tierId)!
      const front = longestSharedWall(cell.footprint, ship.spaces.get(outside)!.footprint)!

      const opening = plan.doorways.find(
        (door) => [door.a, door.b].includes(cellId) && [door.a, door.b].includes(outside),
      )
      expect(opening, `${cellId} does not front onto ${outside}`).toBeDefined()
      expect(opening!.width, `${cellId} is fronted in wall`).toBeCloseTo(front.to - front.from, 2)

      const grille = plan.structures.filter(
        (structure) => structure.spaceId === cellId && structure.kind === 'bars',
      )
      expect(grille, `${cellId} has no bars`).toHaveLength(2)
      for (const run of grille) {
        for (const bar of grilleBars(run)) {
          for (const corner of bar) {
            expect(pointInPolygon(corner, cell.footprint), `${run.id} is in a wall`).toBe(true)
          }
        }
      }
    }
  })

  it('holds Beyond Netero behind the bars, and the watch in front of them', () => {
    const inside = ship.structures.filter(
      (structure) => structure.spaceId === 'tier-1-vvip-prison-beyond-cell',
    )
    // What ch. 350 draws in it: the bunk, the urinal, and the manacle he is
    // chained to the wall by — and the side table ch. 359 stands his drink on.
    expect(inside.map((structure) => structure.kind).sort()).toEqual([
      'bars',
      'bars',
      'basin',
      'bed',
      'manacle',
      'table',
    ])

    const watch = ship.structures.filter(
      (structure) => structure.spaceId === 'tier-1-vvip-prison-beyond-watch',
    )
    // Three stations off the plan, and what ch. 359 furnishes the room with:
    // the bench, the low table, the shelving and the wall set by the door.
    expect(watch, 'the Zodiac watch keeps no stations').toHaveLength(7)
  })

  it('leaves nothing but the plan box on the deck itself', () => {
    // The cell is drawn on its own level now, so the deck may only claim what
    // the cross-section claims: a box, and the plan it comes from.
    const box = ship.spaces.get('tier-1-vvip-prison-beyond')!
    expect(box.provenance).toBe('plan')
    expect(ship.structures.filter((structure) => structure.spaceId === box.id)).toEqual([])
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
    const rotunda = ship.spaces.get('tier-1-princes-burial-chamber-rotunda')!
    const standing = inRoom(rotunda.id)
    expect(standing.filter((structure) => structure.id.includes('coffin'))).toHaveLength(14)

    // Every one of them radial, inside the chamber, and clear of its walls.
    for (const coffin of standing) {
      for (const corner of structureFootprint(coffin)) {
        expect(pointInPolygon(corner, rotunda.footprint), `${coffin.id} is in a wall`).toBe(true)
      }
    }
  })

  it('leaves the way into the burial chamber open', () => {
    const way = ship.links.find(
      (link) => link.to === 'tier-1-princes-burial-chamber-rotunda' && link.kind === 'door',
    )
    expect(way, 'the burial chamber cannot be entered').toBeDefined()

    // Step in from where the door puts you: a coffin on that axis would seal
    // the room nothing else can be reached through.
    const arrival = way!.atTo!
    for (const step of [0, 1.5, 3]) {
      const inside: Vec2 = [arrival[0], arrival[1] - step]
      for (const coffin of inRoom('tier-1-princes-burial-chamber-rotunda')) {
        expect(
          pointInPolygon(inside, structureFootprint(coffin)),
          `${coffin.id} blocks the way in`,
        ).toBe(false)
      }
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

  it('collides with everything it draws standing on the floor', () => {
    for (const plan of ship.plans.values()) {
      for (const structure of plan.structures) {
        if (!blocksTheFloor(structure)) continue
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

  it('lets the visitor walk under what hangs over head height', () => {
    // A mezzanine, a theatre box, a curtain across a proscenium: drawn where
    // they hang, and no obstacle on the floor they hang over. Collide with
    // those and the room fences off the very places they are drawn above.
    const hung = [...ship.plans.values()].flatMap((plan) =>
      plan.structures.filter((structure) => !blocksTheFloor(structure)),
    )
    expect(hung.length).toBeGreaterThan(0)

    for (const plan of ship.plans.values()) {
      for (const structure of plan.structures) {
        if (blocksTheFloor(structure)) continue
        expect(
          plan.walls.some((wall) => wall.structureId === structure.id),
          `${structure.id} hangs at ${structure.base} m and is still walked into`,
        ).toBe(false)
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

  /** Two rooms sharing a wall, under a four-metre ceiling. */
  const sandbox = (structures: Structure[]): Blueprint => {
    const room = (id: string, footprint: Vec2[]): Space => ({
      id,
      tierId: 'tier',
      locationId: null,
      name: id,
      nameFr: id,
      category: 'room',
      provenance: 'plan',
      source: 'a source long enough',
      sourceFr: 'une source assez longue',
      ceiling: null,
      envelope: null,
      footprint,
    })

    return {
      meta: { unit: 'metre', scale: '', origin: '', note: '' },
      tiers: [
        {
          id: 'tier',
          kind: 'deck',
          parentSpaceId: null,
          locationId: null,
          name: 'Tier',
          nameFr: 'Pont',
          elevation: 0,
          ceiling: 4,
          provenance: 'plan',
          source: 'a source long enough',
          sourceFr: 'une source assez longue',
          hull: [
            [-20, -20],
            [20, -20],
            [20, 20],
            [-20, 20],
          ],
        },
      ],
      spaces: [
        room('west', [
          [-10, -5],
          [0, -5],
          [0, 5],
          [-10, 5],
        ]),
        room('east', [
          [0, -5],
          [10, -5],
          [10, 5],
          [0, 5],
        ]),
      ],
      links: [],
      seals: [],
      doors: [],
      structures,
    }
  }

  const solid = (overrides: Partial<Structure> = {}): Structure => ({
    id: 'counter',
    spaceId: 'east',
    kind: 'counter',
    name: 'Counter',
    nameFr: 'Comptoir',
    at: [1, 0],
    size: [2, 4],
    rotation: 0,
    base: 0,
    height: 1.1,
    sides: null,
    provenance: 'plan',
    source: 'a source long enough',
    sourceFr: 'une source assez longue',
    ...overrides,
  })

  it('refuses a solid set down in front of a doorway', () => {
    // The room stays connected on paper and shut in practice, which is the
    // failure the rule exists to catch: nothing in the room knows the doorway
    // is there, since it is derived from the shared wall.
    expect(validateBlueprint(sandbox([solid()]))).toContain(
      'structure counter: stands in the doorway west | east',
    )

    // Slid off the axis of the door, the same counter is fine.
    expect(validateBlueprint(sandbox([solid({ at: [2, 2.5] })]))).toEqual([])

    // Hung clear of the head, it is a canopy over the door rather than a wall
    // across it — the same exemption the mezzanine over the casino shops has.
    expect(validateBlueprint(sandbox([solid({ base: 2.4, height: 0.6 })]))).toEqual([])
  })

  // ── The levels within a level ────────────────────────────────────────────
  //
  // A deck is one plane wherever nothing says otherwise, and that is almost
  // everywhere. These are the two exceptions the panels force: a floor drawn at
  // two heights, and a ceiling drawn open over the middle of a room.

  const levelled = (floor: number, lantern?: Space['lantern']) => {
    const source = sandbox([])
    source.spaces[1].floor = floor
    if (lantern) source.spaces[0].lantern = lantern
    return validateBlueprint(source)
  }

  it('takes a step between two floors, and refuses a climb', () => {
    expect(levelled(-0.6)).toEqual([])
    // Past a stride it is a fall dressed as a door: that is what a stair is for.
    expect(levelled(-1.2)).toContain('doorway west | east: 1.2 m is a climb, not a step')
  })

  it('refuses a floor a storey off the deck rather than a step', () => {
    expect(levelled(-4)).toContain('space east: a floor -4 m off the deck is a storey, not a step')
  })

  it('hangs a lantern inside the room it is cut out of, and nowhere else', () => {
    expect(levelled(0, { at: [-5, 0], size: [4, 4], rise: 1 })).toEqual([])
    expect(levelled(0, { at: [-5, 0], size: [4, 4], rise: 0 })).toContain(
      'space west: a lantern rising 0 m is a flat ceiling',
    )
    expect(levelled(0, { at: [-9, 0], size: [6, 4], rise: 1 })).toContain(
      'space west: its lantern hangs outside the room',
    )
  })

  it('holds the two rooms the ship actually draws them in', () => {
    const end = ship.spaces.get('tier-1-banquet-hall-service-end')!
    const tier = ship.tiers.find((candidate) => candidate.id === end.tierId)!
    // The buffet end is a step down, and its ceiling is raised by as much so the
    // ceiling runs level over both halves — which is what the panel draws.
    expect(end.floor).toBeLessThan(0)
    expect(floorOf(end, tier) + ceilingOf(end, tier)).toBeCloseTo(
      floorOf(ship.spaces.get('tier-1-banquet-hall')!, tier) +
        ceilingOf(ship.spaces.get('tier-1-banquet-hall')!, tier),
      5,
    )

    const atrium = ship.spaces.get('tier-3-central-police-station-atrium')!
    expect(atrium.lantern?.rise).toBeGreaterThan(0)
  })

  it('hangs a painting off the floor, and refuses one hung through the ceiling', () => {
    const canvas = (base: number, height: number) =>
      solid({ id: 'canvas', kind: 'painting', at: [2, 2.5], size: [0.2, 1.6], base, height })

    expect(validateBlueprint(sandbox([canvas(1.4, 1.8)]))).toEqual([])
    expect(validateBlueprint(sandbox([canvas(1.4, 3)]))).toContain(
      'structure canvas: goes through the ceiling of east',
    )
    expect(validateBlueprint(sandbox([canvas(-0.5, 1.8)]))).toContain(
      'structure canvas: hangs below the floor',
    )
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
    const containers = CONTAINERS
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

  /**
   * What the reconstruction invented may not lean on evidence.
   *
   * `inferred` means nothing draws it, so an inferred source that cites a
   * chapter or a plan is citing evidence for a space that has none — and the
   * badge and the source then say opposite things about the same room. The
   * rule is checked in both languages and across all four sourced
   * collections, because a claim is a claim wherever it is stored.
   */
  it('never cites a chapter or a plan in anything it calls reconstructed', () => {
    const chapter = /\bch(?:ap)?\.\s*\d/i
    // `plan` reads the same in both languages, which is what makes the rule
    // cheap: an inferred source says what nothing shows, in other words.
    const plan = /\bplans?\b/i
    const claims: string[] = []

    const check = (id: string, source: string, sourceFr: string) => {
      for (const [language, text] of [
        ['en', source],
        ['fr', sourceFr],
      ] as const) {
        if (chapter.test(text)) claims.push(`${id} (${language}) cites a chapter`)
        if (plan.test(text)) claims.push(`${id} (${language}) cites a plan`)
      }
    }

    for (const tier of blueprint.tiers) {
      if (tier.provenance === 'inferred') check(`tier ${tier.id}`, tier.source, tier.sourceFr)
    }
    for (const space of blueprint.spaces) {
      if (space.provenance === 'inferred') check(space.id, space.source, space.sourceFr)
    }
    for (const structure of blueprint.structures) {
      if (structure.provenance === 'inferred') {
        check(`structure ${structure.id}`, structure.source, structure.sourceFr)
      }
    }
    for (const connection of blueprint.links) {
      if (connection.provenance === 'inferred') {
        check(`${connection.from} → ${connection.to}`, connection.source, connection.sourceFr)
      }
    }

    expect(claims).toEqual([])
  })

  /**
   * A bed a plan draws cannot stand in a room no plan draws.
   *
   * The rooms and the solids in them are sourced separately, which is right —
   * a panel furnishes a room the cross-section only boxes. But it runs one way
   * only: evidence for what is *in* a room is evidence the room is there, so a
   * solid better sourced than its room means one of the two badges is wrong.
   * The one exception is a panel standing something in a room a plan draws,
   * which is the ordinary case the split exists for.
   */
  it('never stands a solid on better evidence than the room it stands in', () => {
    const rank: Record<Provenance, number> = { inferred: 0, map: 1, plan: 2, panel: 3 }
    const contradictions: string[] = []

    for (const structure of blueprint.structures) {
      const room = blueprint.spaces.find((space) => space.id === structure.spaceId)!
      if (rank[structure.provenance] <= rank[room.provenance]) continue
      // A panel furnishing a room the plans draw is the split working.
      if (structure.provenance === 'panel' && room.provenance === 'plan') continue
      contradictions.push(
        `${structure.id} is ${structure.provenance} in ${room.id}, which is ${room.provenance}`,
      )
    }

    expect(contradictions).toEqual([])
  })

  /**
   * An interior is the inside of one room, so it is on that room's deck.
   *
   * The elevation is what the crossing between the two is measured from, and a
   * lifeboat filed at sea level while its bay is seventy-two metres up turns
   * stepping through a door into a four-deck fall on the read-out.
   */
  it('stands every interior at the elevation of the deck its room is on', () => {
    for (const tier of blueprint.tiers) {
      if (tier.kind !== 'interior') continue
      const room = blueprint.spaces.find((space) => space.id === tier.parentSpaceId)!
      const deck = blueprint.tiers.find((candidate) => candidate.id === room.tierId)!
      expect(tier.elevation, `${tier.id} is not on the level of ${room.id}`).toBe(deck.elevation)
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

/**
 * `/ship` offers to walk the room it has selected. The offer is only honest if
 * every room the map can select resolves to a space the walk can open at, so
 * the bridge is tested rather than hoped for.
 */
describe('walking there from the map', () => {
  it('finds a space for every location the map can select', () => {
    const dangling = (locationCatalog as Array<{ id: string }>)
      .map((entry) => entry.id)
      .filter((id) => !CONTAINERS.has(id))
      .filter((id) => spaceForLocation(ship, id) === null)
    expect(dangling).toEqual([])
  })

  it('opens at the room on the deck rather than inside its interior', () => {
    // The apartment claims its box on the deck and all seven rooms behind the
    // door. The box is the one you would come to.
    expect(spaceForLocation(ship, 'tier-1-royal-residential-sector-room-1004')?.id).toBe(
      'tier-1-royal-residential-sector-room-1004',
    )
    expect(spaceForLocation(ship, 'tier-5-standard-cabins')?.tierId).toBe('tier-5')
  })

  it('offers nothing for a location the reconstruction does not hold', () => {
    expect(spaceForLocation(ship, 'zodiac-hq')).toBeNull()
    expect(spaceForLocation(ship, null)).toBeNull()
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
