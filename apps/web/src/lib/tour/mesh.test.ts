import { describe, expect, it } from 'vitest'
import { buildShip, ceilingOf } from './blueprint'
import {
  COLUMN_HALF_WIDTH,
  DOOR_HEIGHT,
  PLATE_PITCH,
  columnWalls,
  distanceToBoundary,
  grilleBars,
  pointInPolygon,
  structureFootprint,
  toClockwise,
} from './geometry'
import { PATCH, buildSolidMesh, buildTierMesh, colourFor, type TierMesh } from './mesh'
import type { Vec2 } from './types'

const ship = buildShip()

/**
 * The reveal repaints the ship; it must never rebuild it. A visitor who turns
 * the evidence on has to be looking at the same walls, in the same places, or
 * the overlay has stopped being an overlay and become a second reconstruction.
 */
describe('the reveal', () => {
  it('changes what every level says and not one triangle of it', () => {
    for (const [tierId, plan] of ship.plans) {
      const plain = buildTierMesh(plan)
      const shown = buildTierMesh(plan, { reveal: true })

      expect(shown.triangles, `${tierId} was rebuilt`).toBe(plain.triangles)
      expect([...shown.positions], `${tierId} moved`).toEqual([...plain.positions])
      expect([...shown.edges], `${tierId} was redrawn`).toEqual([...plain.edges])
      expect(shown.groups.map((group) => group.spaceId)).toEqual(
        plain.groups.map((group) => group.spaceId),
      )
      // Only the colours, and on any level worth revealing they do differ.
      if (plan.spaces.length > 1) {
        expect([...shown.colors], `${tierId} says the same thing revealed`).not.toEqual([
          ...plain.colors,
        ])
      }
    }
  })

  it('paints the walls a seal keeps blind, on the levels that have them', () => {
    // 0xef3340 through the same sRGB transfer the mesh applies to every colour.
    const toLinear = (channel: number) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    const blind = [0xef, 0x33, 0x40].map((channel) => toLinear(channel / 255))

    const sealed = [...ship.plans.values()].filter((plan) => plan.blind.length > 0)
    expect(sealed.length, 'no level declares a blind wall').toBeGreaterThan(0)

    for (const plan of sealed) {
      const colors = buildTierMesh(plan, { reveal: true }).colors
      let found = false
      for (let i = 0; i < colors.length; i += 3) {
        if (
          Math.abs(colors[i] - blind[0]) < 1e-6 &&
          Math.abs(colors[i + 1] - blind[1]) < 1e-6 &&
          Math.abs(colors[i + 2] - blind[2]) < 1e-6
        ) {
          found = true
          break
        }
      }
      expect(found, `${plan.tier.id} declares a blind wall and does not show it`).toBe(true)
    }
  })
})

describe('buildTierMesh', () => {
  it('builds a mesh for every deck', () => {
    for (const [tierId, plan] of ship.plans) {
      const mesh = buildTierMesh(plan)
      expect(mesh.triangles, `${tierId} produced no geometry`).toBeGreaterThan(0)
      expect(mesh.positions.length).toBe(mesh.triangles * 9)
      expect(mesh.normals.length).toBe(mesh.positions.length)
      expect(mesh.colors.length).toBe(mesh.positions.length)
    }
  })

  it('never emits a coordinate that is not a number', () => {
    for (const plan of ship.plans.values()) {
      const mesh = buildTierMesh(plan)
      expect(mesh.positions.every(Number.isFinite)).toBe(true)
      expect(mesh.normals.every(Number.isFinite)).toBe(true)
    }
  })

  it('keeps every vertex between the deck floor and its tallest ceiling', () => {
    for (const [tierId, plan] of ship.plans) {
      const mesh = buildTierMesh(plan)
      const tallest = Math.max(...plan.spaces.map((space) => ceilingOf(space, plan.tier)))

      let below = 0
      let above = 0
      for (let i = 1; i < mesh.positions.length; i += 3) {
        const y = mesh.positions[i]
        if (y < plan.tier.elevation - 0.001) below++
        if (y > plan.tier.elevation + tallest + 0.001) above++
      }
      expect(below, `${tierId} has geometry below its floor`).toBe(0)
      expect(above, `${tierId} has geometry above its ceiling`).toBe(0)
    }
  })

  /**
   * The blueprint is hand-edited, and nothing in it is bounded: a room given
   * eight hundred solids, or a grille run the length of a deck, arrives as
   * geometry with no complaint from anywhere. These are the ceilings — set at
   * roughly twice what the ship currently draws, so ordinary additions pass and
   * an order of magnitude does not.
   *
   * They were raised an order of magnitude when the deck started carrying its own
   * baked light: a lattice fine enough to hold a shadow in a corner is what costs
   * this, and `PATCH` in `mesh.ts` is the one number that moves it. The ship draws
   * about 289,000 triangles now against 24,000 before, the largest deck 57,000, and
   * a deck is built in about an eighth of a second. What did *not* change is the
   * work per frame: one material, one upload per deck, and `visibleSpaces` drawing
   * only the rooms you can see from where you stand.
   */
  const MAX_DECK_TRIANGLES = 120_000
  const MAX_DECK_BYTES = 13_000_000
  /**
   * One room, which is one draw call and one bounding sphere. The screening room
   * — 3,600 m² of deck under a lattice two metres across — is the largest at
   * about 8,300.
   */
  const MAX_ROOM_TRIANGLES = 20_000

  it('keeps every deck within the budget the walk is built for', () => {
    for (const [tierId, plan] of ship.plans) {
      const mesh = buildTierMesh(plan)
      const bytes =
        mesh.positions.byteLength +
        mesh.normals.byteLength +
        mesh.colors.byteLength +
        mesh.edges.byteLength

      expect(mesh.triangles, `${tierId} extrudes too much`).toBeLessThanOrEqual(MAX_DECK_TRIANGLES)
      expect(bytes, `${tierId} is too many bytes of buffer`).toBeLessThanOrEqual(MAX_DECK_BYTES)

      for (const group of mesh.groups) {
        expect(
          group.count / 3,
          `${group.spaceId} is too much geometry for one room`,
        ).toBeLessThanOrEqual(MAX_ROOM_TRIANGLES)
      }
    }
  })

  it('cuts every deck into rooms that tile its buffers exactly', () => {
    for (const [tierId, plan] of ship.plans) {
      const mesh = buildTierMesh(plan)
      const ids = new Set(plan.spaces.map((space) => space.id))

      let vertices = 0
      let edgePoints = 0
      for (const group of mesh.groups) {
        expect(ids, `${tierId} groups geometry under an unknown room`).toContain(group.spaceId)
        // Contiguous and in order: a room drawn by a draw range cannot have its
        // triangles scattered through the buffer.
        expect(group.start, `${group.spaceId} does not follow the room before it`).toBe(vertices)
        expect(group.edgeStart).toBe(edgePoints)
        vertices += group.count
        edgePoints += group.edgeCount
      }
      expect(vertices, `${tierId} has geometry belonging to no room`).toBe(
        mesh.positions.length / 3,
      )
      expect(edgePoints).toBe(mesh.edges.length / 3)
    }
  })

  it('measures each room its own bounding sphere rather than the whole deck', () => {
    const plan = ship.plans.get('tier-1')!
    const mesh = buildTierMesh(plan)

    for (const group of mesh.groups) {
      // Every vertex of the room is inside the sphere the renderer culls with.
      for (let i = group.start * 3; i < (group.start + group.count) * 3; i += 3) {
        const distance = Math.hypot(
          mesh.positions[i] - group.centre[0],
          mesh.positions[i + 1] - group.centre[1],
          mesh.positions[i + 2] - group.centre[2],
        )
        expect(
          distance,
          `${group.spaceId} has geometry outside its own sphere`,
        ).toBeLessThanOrEqual(group.radius + 0.001)
      }
    }

    // And no room's sphere is the deck's: a bounding sphere around all of Tier 1
    // is what could not be culled in the first place.
    const deckRadius = Math.max(...mesh.groups.map((group) => group.radius))
    const median = [...mesh.groups.map((group) => group.radius)].sort((a, b) => a - b)[
      Math.floor(mesh.groups.length / 2)
    ]
    expect(median).toBeLessThan(deckRadius / 2)
  })

  it('gives the tallest hall on Tier 1 a ceiling above the corridors', () => {
    const plan = ship.plans.get('tier-1')!
    const mesh = buildTierMesh(plan)
    let highest = -Infinity
    for (let i = 1; i < mesh.positions.length; i += 3)
      highest = Math.max(highest, mesh.positions[i])
    expect(highest).toBeCloseTo(plan.tier.elevation + 9)
  })
})

describe('the solids standing in the rooms', () => {
  it('raises the springs to their own height, not the room floor', () => {
    const plan = ship.plans.get('interior-hull-suspension')!
    const mesh = buildTierMesh(plan)
    const tallest = Math.max(...plan.structures.map((structure) => structure.height))

    let highest = -Infinity
    for (let i = 1; i < mesh.positions.length; i += 3)
      highest = Math.max(highest, mesh.positions[i])
    expect(highest).toBeGreaterThanOrEqual(plan.tier.elevation + tallest)
  })

  it('never extrudes a solid to the ceiling the way it does a wall', () => {
    // The faces of a structure are in `plan.walls` so the visitor collides
    // with them. Drawn by the wall pass as well, a bed would come out as a
    // partition from floor to ceiling — which is what a deck full of
    // furniture looked like before the renderer learned to skip them.
    //
    // A solid drawn as a partition would put geometry at its own corners all the
    // way up: the floor of the room, then its own top, then a run of vertices
    // above that, then the ceiling. So what is looked for is a vertex standing
    // *between* the solid's top and the room's ceiling — the two planes
    // themselves are excluded, because the floor and the ceiling of the room are
    // tessellated for the light bake and their lattice can put a vertex over any
    // point of the deck, including a corner of a coffin.
    for (const plan of ship.plans.values()) {
      if (!plan.structures.length) continue
      const mesh = buildTierMesh(plan)

      for (const structure of plan.structures) {
        const room = plan.spaces.find((space) => space.id === structure.spaceId)!
        const roof = plan.tier.elevation + ceilingOf(room, plan.tier)
        const top =
          plan.tier.elevation +
          Math.min(structure.base + structure.height, ceilingOf(room, plan.tier))

        for (const corner of structureFootprint(structure)) {
          for (let i = 0; i < mesh.positions.length; i += 3) {
            const onCorner =
              Math.abs(mesh.positions[i] - corner[0]) < 0.001 &&
              Math.abs(mesh.positions[i + 2] - corner[1]) < 0.001
            if (!onCorner) continue
            const y = mesh.positions[i + 1]
            if (y >= roof - 0.001) continue
            expect(y, `${structure.id} is drawn as a wall`).toBeLessThanOrEqual(top + 0.001)
          }
        }
      }
    }
  })

  it('draws a run of bars as uprights you can see between', () => {
    const plan = ship.plans.get('interior-beyond-cell')!
    const grille = plan.structures.filter((structure) => structure.kind === 'bars')
    expect(grille.length).toBeGreaterThan(0)

    const asBars = buildTierMesh(plan).triangles
    const asSlabs = buildTierMesh({
      ...plan,
      // The same runs, told they are cabinets: one box each.
      structures: plan.structures.map((structure) =>
        structure.kind === 'bars' ? { ...structure, kind: 'cabinet' as const } : structure,
      ),
    }).triangles

    // What the room draws with no grille in it at all, so the comparison is
    // between the two ways of drawing the runs and not between two rooms.
    const withoutGrille = buildTierMesh({
      ...plan,
      structures: plan.structures.filter((structure) => structure.kind !== 'bars'),
    }).triangles

    // Two boxes against fifty uprights and the rail over them.
    expect(asBars - withoutGrille).toBeGreaterThan((asSlabs - withoutGrille) * 4)
  })

  it('draws more geometry for a room with something in it', () => {
    const withCoffins = buildTierMesh(ship.plans.get('tier-1')!).triangles
    const empty = buildTierMesh({
      ...ship.plans.get('tier-1')!,
      structures: [],
    }).triangles
    expect(withCoffins).toBeGreaterThan(empty)
  })
})

/**
 * Which way every surface faces, now that the deck is drawn `FrontSide`.
 *
 * Under `DoubleSide` this could not be tested and did not need to be: a quad
 * wound backwards was drawn anyway, with its normal flipped for the light, and
 * looked exactly like the quad beside it. Culled to the front it is a hole, so
 * the winding is load-bearing and belongs in a test.
 *
 * Note what is *not* tested here, having been tried and found worthless: that
 * every triangle's centroid nudged along its normal lands inside some room. It
 * passes with every solid on the ship inside out, because a bed's faces turned
 * inward still point into the room the bed stands in. The probe has to be against
 * the outline the surface belongs to, which is what these three do.
 */
describe('which way the surfaces face', () => {
  /** The point 2 cm off the middle of `a`→`b`, along the face's own normal. */
  const probe = (a: Vec2, b: Vec2): Vec2 => {
    const dx = b[0] - a[0]
    const dz = b[1] - a[1]
    const length = Math.hypot(dx, dz) || 1
    return [(a[0] + b[0]) / 2 - (dz / length) * 0.02, (a[1] + b[1]) / 2 + (dx / length) * 0.02]
  }

  it('faces every wall of a room into the room it belongs to', () => {
    const wrong: string[] = []
    for (const plan of ship.plans.values()) {
      const spaces = new Map(plan.spaces.map((space) => [space.id, space]))
      const columns = plan.columns
      for (const wall of plan.walls) {
        if (wall.structureId) continue
        const space = spaces.get(wall.spaceId)
        if (!space) continue
        // A column's four faces come down this same list and want the opposite
        // answer; they are checked below, and told apart by sitting on one.
        const middle: Vec2 = [(wall.start[0] + wall.end[0]) / 2, (wall.start[1] + wall.end[1]) / 2]
        const onAColumn = (columns.get(space.id) ?? []).some(
          (centre) =>
            Math.abs(centre[0] - middle[0]) <= COLUMN_HALF_WIDTH + 1e-6 &&
            Math.abs(centre[1] - middle[1]) <= COLUMN_HALF_WIDTH + 1e-6,
        )
        if (onAColumn) continue
        if (!pointInPolygon(probe(wall.start, wall.end), space.footprint)) wrong.push(space.id)
      }
    }
    // Three of the ship's footprints are written clockwise, and their walls were
    // built inside out until `wallSegments` started walking them the other way.
    expect(wrong, `${wrong.length} walls turn their back on their own room`).toEqual([])
  })

  it('faces a column out at the hall rather than in at itself', () => {
    let faces = 0
    const wrong: string[] = []
    for (const plan of ship.plans.values()) {
      for (const [spaceId, centres] of plan.columns) {
        for (const centre of centres) {
          for (const face of columnWalls(spaceId, centre)) {
            faces++
            const [x, z] = probe(face.start, face.end)
            const inside =
              Math.abs(x - centre[0]) < COLUMN_HALF_WIDTH - 1e-3 &&
              Math.abs(z - centre[1]) < COLUMN_HALF_WIDTH - 1e-3
            if (inside) wrong.push(spaceId)
          }
        }
      }
    }
    expect(faces, 'no level lays a column grid').toBeGreaterThan(0)
    expect(wrong, `${wrong.length} column faces look inward`).toEqual([])
  })

  it('faces every side of a solid away from the solid, and caps it upward', () => {
    const inward: string[] = []
    let sides = 0
    let capped = 0

    for (const plan of ship.plans.values()) {
      const spaces = new Map(plan.spaces.map((space) => [space.id, space]))
      for (const structure of plan.structures) {
        const room = spaces.get(structure.spaceId)
        if (!room) continue
        // A run of bars is a row of uprights inside one outline, so each upright
        // is probed against itself: 2 cm out of a 6 cm bar is still inside the
        // 14 cm run, and probing against the run would clear a backwards bar.
        const outlines =
          structure.kind === 'bars'
            ? grilleBars(structure).map(toClockwise)
            : [toClockwise(structureFootprint(structure))]

        const mesh = buildSolidMesh(structure, room, plan.tier)
        for (let i = 0; i < mesh.positions.length; i += 9) {
          const x =
            (mesh.positions[i] + mesh.positions[i + 3] + mesh.positions[i + 6]) / 3 +
            mesh.normals[i] * 0.02
          const z =
            (mesh.positions[i + 2] + mesh.positions[i + 5] + mesh.positions[i + 8]) / 3 +
            mesh.normals[i + 2] * 0.02

          if (Math.abs(mesh.normals[i + 1]) < 1e-6) {
            sides++
            // Outside every one of its own outlines: the rail over a grille is
            // drawn from the run, the uprights under it from their own bars.
            if (outlines.every((outline) => pointInPolygon([x, z], outline))) {
              inward.push(structure.id)
            }
          } else if (mesh.normals[i + 1] > 0.9) {
            capped++
          }
        }
      }
    }

    expect(sides, 'no solid has a side').toBeGreaterThan(0)
    expect(capped, 'nothing on the ship has a top you can see').toBeGreaterThan(0)
    expect(inward, `${inward.length} solid faces look into the solid`).toEqual([])
  })

  it('gives a lintel a face in both of the rooms it spans', () => {
    // A wall is emitted twice over, once by each of the two rooms that share it,
    // so both of its sides exist without anyone arranging it. A lintel belongs to
    // `door.a` alone, and drawn once it is a hole in the ceiling of `door.b`.
    let checked = 0
    const missing: string[] = []

    for (const plan of ship.plans.values()) {
      const mesh = buildTierMesh(plan)

      for (const door of plan.doorways) {
        const dx = door.end[0] - door.start[0]
        const dz = door.end[1] - door.start[1]
        const length = Math.hypot(dx, dz)
        if (length < 0.5) continue
        // The two faces a lintel over this opening must have, either way round.
        const nx = -dz / length
        const nz = dx / length
        const middle = [(door.start[0] + door.end[0]) / 2, (door.start[1] + door.end[1]) / 2]

        let front = false
        let back = false
        for (let i = 0; i < mesh.positions.length; i += 9) {
          if (Math.abs(mesh.normals[i + 1]) > 1e-6) continue
          const cy = (mesh.positions[i + 1] + mesh.positions[i + 4] + mesh.positions[i + 7]) / 3
          if (cy < DOOR_HEIGHT + plan.tier.elevation) continue
          const cx = (mesh.positions[i] + mesh.positions[i + 3] + mesh.positions[i + 6]) / 3
          const cz = (mesh.positions[i + 2] + mesh.positions[i + 5] + mesh.positions[i + 8]) / 3
          // On the opening's own line, within its own span.
          if (Math.abs((cx - middle[0]) * nx + (cz - middle[1]) * nz) > 0.05) continue
          if (Math.abs((cx - middle[0]) * -nz + (cz - middle[1]) * nx) > length / 2) continue

          const facing = mesh.normals[i] * nx + mesh.normals[i + 2] * nz
          if (facing > 0.99) front = true
          if (facing < -0.99) back = true
        }

        checked++
        if (!(front && back)) missing.push(`${door.a}|${door.b}`)
      }
    }

    expect(checked, 'no opening was checked').toBeGreaterThan(300)
    expect(missing, `${missing.length} openings have a lintel on one side only`).toEqual([])
  })
})

describe('the light baked into the deck', () => {
  const plan = ship.plans.get('tier-1')!
  const mesh = buildTierMesh(plan)

  /** Every vertex of one room's slice of a deck, with what it was shaded to. */
  const brightnessAt = (built: TierMesh, group: { start: number; count: number }) => {
    const values: { x: number; y: number; z: number; shade: number }[] = []
    for (let i = group.start * 3; i < (group.start + group.count) * 3; i += 3) {
      values.push({
        x: built.positions[i],
        y: built.positions[i + 1],
        z: built.positions[i + 2],
        // The three channels are one albedo times one shade, so any of them ranks
        // the vertices the same way. Their sum is the steadiest to read.
        shade: built.colors[i] + built.colors[i + 1] + built.colors[i + 2],
      })
    }
    return values
  }

  it('cuts every surface down to the lattice the bake is sampled on', () => {
    // Vertex to vertex within a triangle, which is what `PATCH` bounds.
    for (let i = 0; i < mesh.positions.length; i += 9) {
      const p = [0, 3, 6].map((offset) => [
        mesh.positions[i + offset],
        mesh.positions[i + offset + 1],
        mesh.positions[i + offset + 2],
      ])
      const edges = [
        Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]),
        Math.hypot(p[2][0] - p[1][0], p[2][1] - p[1][1], p[2][2] - p[1][2]),
        Math.hypot(p[0][0] - p[2][0], p[0][1] - p[2][1], p[0][2] - p[2][2]),
      ]
      const horizontal = p[0][1] === p[1][1] && p[1][1] === p[2][1]
      // The ceiling is deliberately left whole — see `PATCH` — so a horizontal
      // surface is only held to the lattice when it is not up there.
      const roof = plan.tier.elevation + 9
      if (horizontal && p[0][1] > plan.tier.elevation + 0.001) continue
      if (p[0][1] >= roof - 0.001) continue
      expect(Math.max(...edges)).toBeLessThanOrEqual(PATCH * 3)
    }
  })

  it('does not give one room the same value at every one of its vertices', () => {
    // The whole point of the lattice: before it, a floor was two triangles and
    // could only be flat.
    const hall = mesh.groups.find((group) => group.spaceId === 'tier-1-banquet-hall')!
    const shades = brightnessAt(mesh, hall).map((vertex) => vertex.shade)
    expect(Math.max(...shades)).toBeGreaterThan(Math.min(...shades) * 1.5)
  })

  it('darkens the corners of a room against the middle of it', () => {
    const hall = mesh.groups.find((group) => group.spaceId === 'tier-1-banquet-hall')!
    const space = plan.spaces.find((room) => room.id === 'tier-1-banquet-hall')!
    const floor = brightnessAt(mesh, hall).filter(
      (vertex) => Math.abs(vertex.y - plan.tier.elevation) < 0.001,
    )
    expect(floor.length).toBeGreaterThan(100)

    const near = floor.filter(
      (vertex) => distanceToBoundary([vertex.x, vertex.z], space.footprint) < 0.6,
    )
    const open = floor.filter(
      (vertex) => distanceToBoundary([vertex.x, vertex.z], space.footprint) > 4,
    )
    const mean = (values: { shade: number }[]) =>
      values.reduce((sum, vertex) => sum + vertex.shade, 0) / values.length
    expect(near.length).toBeGreaterThan(0)
    expect(open.length).toBeGreaterThan(0)
    expect(mean(near)).toBeLessThan(mean(open))
  })

  it('gives a room the reconstruction invented less light than one it did not', () => {
    // Provenance you can feel by walking rather than read off a legend: the
    // invented parts of the ship are the parts nothing was ever drawn lighting.
    const lit = (id: string, provenance: 'plan' | 'inferred') => {
      const space = plan.spaces.find((room) => room.id === id)
      if (!space) return null
      const single = buildTierMesh({ ...plan, spaces: [{ ...space, provenance }] })
      const floor = brightnessAt(single, {
        start: 0,
        count: single.positions.length / 3,
      }).filter((vertex) => Math.abs(vertex.y - plan.tier.elevation) < 0.001)
      return floor.length ? Math.max(...floor.map((vertex) => vertex.shade)) : null
    }
    // Read off the same room twice, so the comparison is of the light and not of
    // two rooms' albedos — the cold tint `colourFor` adds is a separate claim.
    const id = 'tier-1-banquet-hall'
    const asPlanned = lit(id, 'plan')
    const asInferred = lit(id, 'inferred')
    expect(asPlanned).not.toBeNull()
    expect(asInferred).not.toBeNull()
    expect(asInferred!).toBeLessThan(asPlanned!)
  })

  it('never emits a colour a vertex attribute cannot carry', () => {
    // Counted rather than asserted per float: a deck carries a couple of million
    // of them, and `expect` on each is a minute of test suite for one fact.
    let bad = 0
    for (const value of mesh.colors) {
      if (!Number.isFinite(value) || value < 0 || value > 1) bad++
    }
    expect(bad, 'colours outside the range a vertex attribute carries').toBe(0)
  })
})

describe('the deck plating', () => {
  it('lays a course under every room with a floor', () => {
    const plan = ship.plans.get('tier-1')!
    const mesh = buildTierMesh(plan)
    expect(mesh.seams.length).toBeGreaterThan(0)
    // Six floats to a segment, and every one of them at the deck.
    expect(mesh.seams.length % 6).toBe(0)
    for (let i = 1; i < mesh.seams.length; i += 3) {
      expect(mesh.seams[i]).toBeCloseTo(plan.tier.elevation + 0.03, 5)
    }
  })

  it('cuts the plating into the same rooms as the geometry', () => {
    for (const [tierId, plan] of ship.plans) {
      const mesh = buildTierMesh(plan)
      let points = 0
      for (const group of mesh.groups) {
        expect(group.seamStart, `${group.spaceId} plating is out of order`).toBe(points)
        points += group.seamCount
      }
      expect(points, `${tierId} has plating belonging to no room`).toBe(mesh.seams.length / 3)
    }
  })

  it('passes underfoot about once a stride', () => {
    const plan = ship.plans.get('tier-1')!
    const hall = plan.spaces.find((space) => space.id === 'tier-1-banquet-hall')!
    const mesh = buildTierMesh(plan)
    const group = mesh.groups.find((entry) => entry.spaceId === hall.id)!
    // A 157 m hall, plated both ways at PLATE_PITCH, is a great many courses —
    // and the point of them is that a visitor crossing it counts them.
    expect(group.seamCount / 2).toBeGreaterThan(157 / PLATE_PITCH)
  })
})

describe('colourFor', () => {
  const base = [0.5, 0.5, 0.5] as const

  it('leaves plan-sourced geometry as it is', () => {
    expect(colourFor(base, 'plan')).toEqual([0.5, 0.5, 0.5])
  })

  it('brightens what a panel actually shows', () => {
    expect(colourFor(base, 'panel')[0]).toBeGreaterThan(0.5)
  })

  it('cools down anything the reconstruction invented', () => {
    const inferred = colourFor(base, 'inferred')
    // Cold means the blue channel outweighs the red one.
    expect(inferred[2]).toBeGreaterThan(inferred[0])
  })
})
