import { describe, expect, it } from 'vitest'
import { buildShip, ceilingOf, floorOf } from './blueprint'
import {
  COLUMN_HALF_WIDTH,
  DOOR_HEIGHT,
  JAMB_DEPTH,
  PLATE_PITCH,
  columnWalls,
  distanceToBoundary,
  doorJambs,
  doorSoffit,
  grilleBars,
  pointInPolygon,
  polygonArea,
  sealKey,
  signedArea,
  structureFootprint,
  toClockwise,
} from './geometry'
import { lamplightOf, lampsOf } from './light'
import { VISITOR_RADIUS } from './navigation'
import {
  HORIZON,
  PATCH,
  SEA_FRACTION,
  SEA_GLOW,
  WINDOW_GLOW,
  WINDOW_REACH,
  WINDOW_SAMPLE,
  buildSolidMesh,
  buildTierMesh,
  colourFor,
  fittingHeight,
  windowSources,
  type MeshGroup,
  type TierMesh,
} from './mesh'
import { REFERENCE_HOUR, skyOf } from './sky'
import type { Structure, Vec2 } from './types'

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
      // Every buffer, not just the two the deck is built from: a NaN in a
      // position is a triangle the driver rasterises to anything it likes, and
      // one in the fittings would be a lamp that fills the screen.
      expect(mesh.edges.every(Number.isFinite)).toBe(true)
      expect(mesh.seams.every(Number.isFinite)).toBe(true)
      expect(mesh.fittings.every(Number.isFinite)).toBe(true)
      expect(mesh.fittingColors.every(Number.isFinite)).toBe(true)
    }
  })

  it('keeps every vertex between the lowest floor and the tallest ceiling', () => {
    for (const [tierId, plan] of ship.plans) {
      const mesh = buildTierMesh(plan)
      // Not the deck's own plane any more: a room a panel draws a step into
      // sits below it, and a lantern lifts a panel of ceiling above the rest.
      const lowest = Math.min(...plan.spaces.map((space) => floorOf(space, plan.tier)))
      const tallest = Math.max(
        ...plan.spaces.map(
          (space) =>
            floorOf(space, plan.tier) + ceilingOf(space, plan.tier) + (space.lantern?.rise ?? 0),
        ),
      )

      let below = 0
      let above = 0
      for (let i = 1; i < mesh.positions.length; i += 3) {
        const y = mesh.positions[i]
        if (y < lowest - 0.001) below++
        if (y > tallest + 0.001) above++
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
        // A doorway's cheek faces across the opening rather than into either room
        // — it is checked on its own terms below.
        if (wall.structureId || wall.jambOf) continue
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

        const mesh = buildSolidMesh(structure, { room, tier: plan.tier })
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

  it('pools the fittings on the floor of a hall too tall to reach across', () => {
    // Read where the room is uniformly open — more than `LIGHT.openReach` from
    // any wall — so the occlusion is flat at 1 and the only thing left that can
    // vary is the lamps. Under a nine-metre ceiling on Tier 1's close grid this
    // used to come out perfectly even, because *every* fitting was cut off
    // before it reached the floor: the banquet hall baked to the bare fill and
    // was among the darkest rooms on the ship. See `lampFalloff`.
    const hall = mesh.groups.find((group) => group.spaceId === 'tier-1-banquet-hall')!
    const space = plan.spaces.find((room) => room.id === 'tier-1-banquet-hall')!
    // The floor itself and not the foot of a wall: a wall vertex stands at the
    // floor's height too, and its crease would supply the variation this test
    // is looking for from the lamps.
    const vertices = brightnessAt(mesh, hall)
    const open: number[] = []
    for (let i = 0; i < vertices.length; i += 3) {
      const triangle = vertices.slice(i, i + 3)
      if (!triangle.every((vertex) => Math.abs(vertex.y - plan.tier.elevation) < 0.001)) continue
      for (const vertex of triangle) {
        if (distanceToBoundary([vertex.x, vertex.z], space.footprint) > 3) open.push(vertex.shade)
      }
    }

    // A shallow margin on purpose: nine metres of ceiling is a weak pool on the
    // floor and ought to be. What is being held to is that there is one — the
    // old bake gave this stretch of floor the same value to the last bit.
    expect(open.length).toBeGreaterThan(100)
    expect(Math.max(...open)).toBeGreaterThan(Math.min(...open) * 1.03)
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
    // Provenance you can feel by walking: an invented room keeps its deck's
    // lamps — the grid is a derivation for every room alike — but its fill is
    // thinner, so the same hall reads a shade dimmer when nothing drew it.
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
    // And no further: provenance may thin the fill, never dock the lamps.
    // `inferredLamps: 0.22` failed this — it baked the King's own inferred
    // corridors three times darker than sourced cabins in the hold, and the
    // class system is the one claim the light must not invert.
    expect(asInferred!, 'provenance reached the lamps').toBeGreaterThan(asPlanned! * 0.8)
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
    // Six floats to a segment, and every one of them on the floor of the room
    // it is clipped to — the deck itself for all but the rooms drawn with a step.
    expect(mesh.seams.length % 6).toBe(0)
    const floors = new Set(
      plan.spaces.map((space) => Number((floorOf(space, plan.tier) + 0.03).toFixed(5))),
    )
    for (let i = 1; i < mesh.seams.length; i += 3) {
      expect(floors.has(Number(mesh.seams[i].toFixed(5)))).toBe(true)
    }
  })

  it('cuts a lantern out of the ceiling and lifts its panel clear', () => {
    const plan = ship.plans.get('interior-police-station')!
    const atrium = plan.spaces.find((space) => space.lantern)!
    const mesh = buildTierMesh(plan)
    const top = floorOf(atrium, plan.tier) + ceilingOf(atrium, plan.tier)
    const group = mesh.groups.find((entry) => entry.spaceId === atrium.id)!

    let border = 0
    let panel = 0
    for (let i = group.start * 3; i < (group.start + group.count) * 3; i += 3) {
      const y = mesh.positions[i + 1]
      if (Math.abs(y - top) < 0.001) border++
      if (Math.abs(y - top - atrium.lantern!.rise) < 0.001) panel++
    }
    // Both, or it is not a lantern: a ceiling with nothing lifted out of it, or
    // a panel floating over a ceiling that was never cut.
    expect(border).toBeGreaterThan(0)
    expect(panel).toBeGreaterThan(0)
  })

  it('draws the riser where one room steps down to the next', () => {
    const plan = ship.plans.get('tier-1')!
    const end = plan.spaces.find((space) => space.id === 'tier-1-banquet-hall-service-end')!
    const mesh = buildTierMesh(plan)
    const lower = floorOf(end, plan.tier)
    const hall = mesh.groups.find((entry) => entry.spaceId === 'tier-1-banquet-hall')!

    // The step is drawn from the higher side, so the hall itself carries the
    // geometry that reaches down to the floor of the room below it.
    let reaches = 0
    for (let i = hall.start * 3; i < (hall.start + hall.count) * 3; i += 3) {
      if (Math.abs(mesh.positions[i + 1] - lower) < 0.001) reaches++
    }
    expect(reaches).toBeGreaterThan(0)
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

/**
 * The depth of an opening, which is the one place on the ship a partition is
 * allowed to have any.
 *
 * The invariant that matters is the repo's own — what stops you is what is drawn.
 * The cheeks live in `plan.walls`, which is what collision reads, and `mesh.ts`
 * raises those very objects rather than recomputing them; so the way to break
 * this is not to draw a cheek in the wrong place but to let one list have a cheek
 * the other does not.
 */
describe('the depth of a doorway', () => {
  it('gives every opening two cheeks, in the list collision reads', () => {
    let doors = 0
    let cheeks = 0
    for (const plan of ship.plans.values()) {
      doors += plan.doorways.length
      const found = new Map<string, number>()
      for (const wall of plan.walls) {
        if (!wall.jambOf) continue
        cheeks++
        found.set(wall.jambOf, (found.get(wall.jambOf) ?? 0) + 1)
      }
      for (const door of plan.doorways) {
        expect(
          found.get(sealKey(door.a, door.b)),
          `${door.a}|${door.b} has no cheeks`,
        ).toBeGreaterThanOrEqual(2)
      }
    }
    expect(doors).toBe(491)
    expect(cheeks).toBe(doors * 2)
  })

  it('faces the cheeks at each other, across the opening', () => {
    for (const plan of ship.plans.values()) {
      for (const door of plan.doorways) {
        const dx = door.end[0] - door.start[0]
        const dz = door.end[1] - door.start[1]
        const length = Math.hypot(dx, dz)
        if (length < 0.5) continue
        // The cheek at `start` must look towards `end`, and the one at `end` back
        // towards `start`: they are what you walk between.
        const [first, second] = doorJambs(door)
        const facing = (cheek: { start: Vec2; end: Vec2 }) => {
          const jx = cheek.end[0] - cheek.start[0]
          const jz = cheek.end[1] - cheek.start[1]
          const j = Math.hypot(jx, jz) || 1
          // The quad's normal, as `MeshBuilder.quad` winds it.
          return [(-jz / j) * (dx / length) + (jx / j) * (dz / length)] as const
        }
        expect(facing(first)[0], 'the near cheek looks out of the opening').toBeCloseTo(1, 6)
        expect(facing(second)[0], 'the far cheek looks out of the opening').toBeCloseTo(-1, 6)
      }
    }
  })

  it('keeps the full width of the opening walkable', () => {
    // The cheeks sit at the ends of the gap rather than inside it, so a doorway
    // stays `DOOR_WIDTH` across — the visitor is 0,8 m and a 1,2 m opening is the
    // narrowest the ship derives.
    for (const plan of ship.plans.values()) {
      for (const door of plan.doorways) {
        const [first, second] = doorJambs(door)
        // The two cheeks are wound against each other so they face across the
        // opening, so it is `first.start` to `second.end` that are the same side
        // of the partition. Pairing them the other way measures the diagonal.
        const gap = Math.min(
          Math.hypot(first.start[0] - second.end[0], first.start[1] - second.end[1]),
          Math.hypot(first.end[0] - second.start[0], first.end[1] - second.start[1]),
        )
        expect(gap, `${door.a}|${door.b} was narrowed`).toBeCloseTo(door.width, 6)
        expect(gap).toBeGreaterThan(VISITOR_RADIUS * 2)
      }
    }
  })

  it('runs each cheek across the thickness of the partition, and no further', () => {
    for (const plan of ship.plans.values()) {
      for (const door of plan.doorways) {
        for (const cheek of doorJambs(door)) {
          const run = Math.hypot(cheek.end[0] - cheek.start[0], cheek.end[1] - cheek.start[1])
          expect(run).toBeCloseTo(JAMB_DEPTH, 6)
        }
      }
    }
  })

  it('faces every soffit down at the floor', () => {
    for (const plan of ship.plans.values()) {
      for (const door of plan.doorways) {
        const soffit = doorSoffit(door)
        expect(soffit.length).toBe(4)
        // Counter-clockwise in [x, z], which is what `patch(…, up = false)` turns
        // downward — the only side of a soffit anyone stands on.
        expect(signedArea(soffit)).toBeGreaterThan(0)
        expect(polygonArea(soffit)).toBeCloseTo(door.width * JAMB_DEPTH, 5)
      }
    }
  })

  it('draws each cheek, and stops it at head height', () => {
    // Extruded to the ceiling along with the room's own walls a cheek would brick
    // the opening up, which is the whole reason `jambOf` exists. So this looks for
    // the geometry itself: triangles standing on the cheek's line, and none of
    // them above the door.
    const plan = ship.plans.get('tier-1')!
    const mesh = buildTierMesh(plan)
    const head = plan.tier.elevation + DOOR_HEIGHT
    const missing: string[] = []

    // Where an opening runs a wall from one corner to the other — the front of a
    // cell, the ground between two spaces the plan draws no wall between at all —
    // its cheek falls on the corner itself, and the wall that turns there does go
    // to the ceiling, as it must. That wall is collinear with the cheek, so no
    // amount of looking at the geometry tells the two apart: the corner is
    // therefore left to the walls' own invariants.
    const corners = new Set(
      plan.spaces.flatMap((space) =>
        space.footprint.map(([x, z]) => `${x.toFixed(3)}|${z.toFixed(3)}`),
      ),
    )

    for (const door of plan.doorways) {
      for (const cheek of doorJambs(door)) {
        const mid: Vec2 = [(cheek.start[0] + cheek.end[0]) / 2, (cheek.start[1] + cheek.end[1]) / 2]
        const onACorner = corners.has(`${mid[0].toFixed(3)}|${mid[1].toFixed(3)}`)
        let standing = 0
        let above = 0
        for (let i = 0; i < mesh.positions.length; i += 9) {
          const cx = (mesh.positions[i] + mesh.positions[i + 3] + mesh.positions[i + 6]) / 3
          const cz = (mesh.positions[i + 2] + mesh.positions[i + 5] + mesh.positions[i + 8]) / 3
          if (Math.hypot(cx - mid[0], cz - mid[1]) > JAMB_DEPTH) continue
          if (Math.abs(mesh.normals[i + 1]) > 1e-6) continue
          standing++
          const top = Math.max(mesh.positions[i + 1], mesh.positions[i + 4], mesh.positions[i + 7])
          // A wall of the room passes through here too, and it does go to the
          // ceiling; what must not is anything standing on the cheek's own line.
          const onTheCheek =
            Math.abs(mesh.normals[i] * (cheek.end[0] - cheek.start[0])) < 1e-3 &&
            Math.abs(mesh.normals[i + 2] * (cheek.end[1] - cheek.start[1])) < 1e-3
          if (onTheCheek && top > head + 0.001) above++
        }
        if (!standing) missing.push(`${door.a}|${door.b}`)
        if (!onACorner) {
          expect(above, `${door.a}|${door.b} has a cheek past the door`).toBe(0)
        }
      }
    }
    expect(missing, `${missing.length} cheeks are collided with and not drawn`).toEqual([])
  })
})

/**
 * Whether the quad starting at vertex `i` of a buffer stands up.
 *
 * The two surfaces on the deck that are lights are told apart by this and by
 * nothing else: a fitting lies flat under the ceiling, and a window's pane
 * stands in its wall. They used to share one buffer, which is what this was
 * written for; they no longer do — the glass carries the hour and a fitting
 * carries the room — so what it is for now is checking that the split holds.
 */
const standsUp = (data: Float32Array, i: number) =>
  Math.abs(data[i + 1] - data[i + 4]) > 1e-6 || Math.abs(data[i + 1] - data[i + 7]) > 1e-6

/** How many triangles of the fittings buffer a room holds. */
const fittingTriangles = (group: MeshGroup): number => group.fittingCount / 3

/**
 * The fittings, which are the visible half of what the bake has been reading off
 * `ceilingLamps` since it landed.
 *
 * The one thing worth guarding here is not the geometry — it is two triangles —
 * but the agreement: a fitting the visitor can see has to be the fitting that is
 * lighting the floor under it. Derive the two heights separately and the ship
 * gets lamps that glow where nothing brightens, and no picture would show it.
 */
describe('the ceiling fittings', () => {
  it('hangs one over every room, on the grid the bake pools from', () => {
    let total = 0
    for (const [tierId, plan] of ship.plans) {
      const mesh = buildTierMesh(plan)
      for (const group of mesh.groups) {
        const space = plan.spaces.find((entry) => entry.id === group.spaceId)!
        const lamps = lampsOf(space.footprint, lamplightOf(space, plan.tier))
        // Two triangles, six vertices, one fitting — and nothing else in the
        // buffer, now that the glass has one of its own.
        expect(
          fittingTriangles(group) / 2,
          `${group.spaceId} draws a different number of fittings than it lights by`,
        ).toBe(lamps.length)
        expect(lamps.length, `${group.spaceId} has no light in it`).toBeGreaterThan(0)
        total += lamps.length
      }
      expect(mesh.fittings.length % 18, `${tierId} has a fitting that is not a quad`).toBe(0)
    }
    // 2 489 fittings on the ship: 4 978 triangles against the 341 000 it draws.
    expect(total).toBeGreaterThan(2400)
  })

  it('hangs each one at the height its own light comes from', () => {
    for (const plan of ship.plans.values()) {
      const mesh = buildTierMesh(plan)
      for (const group of mesh.groups) {
        const space = plan.spaces.find((entry) => entry.id === group.spaceId)!
        const base = floorOf(space, plan.tier)
        const top = base + ceilingOf(space, plan.tier)
        const hang = fittingHeight(base, top)
        // Below the ceiling — a quad coplanar with it would fight for the depth
        // buffer — and above the head of anyone walking under it.
        expect(hang).toBeLessThan(top)
        expect(hang).toBeGreaterThanOrEqual(base + 2)

        const from = group.fittingStart * 3
        const to = (group.fittingStart + group.fittingCount) * 3
        for (let i = from; i < to; i += 9) {
          // Nothing in this buffer stands up any more: the glass left it when
          // its colour stopped being something the bake could settle.
          expect(standsUp(mesh.fittings, i), `${group.spaceId} has glass in its lamps`).toBe(false)
          for (let vertex = 0; vertex < 9; vertex += 3) {
            // Four places, not more: the buffer is `Float32Array`, and 78,65 m
            // comes back out of it as 78,650002.
            expect(
              mesh.fittings[i + vertex + 1],
              `${group.spaceId} hangs a fitting off its own light`,
            ).toBeCloseTo(hang, 4)
          }
        }
      }
    }
  })

  it('faces every fitting at the floor', () => {
    let checked = 0
    for (const plan of ship.plans.values()) {
      const f = buildTierMesh(plan).fittings
      for (let i = 0; i < f.length; i += 9) {
        // The winding has to give a downward normal: the only side of a lamp
        // anyone is ever on is underneath it.
        const ux = f[i + 3] - f[i]
        const uz = f[i + 5] - f[i + 2]
        const vx = f[i + 6] - f[i]
        const vz = f[i + 8] - f[i + 2]
        // For a flat quad, u × v is (0, uz·vx − ux·vz, 0) — the negative of the
        // plan-view cross product, which is why a counter-clockwise square in
        // [x, z] comes out facing *down*. See `MeshBuilder.quad`.
        expect(uz * vx - ux * vz).toBeLessThan(0)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(4900)
  })

  it('sits each one inside the room that hangs it', () => {
    const plan = ship.plans.get('tier-1')!
    const mesh = buildTierMesh(plan)
    for (const group of mesh.groups) {
      const space = plan.spaces.find((entry) => entry.id === group.spaceId)!
      for (const [x, z] of lampsOf(space.footprint, lamplightOf(space, plan.tier))) {
        expect(
          pointInPolygon([x, z], space.footprint),
          `${group.spaceId} hangs a fitting outside itself`,
        ).toBe(true)
      }
    }
  })

  it('burns above white, so a fitting reads as a source and not a pale square', () => {
    const mesh = buildTierMesh(ship.plans.get('tier-1')!)
    expect(mesh.fittingColors.length).toBe(mesh.fittings.length)
    // The brightest fitting on the deck is over 1 — nothing else in the ship's
    // buffers is, and that is what makes it clip while the steel around it does
    // not. A vertex attribute is a float and carries it; the albedos, which are
    // checked for the 0…1 range elsewhere, are a different buffer.
    expect(Math.max(...mesh.fittingColors)).toBeGreaterThan(1)
  })

  it('burns each room’s lamps at what that room’s lamps are worth', () => {
    const plan = ship.plans.get('tier-1')!
    const mesh = buildTierMesh(plan)
    let invented = 0

    for (const group of mesh.groups) {
      const space = plan.spaces.find((entry) => entry.id === group.spaceId)!
      // Room by room rather than deck by deck, which is the whole change: the
      // lamps of a Tier 1 corridor and of the King’s living room are no longer
      // the same lamp, so a brightest-on-the-deck comparison would be measuring
      // the categories against each other rather than the provenances.
      let brightest = 0
      const from = group.fittingStart * 3
      const to = (group.fittingStart + group.fittingCount) * 3
      for (let i = from; i < to; i += 9) {
        // A pane is in this buffer too and is not a lamp: it burns the sky.
        if (standsUp(mesh.fittings, i)) continue
        for (let channel = i; channel < i + 9; channel++) {
          brightest = Math.max(brightest, mesh.fittingColors[channel])
        }
      }
      if (!brightest) continue

      const full = Math.max(...lamplightOf(space, plan.tier).glow)
      // At exactly the strength the bake used — provenance no longer docks the
      // lamps (see `LIGHT.inferredFill`), so an invented corridor's fitting
      // burns like its deck's, and the lamp and the light cannot drift apart.
      expect(brightest / full, `${group.spaceId} draws a lamp it is not lit by`).toBeCloseTo(1, 5)
      if (space.provenance === 'inferred') invented++
    }

    expect(invented, 'no invented room on Tier 1').toBeGreaterThan(0)
  })

  it('draws none of them under the reveal', () => {
    // The doctrine view asks every surface what it is worth as evidence, and a
    // quad drawn as a light answers nothing: the fittings are derived, like the
    // columns, and they belong to the walk rather than to the sources.
    for (const [tierId, plan] of ship.plans) {
      expect(buildTierMesh(plan).fittings.length, `${tierId} lights nothing`).toBeGreaterThan(0)
      expect(
        buildTierMesh(plan, { reveal: true }).fittings.length,
        `${tierId} lights the doctrine`,
      ).toBe(0)
    }
  })

  it('cuts the fittings into the same rooms as the geometry', () => {
    for (const [tierId, plan] of ship.plans) {
      const mesh = buildTierMesh(plan)
      let vertices = 0
      for (const group of mesh.groups) {
        expect(group.fittingStart, `${group.spaceId} fittings are out of order`).toBe(vertices)
        vertices += group.fittingCount
      }
      expect(vertices, `${tierId} has a fitting belonging to no room`).toBe(
        mesh.fittings.length / 3,
      )
    }
  })

  /**
   * The glass, in its own buffer and in two rooms out of 314. What is worth
   * guarding is the cost of the split: every other room has to pay nothing at
   * all for a window it does not have.
   */
  it('leaves the glass buffer empty in every room without a window', () => {
    let glazed = 0
    for (const [tierId, plan] of ship.plans) {
      const mesh = buildTierMesh(plan)
      let vertices = 0
      for (const group of mesh.groups) {
        expect(group.paneStart, `${group.spaceId} glass is out of order`).toBe(vertices)
        vertices += group.paneCount
        const space = plan.spaces.find((entry) => entry.id === group.spaceId)!
        const hasWindow = plan.structures.some(
          (entry) => entry.spaceId === space.id && entry.kind === 'window',
        )
        if (hasWindow) glazed++
        else expect(group.paneCount, `${group.spaceId} draws glass it has no window for`).toBe(0)
      }
      expect(vertices, `${tierId} has glass belonging to no room`).toBe(mesh.panes.length / 3)
      // One value per vertex, written to three channels: the relation, not a colour.
      expect(mesh.paneColors.length).toBe(mesh.panes.length)
    }
    // The bay of the observation deck and the King's great window, and nothing
    // else on the ship has an outside.
    expect(glazed).toBe(2)
  })
})

/**
 * The two windows, which are the only two places on the ship where the outside
 * exists.
 *
 * Every other source on board is a filament on a ceiling grid, derived. These are
 * declared: `kind: 'window'` in `blueprint.json`, on two structures a panel draws.
 * So what is worth guarding is what the kind buys — that the pane is drawn as a
 * light and not as lacquer, that it is drawn where the light is computed from, and
 * that being the exception costs the other 312 rooms nothing.
 */
describe('the two windows', () => {
  const windows = ship.structures.filter((entry) => entry.kind === 'window')

  /** The room a window stands in, and the deck that room is on. */
  const roomOf = (structure: Structure) => {
    for (const plan of ship.plans.values()) {
      const space = plan.spaces.find((entry) => entry.id === structure.spaceId)
      if (space) return { plan, space }
    }
    throw new Error(`${structure.id} stands in no room`)
  }

  it('types two of them on the whole ship, and both are drawn by a panel', () => {
    // The figure is the point of the feature: 409 spaces, 2 ways of seeing out.
    expect(windows.map((entry) => entry.id).sort()).toEqual([
      'tier-1-king-living-quarters-living-great-window',
      'tier-3-observation-deck-window',
    ])
    for (const entry of windows) {
      expect(entry.provenance, `${entry.id} is not drawn`).toBe('panel')
      // Hung off the floor and taller than a person: this is a bay, not a porthole.
      expect(entry.base).toBeGreaterThan(0)
      expect(entry.height).toBeGreaterThan(2)
    }
    expect(ship.spaces.size).toBe(409)
  })

  it('samples the pane along its length, at the height of the glass', () => {
    for (const structure of windows) {
      const { plan } = roomOf(structure)
      const sources = windowSources(structure, plan.tier.elevation)
      const span = Math.max(...structure.size)
      // A point source at the middle of 36 m of glass would light the centre of
      // the observation deck and leave both ends of the same window dark.
      expect(sources.length, `${structure.id} is lit by too few sources`).toBe(
        Math.round(span / WINDOW_SAMPLE),
      )
      const y = plan.tier.elevation + structure.base + structure.height / 2
      for (const source of sources) expect(source[1]).toBeCloseTo(y, 6)

      // Spread over the glass rather than piled at one end of it.
      const spread = Math.hypot(
        sources[0][0] - sources[sources.length - 1][0],
        sources[0][2] - sources[sources.length - 1][2],
      )
      expect(spread).toBeGreaterThan(span * 0.7)
      expect(spread).toBeLessThan(span)
    }
  })

  it('draws the glass in a buffer of its own, in two bands relative to the sky', () => {
    for (const structure of windows) {
      const { plan, space } = roomOf(structure)
      const mesh = buildTierMesh(plan)
      const group = mesh.groups.find((entry) => entry.spaceId === space.id)!
      const bottom = plan.tier.elevation + structure.base
      const top = bottom + structure.height

      const horizon = floorOf(space, plan.tier) + HORIZON
      expect(horizon, `${structure.id} has its horizon outside the glass`).toBeGreaterThan(bottom)
      expect(horizon).toBeLessThan(top)

      const from = group.paneStart * 3
      const to = (group.paneStart + group.paneCount) * 3
      let panes = 0
      for (let i = from; i < to; i += 9) {
        // Every triangle in this buffer is glass, and glass stands up.
        expect(standsUp(mesh.panes, i), `${structure.id} lays a pane flat`).toBe(true)
        panes++
        let above = 0
        for (let vertex = 0; vertex < 9; vertex += 3) {
          const y = mesh.panes[i + vertex + 1]
          // The blueprint's own height for the opening, or the cut across it: a
          // pane is not hung from the ceiling grid and must not be moved to it,
          // and nothing but the horizon may divide it.
          expect(
            Math.min(Math.abs(y - bottom), Math.abs(y - horizon), Math.abs(y - top)),
          ).toBeLessThan(1e-4)
          if (y > horizon + 1e-4) above++
        }
        // What is baked is the relation between the two bands and not their
        // value: a triangle is wholly on one side of the cut or the other, and
        // it takes the share of the side it is on — the cloud gets all the sky
        // there is, the water gets 45 % of it, at whatever hour the material's
        // own colour says it is.
        const share = above > 0 ? 1 : SEA_FRACTION
        for (let channel = 0; channel < 3; channel++) {
          // Six places: the buffer is `Float32Array`, so 0,45 comes back 0,4500000.
          expect(mesh.paneColors[i + channel]).toBeCloseTo(share, 6)
        }

        // And at the drawn state of ch. 380 the product is the walk exactly as
        // it was rendered before the hour existed — which is the whole licence
        // for the other six rows of the table.
        const band = above > 0 ? WINDOW_GLOW : SEA_GLOW
        const drawn = skyOf(REFERENCE_HOUR).glow
        for (let channel = 0; channel < 3; channel++) {
          expect(mesh.paneColors[i + channel] * drawn[channel]).toBeCloseTo(band[channel], 6)
        }
        expect(band[2], 'the sky of the Dark Continent is not warm').toBeGreaterThan(band[0])
        if (above > 0) expect(band[2], 'the sky does not burn above white').toBeGreaterThan(1)
        // The sea is bright against the steel of the room and dark against the
        // cloud over it, which is the whole reason there is a line to see.
        else expect(band[2], 'the water burns like the sky').toBeLessThan(1)
      }
      // Two faces of glass, two bands each, two triangles a band. The outboard
      // face is never seen, and deciding which that is costs more than drawing it.
      expect(panes, `${structure.id} draws no glass`).toBe(8)
    }
  })

  it('puts the sea under the horizon and keeps it the colour of the sky', () => {
    // The water is the sky reflected off something that swallows most of it, so
    // the hue is the sky's — the ratios hold to a rounding error — and only the
    // value falls. A sea drawn in its own colour would be a green rectangle in
    // the one part of the ship that is not the ship.
    for (let channel = 0; channel < 3; channel++) {
      expect(SEA_GLOW[channel]).toBeLessThan(WINDOW_GLOW[channel])
      expect(SEA_GLOW[channel] / WINDOW_GLOW[channel]).toBeCloseTo(SEA_GLOW[2] / WINDOW_GLOW[2], 6)
    }
    // Below white, where the sky is above it: the line across the glass is the
    // difference between the two, and it is the whole feature.
    expect(Math.max(...SEA_GLOW)).toBeLessThan(1)
    expect(Math.max(...WINDOW_GLOW)).toBeGreaterThan(1)

    // The horizon meets the pane at the eye and nowhere else, so it is the walk's
    // own eye height. `TourScene` holds the other copy of this number.
    expect(HORIZON).toBe(1.7)

    // And it falls inside both openings, which is what makes them views rather
    // than lamps: a sill above the eye would draw all sky, a head below it all
    // water, and the blueprint puts neither window there.
    for (const structure of windows) {
      const { plan, space } = roomOf(structure)
      const sill = plan.tier.elevation + structure.base
      const horizon = floorOf(space, plan.tier) + HORIZON
      expect(horizon, `${structure.id} sees no water`).toBeGreaterThan(sill)
      expect(horizon, `${structure.id} sees no sky`).toBeLessThan(sill + structure.height)
    }
  })

  it('faces each pane out of the frame it sits in', () => {
    for (const structure of windows) {
      const { plan, space } = roomOf(structure)
      const mesh = buildTierMesh(plan)
      const group = mesh.groups.find((entry) => entry.spaceId === space.id)!
      const from = group.paneStart * 3
      const to = (group.paneStart + group.paneCount) * 3

      for (let i = from; i < to; i += 9) {
        const ax = mesh.panes[i]
        const az = mesh.panes[i + 2]
        const u = [
          mesh.panes[i + 3] - ax,
          mesh.panes[i + 4] - mesh.panes[i + 1],
          mesh.panes[i + 5] - az,
        ]
        const v = [
          mesh.panes[i + 6] - ax,
          mesh.panes[i + 7] - mesh.panes[i + 1],
          mesh.panes[i + 8] - az,
        ]
        const normal = [
          u[1] * v[2] - u[2] * v[1],
          u[2] * v[0] - u[0] * v[2],
          u[0] * v[1] - u[1] * v[0],
        ]
        const length = Math.hypot(...normal)
        expect(length).toBeGreaterThan(0)
        // Vertical glass: whichever way it looks, it does not look up or down.
        expect(Math.abs(normal[1]) / length).toBeLessThan(1e-6)
        // And it looks away from the frame's own centre — the material is drawn
        // `FrontSide`, so a pane wound the other way is not a dark pane, it is a
        // missing one.
        const out = normal[0] * (ax - structure.at[0]) + normal[2] * (az - structure.at[1])
        expect(out, `${structure.id} draws its glass inside out`).toBeGreaterThan(0)
      }
    }
  })

  /**
   * The pool, which since chantier D is an attribute rather than a colour.
   *
   * The point of the split is that the bake stops carrying the daylight at all:
   * the colours of a room with a window and of the same room with the window
   * called a canvas are now *identical*, and the whole difference between them
   * lives in `skies`. That is what makes the bake deterministic at every hour —
   * midnight and noon are the same buffer — and it is what the shader puts back
   * with `colour × (1 + aSky × lift)`.
   */
  it('takes the daylight out of the colours and puts it in the sky share', () => {
    for (const structure of windows) {
      const { plan, space } = roomOf(structure)
      const blinded = {
        ...plan,
        structures: plan.structures.map((entry) =>
          entry.id === structure.id ? { ...entry, kind: 'painting' as const } : entry,
        ),
      }
      const lit = buildTierMesh(plan)
      const dark = buildTierMesh(blinded)
      const room = lit.groups.find((entry) => entry.spaceId === space.id)!

      // Everything but the solid itself, which is drawn in the colour of its
      // own kind and is a different colour once it is called a canvas. The
      // light on every other surface of the room has to be identical, bit for
      // bit: the two bakes ran the same arithmetic and the window is no longer
      // part of it.
      const outline = structureFootprint(structure)
      const xs = outline.map((corner) => corner[0])
      const zs = outline.map((corner) => corner[1])
      const inFrame = (x: number, z: number) =>
        x > Math.min(...xs) - 0.1 &&
        x < Math.max(...xs) + 0.1 &&
        z > Math.min(...zs) - 0.1 &&
        z < Math.max(...zs) + 0.1

      let compared = 0
      for (let i = room.start; i < room.start + room.count; i++) {
        if (inFrame(lit.positions[i * 3], lit.positions[i * 3 + 2])) continue
        compared++
        for (let channel = 0; channel < 3; channel++) {
          expect(
            lit.colors[i * 3 + channel],
            `${space.id} still bakes the sky into its colour`,
          ).toBe(dark.colors[i * 3 + channel])
        }
      }
      expect(compared, `${space.id} compared nothing`).toBeGreaterThan(100)

      // And the daylight is all still there, in the attribute, on the surfaces
      // the pane actually reaches.
      let reached = 0
      let strongest = 0
      for (let i = room.start; i < room.start + room.count; i++) {
        expect(lit.skies[i], `${space.id} has a share that is not a number`).toBeGreaterThanOrEqual(
          0,
        )
        if (lit.skies[i] > 1e-6) reached++
        strongest = Math.max(strongest, lit.skies[i])
      }
      expect(reached, `${space.id} takes no daylight at all`).toBeGreaterThan(0)
      // Felt walking in, rather than a rounding error: the sky lifts the
      // brightest of its surfaces by a good few per cent.
      expect(strongest, `${space.id} takes daylight nobody could see`).toBeGreaterThan(0.05)
    }
  })

  it('writes no sky share anywhere but the two rooms with a window', () => {
    for (const [tierId, plan] of ship.plans) {
      const mesh = buildTierMesh(plan)
      const glazed = new Set(
        plan.structures.filter((entry) => entry.kind === 'window').map((entry) => entry.spaceId),
      )
      if (!glazed.size) {
        // Three decks of five have no opening: no attribute is made at all.
        expect(mesh.skies.length, `${tierId} carries a sky it has no window for`).toBe(0)
        continue
      }
      // Where it exists it lines up with the positions, because a room is a draw
      // range into the deck's buffers and an attribute has to agree with them.
      expect(mesh.skies.length).toBe(mesh.positions.length / 3)
      for (const group of mesh.groups) {
        if (glazed.has(group.spaceId)) continue
        for (let i = group.start; i < group.start + group.count; i++) {
          expect(mesh.skies[i], `${group.spaceId} takes daylight through a bulkhead`).toBe(0)
        }
      }
    }
  })

  /** The reveal is a repaint, and a repaint has no light in it to share. */
  it('writes no sky share under the reveal', () => {
    for (const structure of windows) {
      const { plan } = roomOf(structure)
      expect(buildTierMesh(plan, { reveal: true }).skies.length).toBe(0)
    }
  })

  it('lights the room it stands in, and only that room', () => {
    for (const structure of windows) {
      const { plan, space } = roomOf(structure)
      // The same deck with the glass called a canvas, which is what the two of
      // them were until now: same geometry, same collision, no daylight.
      const blinded = {
        ...plan,
        structures: plan.structures.map((entry) =>
          entry.id === structure.id ? { ...entry, kind: 'painting' as const } : entry,
        ),
      }
      const lit = buildTierMesh(plan)
      const dark = buildTierMesh(blinded)

      const mean = (mesh: TierMesh, group: MeshGroup) => {
        let total = 0
        const from = group.start * 3
        const to = (group.start + group.count) * 3
        for (let i = from; i < to; i++) total += mesh.colors[i]
        return total / (to - from)
      }

      for (const group of lit.groups) {
        const other = dark.groups.find((entry) => entry.spaceId === group.spaceId)!
        expect(group.count, `${group.spaceId} changed shape`).toBe(other.count)
        if (group.spaceId === space.id) continue
        // Every other room on the deck is lit exactly as it was: the window is a
        // source in its own room and nowhere else, which is what `WINDOW_REACH`
        // says and what keeps this affordable at 314 rooms.
        expect(mean(lit, group), `${group.spaceId} took light from another room`).toBeCloseTo(
          mean(dark, group),
          10,
        )
      }

      // And the room itself is brighter for having a window in it — which since
      // chantier D is a claim about the share rather than about the colours,
      // the colours of the two being identical by construction. What the shader
      // multiplies back is `1 + aSky`, so the mean of that is the lift.
      const room = lit.groups.find((entry) => entry.spaceId === space.id)!
      let lift = 0
      for (let i = room.start; i < room.start + room.count; i++) lift += lit.skies[i]
      lift = 1 + lift / room.count
      // Not a rounding error: the daylight is meant to be felt walking in.
      expect(lift, `${space.id} is no brighter for having a window in it`).toBeGreaterThan(1.01)
    }
  })

  it('throws further than a lamp, because the opening is not a lamp', () => {
    // 6 m of glass over the observation deck stopping at a fitting's 9 m would
    // read as a lamp hung against the window rather than as the sky behind it.
    expect(WINDOW_REACH).toBeGreaterThan(9)
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
