/**
 * Extrudes a deck into triangles: floors, ceilings, walls and door lintels.
 *
 * The output is plain typed arrays rather than three.js objects, so the whole
 * pipeline from `data/ship/blueprint.json` to the vertices on screen can be
 * tested without a WebGL context. The Svelte component does nothing but hand
 * these buffers to a `BufferGeometry`.
 */
import {
  BAR_RAIL,
  COLUMN_HALF_WIDTH,
  DOOR_HEIGHT,
  grilleBars,
  iterateEdges,
  structureFootprint,
  triangulate,
} from './geometry'
import { ceilingOf } from './blueprint'
import type { TierPlan } from './blueprint'
import type {
  Provenance,
  Space,
  SpaceCategory,
  Structure,
  StructureKind,
  Tier,
  Vec2,
} from './types'

export interface TierMesh {
  positions: Float32Array
  normals: Float32Array
  colors: Float32Array
  /**
   * Line-segment pairs tracing where surfaces meet: the foot and head of every
   * wall, and the arrises of every column.
   *
   * Unlit steel under flat light reads as one continuous smear — a wall twelve
   * metres off is the same value as the floor in front of it. Drawing the edges
   * is what makes the room legible, and it is the same gold outline the deck
   * plans are drawn in.
   */
  edges: Float32Array
  /** Triangle count, for a sanity check and for the debug read-out. */
  triangles: number
}

type Rgb = readonly [number, number, number]

const hex = (value: number): Rgb => [
  ((value >> 16) & 255) / 255,
  ((value >> 8) & 255) / 255,
  (value & 255) / 255,
]

/**
 * Floor colours, keyed to the palette the archive already uses: near-black
 * hull, ivory, and gold for anything royal.
 */
const CATEGORY_COLOURS: Record<SpaceCategory, number> = {
  room: 0x2a1f1f,
  corridor: 0x1a1414,
  quarters: 0x3a2418,
  residential: 0x2e211c,
  public: 0x3d2a16,
  military: 0x1f2a1f,
  administrative: 0x1c2430,
  medical: 0x1b2a30,
  mafia: 0x2c1c2e,
  prison: 0x2a1414,
  ceremonial: 0x3a2e10,
  evacuation: 0x14262a,
  infrastructure: 0x1e1e1e,
  storage: 0x24211a,
}

/**
 * What stands in a room, kept apart from the room itself: bare machinery for
 * the springs, near-black lacquer for the coffins, and the gold of the deck
 * plans for a stage or a dais.
 */
const STRUCTURE_COLOURS: Record<StructureKind, number> = {
  spring: 0x6d7078,
  casket: 0x241d1d,
  platform: 0x4c3a17,
  counter: 0x3c3227,
  table: 0x33291f,
  bed: 0x4a4642,
  seat: 0x342a24,
  cabinet: 0x2e251d,
  basin: 0x3f4246,
  painting: 0x1d1a16,
  lifeboat: 0x8a8f96,
  pillar: 0x6a5a4a,
  bars: 0x7f868e,
  manacle: 0x6f6250,
  camera: 0x22262a,
  telephone: 0x2a2622,
  duct: 0x3a3d42,
}

const WALL_COLOUR = hex(0x4a4038)
const CEILING_COLOUR = hex(0x0b0909)
/** Columns sit a shade above the walls so they read as structure. */
const COLUMN_COLOUR = hex(0x6a5a4a)
/** Anything invented for the sake of a contiguous deck reads cold. */
const INFERRED_TINT = hex(0x2b3a4a)

function blend(a: Rgb, b: Rgb, amount: number): Rgb {
  return [
    a[0] + (b[0] - a[0]) * amount,
    a[1] + (b[1] - a[1]) * amount,
    a[2] + (b[2] - a[2]) * amount,
  ]
}

/**
 * Tints geometry by how well the manga supports it, so the reconstruction
 * never passes an invention off as canon: inferred surfaces go cold and dim,
 * panel-sourced ones sit slightly brighter than the plan-only ones.
 */
export function colourFor(base: Rgb, provenance: Provenance): Rgb {
  if (provenance === 'inferred') return blend(base, INFERRED_TINT, 0.55)
  if (provenance === 'panel') return blend(base, [1, 1, 1], 0.12)
  return base
}

class MeshBuilder {
  readonly positions: number[] = []
  readonly normals: number[] = []
  readonly colors: number[] = []

  triangle(
    a: readonly [number, number, number],
    b: readonly [number, number, number],
    c: readonly [number, number, number],
    colour: Rgb,
  ): void {
    const ux = b[0] - a[0]
    const uy = b[1] - a[1]
    const uz = b[2] - a[2]
    const vx = c[0] - a[0]
    const vy = c[1] - a[1]
    const vz = c[2] - a[2]

    let nx = uy * vz - uz * vy
    let ny = uz * vx - ux * vz
    let nz = ux * vy - uy * vx
    const length = Math.hypot(nx, ny, nz) || 1
    nx /= length
    ny /= length
    nz /= length

    for (const vertex of [a, b, c]) {
      this.positions.push(vertex[0], vertex[1], vertex[2])
      this.normals.push(nx, ny, nz)
      this.colors.push(colour[0], colour[1], colour[2])
    }
  }

  /** A vertical quad, wound so it faces both ways once the material says so. */
  quad(start: Vec2, end: Vec2, bottom: number, top: number, colour: Rgb): void {
    const a: [number, number, number] = [start[0], bottom, start[1]]
    const b: [number, number, number] = [end[0], bottom, end[1]]
    const c: [number, number, number] = [end[0], top, end[1]]
    const d: [number, number, number] = [start[0], top, start[1]]
    this.triangle(a, b, c, colour)
    this.triangle(a, c, d, colour)
  }
}

/**
 * One solid, raised off the outline the collision list already knows about.
 *
 * Kept apart from `buildTierMesh` because a solid is not always part of its
 * deck: a Hatsu that moves, shrinks or animates one lifts it out of the baked
 * deck and draws it on its own, so that pushing a coffin across the burial
 * chamber does not mean re-extruding the burial chamber.
 */
function extrudeSolid(
  builder: MeshBuilder,
  edges: number[],
  structure: Structure,
  room: Space,
  tier: Tier,
): void {
  const OFFSET = 0.03
  const horizontal = (a: Vec2, b: Vec2, y: number) => edges.push(a[0], y, a[1], b[0], y, b[1])
  const vertical = (point: Vec2, bottom: number, top: number) =>
    edges.push(point[0], bottom, point[1], point[0], top, point[1])

  const outline = structureFootprint(structure)
  const colour = colourFor(hex(STRUCTURE_COLOURS[structure.kind]), structure.provenance)
  const bottom = tier.elevation + structure.base
  const top = Math.min(bottom + structure.height, tier.elevation + ceilingOf(room, tier))

  // A run of bars is one solid to walk around and a row of uprights to see
  // through: drawn as a slab it would be the wall the cell fronts are not.
  if (structure.kind === 'bars') {
    const railBottom = Math.max(bottom, top - BAR_RAIL)
    for (const bar of grilleBars(structure)) {
      for (const [start, end] of iterateEdges(bar)) {
        builder.quad(start, end, bottom, railBottom, colour)
      }
    }

    // The rail closes the tops of the uprights and gives the run a line to
    // read at a distance, the way a lintel does over a door.
    for (const [start, end] of iterateEdges(outline)) {
      builder.quad(start, end, railBottom, top, colour)
      horizontal(start, end, railBottom + OFFSET)
      horizontal(start, end, top - OFFSET)
    }
    const railCap = triangulate(outline)
    for (let i = 0; i < railCap.length; i += 3) {
      const a = outline[railCap[i]]
      const b = outline[railCap[i + 1]]
      const c = outline[railCap[i + 2]]
      builder.triangle([a[0], top, a[1]], [b[0], top, b[1]], [c[0], top, c[1]], colour)
    }
    for (const corner of outline) vertical(corner, bottom, top)
    return
  }

  for (const [start, end] of iterateEdges(outline)) {
    builder.quad(start, end, bottom, top, colour)
    vertical(start, bottom, top)
    horizontal(start, end, top - OFFSET)
  }

  const cap = triangulate(outline)
  for (let i = 0; i < cap.length; i += 3) {
    const a = outline[cap[i]]
    const b = outline[cap[i + 1]]
    const c = outline[cap[i + 2]]
    builder.triangle([a[0], top, a[1]], [b[0], top, b[1]], [c[0], top, c[1]], colour)
    // Hung off the floor, so it is closed underneath as well as on top.
    if (structure.base > 0) {
      builder.triangle([a[0], bottom, a[1]], [c[0], bottom, c[1]], [b[0], bottom, b[1]], colour)
    }
  }
}

/** That same solid on its own, for the Hatsu layer to draw and move. */
export function buildSolidMesh(structure: Structure, room: Space, tier: Tier): TierMesh {
  const builder = new MeshBuilder()
  const edges: number[] = []
  extrudeSolid(builder, edges, structure, room, tier)
  return {
    positions: new Float32Array(builder.positions),
    normals: new Float32Array(builder.normals),
    colors: new Float32Array(builder.colors),
    edges: new Float32Array(edges),
    triangles: builder.positions.length / 9,
  }
}

/** Builds every triangle of one deck. */
export function buildTierMesh(plan: TierPlan): TierMesh {
  const builder = new MeshBuilder()
  const { tier } = plan
  const spaces = new Map(plan.spaces.map((space) => [space.id, space]))
  const heightOf = (space: Space) => tier.elevation + ceilingOf(space, tier)

  const edges: number[] = []
  // Pulled a hair off the surface so the line is not fighting the polygon it
  // sits on for the same depth value.
  const OFFSET = 0.03
  const horizontal = (a: Vec2, b: Vec2, y: number) =>
    edges.push(a[0], y, a[1], b[0], y, b[1])
  const vertical = (point: Vec2, bottom: number, top: number) =>
    edges.push(point[0], bottom, point[1], point[0], top, point[1])

  for (const space of plan.spaces) {
    const floorColour = colourFor(hex(CATEGORY_COLOURS[space.category]), space.provenance)
    const ceilingColour = colourFor(CEILING_COLOUR, space.provenance)
    const top = heightOf(space)
    const indices = triangulate(space.footprint)

    for (let i = 0; i < indices.length; i += 3) {
      const a = space.footprint[indices[i]]
      const b = space.footprint[indices[i + 1]]
      const c = space.footprint[indices[i + 2]]

      // Floor faces up, ceiling faces down: the winding is simply reversed.
      builder.triangle(
        [a[0], tier.elevation, a[1]],
        [c[0], tier.elevation, c[1]],
        [b[0], tier.elevation, b[1]],
        floorColour,
      )
      builder.triangle([a[0], top, a[1]], [b[0], top, b[1]], [c[0], top, c[1]], ceilingColour)
    }
  }

  // Room walls and column faces arrive in the same list, which is the point:
  // the visitor collides with exactly what is drawn here. The faces of a solid
  // standing in a room are in that list too, for the same reason, but they are
  // raised by the structure pass below: extruded to the ceiling like a wall, a
  // bed would be a partition.
  for (const wall of plan.walls) {
    if (wall.structureId) continue
    const space = spaces.get(wall.spaceId)
    if (!space) continue
    const top = heightOf(space)
    builder.quad(
      wall.start,
      wall.end,
      tier.elevation,
      top,
      colourFor(WALL_COLOUR, space.provenance),
    )
    horizontal(wall.start, wall.end, tier.elevation + OFFSET)
    horizontal(wall.start, wall.end, top - OFFSET)
  }

  // Columns get a cap so you are not looking up an open shaft, and a brighter
  // face than the walls so they read as structure at a distance.
  for (const [spaceId, centres] of plan.columns) {
    const space = spaces.get(spaceId)
    if (!space) continue
    const top = heightOf(space)
    const colour = colourFor(COLUMN_COLOUR, space.provenance)
    const h = COLUMN_HALF_WIDTH

    for (const centre of centres) {
      const corners: Vec2[] = [
        [centre[0] - h, centre[1] - h],
        [centre[0] + h, centre[1] - h],
        [centre[0] + h, centre[1] + h],
        [centre[0] - h, centre[1] + h],
      ]
      builder.triangle(
        [corners[0][0], top, corners[0][1]],
        [corners[1][0], top, corners[1][1]],
        [corners[2][0], top, corners[2][1]],
        colour,
      )
      builder.triangle(
        [corners[0][0], top, corners[0][1]],
        [corners[2][0], top, corners[2][1]],
        [corners[3][0], top, corners[3][1]],
        colour,
      )
      for (const corner of corners) vertical(corner, tier.elevation, top)
    }
  }

  // What stands in the rooms. Its sides are already in `plan.walls`, so this
  // only has to raise them: the same outline, extruded to its own height and
  // capped, and never taller than the room it stands in.
  for (const structure of plan.structures) {
    const room = spaces.get(structure.spaceId)
    if (room) extrudeSolid(builder, edges, structure, room, tier)
  }

  // Above each opening the wall carries on to the ceiling, so a doorway reads
  // as a door and not as a room with a side missing.
  for (const door of plan.doorways) {
    const a = spaces.get(door.a)
    const b = spaces.get(door.b)
    if (!a || !b) continue
    const lintelTop = Math.max(heightOf(a), heightOf(b))
    const lintelBottom = tier.elevation + DOOR_HEIGHT
    if (lintelTop <= lintelBottom) continue

    const provenance: Provenance =
      a.provenance === 'inferred' || b.provenance === 'inferred' ? 'inferred' : a.provenance
    builder.quad(door.start, door.end, lintelBottom, lintelTop, colourFor(WALL_COLOUR, provenance))
  }

  return {
    positions: new Float32Array(builder.positions),
    normals: new Float32Array(builder.normals),
    colors: new Float32Array(builder.colors),
    edges: new Float32Array(edges),
    triangles: builder.positions.length / 9,
  }
}
