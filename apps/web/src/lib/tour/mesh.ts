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
  EPSILON,
  LAMP_SPACING,
  ceilingLamps,
  distanceToBoundary,
  doorSoffit,
  grilleBars,
  iterateEdges,
  plateSeams,
  sealKey,
  structureFootprint,
  subdivideTriangle,
  toClockwise,
  triangulate,
} from './geometry'
import { ceilingOf } from './blueprint'
import type { BlindWall, TierPlan } from './blueprint'
import type {
  Doorway,
  Polygon,
  Provenance,
  Space,
  SpaceCategory,
  Structure,
  StructureKind,
  Tier,
  Vec2,
  WallSegment,
} from './types'

/**
 * One room's stretch of the deck's buffers.
 *
 * The deck is still extruded into a single pair of typed arrays — one upload,
 * one material — but it is no longer a single indivisible thing to draw. Each
 * room's triangles are contiguous, so the renderer can hand the same buffer to
 * one mesh per room with its own draw range and its own bounding sphere, and
 * then draw only the rooms `$lib/tour/visibility` names. Without this the whole
 * of Tier 1 is rasterised from inside a broom cupboard.
 *
 * `start` and `count` are in vertices, `edgeStart` and `edgeCount` in
 * line-segment endpoints: both index the arrays in units of three floats.
 */
export interface MeshGroup {
  spaceId: string
  start: number
  count: number
  edgeStart: number
  edgeCount: number
  /** The room's stretch of the plating, in line-segment endpoints. */
  seamStart: number
  seamCount: number
  /** The room's stretch of the ceiling fittings, in vertices. */
  fittingStart: number
  fittingCount: number
  /** The room's own bounding sphere, so the renderer never scans the buffer. */
  centre: readonly [number, number, number]
  radius: number
}

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
  /**
   * The seams between the deck plates, as line-segment pairs.
   *
   * Its own buffer rather than more entries in `edges`, because it is not the
   * gold outline of the plans: it is riveted steel, and it is drawn in the dim
   * material `TourScene` gives it. See `PLATE_PITCH` in `geometry.ts` for why a
   * bare floor needs it at all.
   */
  seams: Float32Array
  /**
   * The ceiling fittings, as downward-facing quads.
   *
   * Its own buffer and its own material, for the reason the plating has one: it
   * is not steel, and it must not take the light. A fitting is the one surface on
   * the deck that *is* a light, and `MeshLambertMaterial` has no per-vertex way
   * to say so — an emissive is a uniform, not an attribute. So these go up in a
   * `MeshBasicMaterial` whose colour sits above 1 and let the filmic curve roll
   * it off, which is what a lamp looks like and what no lit quad can imitate.
   */
  fittings: Float32Array
  /**
   * What each fitting burns at, per vertex.
   *
   * Above 1 on purpose — see `FITTING_GLOW` — and per vertex rather than a
   * uniform on the material because a fitting has to say the same thing about
   * provenance that the pool under it does. `RoomLight` gives a room the
   * reconstruction invented `LIGHT.inferredLamps` of its lamplight; a fitting
   * drawn at full strength over that dim floor would be a lamp that glows and
   * lights nothing, which is exactly the claim the bake refuses to make.
   */
  fittingColors: Float32Array
  /** Triangle count, for a sanity check and for the debug read-out. */
  triangles: number
  /** Where each room's geometry sits in the buffers above, in plan order. */
  groups: MeshGroup[]
}

type Rgb = readonly [number, number, number]

/**
 * The colours below are written the way a stylesheet writes them — sRGB, the
 * space the eye and the deck plans agree on. A vertex colour attribute is read
 * by three.js as already linear, so the transfer function has to be undone here
 * or every surface arrives about five times too light: `0x4a4038` is an albedo
 * of 0.058, not of 0.290, and at 0.290 the walls come out a flat grey.
 */
const toLinear = (channel: number): number =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

const hex = (value: number): Rgb => [
  toLinear(((value >> 16) & 255) / 255),
  toLinear(((value >> 8) & 255) / 255),
  toLinear((value & 255) / 255),
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

/**
 * The reveal: the ship painted in what it is worth as evidence, and nothing
 * else.
 *
 * Ordinarily a room is coloured by what it is for and only tinted by its
 * provenance, which is right — a walk should look like a ship. Turn the reveal
 * on and the categories drop out: every surface takes the colour of its badge,
 * the walls the reconstruction declared blind go red, and the openings it
 * placed by hand go blue. The doctrine stops being a legend in the margin and
 * becomes what you are looking at.
 */
const REVEAL_COLOURS: Record<Provenance, Rgb> = {
  panel: hex(0xffd700),
  plan: hex(0xfffff0),
  map: hex(0x5f8f6a),
  inferred: hex(0x2b3a4a),
}
/** A wall two rooms share with nothing through it, declared and reasoned. */
const BLIND_COLOUR = hex(0xef3340)
/** An opening the blueprint places rather than derives from the shared wall. */
const DECLARED_COLOUR = hex(0x7095d6)

/** Room colours are lit; floors and ceilings need to stay walkable-dark. */
const revealed = (provenance: Provenance, darken: number): Rgb =>
  blend(REVEAL_COLOURS[provenance], [0, 0, 0], darken)

/** Whether a wall segment runs along the stretch a seal keeps blind. */
function runsAlong(wall: WallSegment, blind: BlindWall): boolean {
  const dx = blind.end[0] - blind.start[0]
  const dz = blind.end[1] - blind.start[1]
  const length = Math.hypot(dx, dz)
  if (length < EPSILON) return false
  const unit: Vec2 = [dx / length, dz / length]

  for (const point of [wall.start, wall.end]) {
    const ox = point[0] - blind.start[0]
    const oz = point[1] - blind.start[1]
    // Off the seal's line, or past either of its ends: a different wall.
    if (Math.abs(ox * unit[1] - oz * unit[0]) > 0.05) return false
    const t = ox * unit[0] + oz * unit[1]
    if (t < -0.05 || t > length + 0.05) return false
  }
  return true
}

/**
 * How far apart the baked light is sampled, in metres.
 *
 * A floor drawn as two enormous triangles can only be flat: the light is
 * computed per vertex and there is nowhere between the corners to put a value.
 * Cutting every surface into patches this size gives the bake somewhere to live,
 * and two metres is about the size of the softest thing it has to describe — the
 * pool a ceiling fitting throws on the deck under it.
 *
 * It is not free, and the deck is deliberately not tessellated evenly, because
 * the three surfaces do not carry the same information:
 *
 * - The **floor** is sampled at `PATCH`. It is the surface the visitor looks at
 *   most, the one the fittings pool on, and the one whose corners tell them the
 *   shape of the room.
 * - The **ceiling** is not sampled at all: it takes one value per triangle at the
 *   corners it already has. Its albedo is `0x0b0909`, which is 0,004 linear — a
 *   fitting's pool multiplied into that is a change of a thousandth of nothing,
 *   and forty thousand square metres of lattice over black steel is a fifth of
 *   the ship's triangles spent on something no display can show. What the
 *   ceiling gets instead is the fittings' own lift on the *walls* under them,
 *   which is where it can be seen.
 * - A **wall** is sampled at `PATCH` up its height, where the creases at the deck
 *   and at the ceiling are, and at twice that along its run, where nothing
 *   changes faster than the fitting in front of it.
 *
 * What bounds an edge is the diagonal of a lattice cell rather than its side. The
 * recursion in `subdivideTriangle` splits until *every* edge fits, and asking a
 * right triangle's hypotenuse to fit inside the bound on its legs costs two
 * further levels and three times the triangles for no more light.
 */
export const PATCH = 2

/** The diagonal of one cell of the lattice, which is what bounds an edge. */
const PATCH_EDGE = PATCH * 1.45

/** The ceiling and the length of a wall are sampled half as finely. */
const COARSE = 2

/**
 * How the baked light is put together.
 *
 * All of it multiplies the albedo the surface already carries, so the deck keeps
 * the colours the categories and the provenances give it and only gains the
 * variation those cannot express. The mean shade over a room comes out near 1,
 * which is deliberate: the ambient, hemisphere and headlamp intensities in
 * `TourScene` were tuned against unshaded albedos, and a bake that averaged 0,6
 * would quietly darken the whole ship by half a stop.
 */
const LIGHT = {
  /** What every surface gets before a single fitting is counted. */
  fill: 0.72,
  /** How far a fitting throws, in metres. Just past the grid it hangs on. */
  reach: 9,
  /** How much of a fitting's pool reaches the floor, the ceiling, a wall. */
  floor: 0.85,
  ceiling: 0.55,
  wall: 0.7,
  /** How far from a wall a floor is fully open, and how dark the crease is. */
  openReach: 2.4,
  openFloor: 0.42,
  /** The band at the foot and head of a wall where it meets another surface. */
  crease: 1.1,
  creaseFloor: 0.5,
  /**
   * What an inferred room gets of all that.
   *
   * The fill is barely touched, because a surface the reconstruction invented is
   * still a surface and has to be walkable. The fittings very nearly are: the
   * plans do not put a lamp in a corridor nobody drew, and the walk should not
   * pretend otherwise. The effect is that provenance stops being a tint you have
   * to know the legend for and becomes something you feel — the invented parts of
   * the ship are the unlit parts, and you notice walking into one.
   */
  inferredFill: 0.86,
  inferredLamps: 0.22,
} as const

/**
 * How high a room's fittings hang, in world Y.
 *
 * Shared rather than computed twice, and that sharing is the whole point: this is
 * the height `RoomLight` throws its pools from *and* the height the quads in
 * `fittings` are drawn at, so a fitting you can see is the fitting that is
 * lighting the floor under it. Derive them separately and the ship gets lamps
 * that glow where nothing brightens, which is worse than no lamps at all.
 *
 * A little under the ceiling, and never below head height in a room whose
 * ceiling is low — the lowest on the ship is 2,6 m, which leaves 35 cm.
 */
export function fittingHeight(floorY: number, ceilingY: number): number {
  return Math.max(floorY + 2, ceilingY - 0.35)
}

/**
 * How wide a fitting is drawn, in metres.
 *
 * Nothing in the blueprint gives a size, so this is the smallest that still
 * reads: at the 140 m of the Tier 4 starboard corridor a 70 cm fitting is about
 * five pixels, which is a dot — and a receding row of dots is exactly the point.
 * A row of lamps running away from you is what makes the length of this ship
 * countable, in a way no measurement in the caption does.
 */
export const FITTING_SIZE = 0.7

/**
 * What a fitting burns at, in the renderer's working linear space.
 *
 * Above 1, and that is the whole trick. Nothing on a display is brighter than
 * white, so what makes a surface read as a *source* rather than as a pale square
 * is that it saturates before its surroundings do. With the filmic curve already
 * in `TourScene` these values do not clip, they roll off — which is what a lamp
 * looks like — and they carry the warm cast the pools underneath already have.
 */
export const FITTING_GLOW: Rgb = [2.4, 2.0, 1.55]

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value)

/** Two grid indices in one number, so the fittings are not keyed by strings. */
const cellKey = (i: number, j: number) => i * 4096 + j

/**
 * The light of one room, baked rather than lit.
 *
 * There is no second light in the scene and no shadow map: what a fitting does
 * to a floor, and what a corner does to the light reaching it, are computed here
 * once per vertex and multiplied into the `color` attribute the deck already
 * uploads. That is why it costs nothing to draw — it is the same buffer, the same
 * material and the same draw call as before — and why it varies room by room,
 * which a scene light of any number could not do at 314 rooms.
 */
class RoomLight {
  /** The fittings, bucketed by the grid cell they hang in. */
  private readonly cells = new Map<number, [number, number, number][]>()
  private readonly fill: number
  private readonly lamps: number
  /**
   * The floor and the ceiling already shaded, keyed to a decimetre of plan.
   *
   * The lattice is shared: an interior vertex is written once for each triangle
   * that meets there, which is six times on a regular grid, and every one of
   * those writes would otherwise walk all the walls of the room and sum all the
   * fittings over it again. The floor and the ceiling are each at one height, so
   * two coordinates settle the answer — the walls, where the height is the whole
   * point, are not cached and do not need to be, being a tenth of the vertices.
   *
   * Rounding to a decimetre is far below anything the eye can find in a gradient,
   * and this is most of the difference between a deck that builds in half a
   * second and one that builds in well under a tenth.
   */
  private readonly shaded: [Map<number, number>, Map<number, number>] = [new Map(), new Map()]
  private readonly floorY: number
  private readonly ceilingY: number

  constructor(
    private readonly footprint: Polygon,
    floorY: number,
    ceilingY: number,
    provenance: Provenance,
  ) {
    const inferred = provenance === 'inferred'
    this.fill = LIGHT.fill * (inferred ? LIGHT.inferredFill : 1)
    this.lamps = inferred ? LIGHT.inferredLamps : 1
    this.floorY = floorY
    this.ceilingY = ceilingY

    const hang = fittingHeight(floorY, ceilingY)
    for (const [x, z] of ceilingLamps(footprint)) {
      const key = cellKey(Math.round(x / LAMP_SPACING), Math.round(z / LAMP_SPACING))
      const held = this.cells.get(key)
      if (held) held.push([x, hang, z])
      else this.cells.set(key, [[x, hang, z]])
    }
  }

  /**
   * How much fitting-light reaches a point.
   *
   * Only the cells around the point are looked in, so a promenade with two
   * hundred fittings costs a vertex no more than a cabin with one: the grid is
   * regular, and a lamp more than one cell away is out of reach by construction.
   */
  private pool(x: number, y: number, z: number): number {
    let total = 0
    const gx = Math.round(x / LAMP_SPACING)
    const gz = Math.round(z / LAMP_SPACING)

    // A fitting in cell `i` is keyed `i + 1` — the cells are indexed by their
    // centres — and one can be in reach from two cells away on that side and one
    // on the other. Anything outside that window is beyond `LIGHT.reach` by
    // arithmetic, so the window is a shortcut and not an approximation.
    for (let i = gx - 1; i <= gx + 2; i++) {
      for (let j = gz - 1; j <= gz + 2; j++) {
        const held = this.cells.get(cellKey(i, j))
        if (!held) continue
        for (const [lx, ly, lz] of held) {
          const distance = Math.hypot(x - lx, y - ly, z - lz)
          if (distance >= LIGHT.reach) continue
          // Squared falloff, cut off at the reach rather than trailing to zero:
          // a lamp two rooms down a corridor must not light this floor at all.
          const fall = 1 - distance / LIGHT.reach
          total += fall * fall
        }
      }
    }
    return total
  }

  /** The albedo multiplier at a point, given how open to the room it is. */
  private lit(openness: number, gain: number, x: number, y: number, z: number): number {
    return openness * (this.fill + gain * this.lamps * this.pool(x, y, z))
  }

  /**
   * How much of the room a point on the floor or the ceiling can see.
   *
   * Ambient occlusion, from the one measurement a footprint can give cheaply: the
   * distance to the nearest wall. It is not a hemisphere integral and does not
   * pretend to be — but the thing it gets right is the thing that matters, which
   * is that corners are darker than the middle of the room, and that is what tells
   * the eye a room has a shape.
   */
  private openness(x: number, z: number): number {
    const reach = clamp01(distanceToBoundary([x, z], this.footprint) / LIGHT.openReach)
    return LIGHT.openFloor + (1 - LIGHT.openFloor) * reach ** 0.7
  }

  /**
   * A horizontal surface, off the cache when it is at the height the cache is
   * for. The cap of a coffin is horizontal too and stands at its own height, so
   * it is measured rather than looked up.
   */
  private flat(which: 0 | 1, gain: number, x: number, y: number, z: number): number {
    const cacheable = y === (which === 0 ? this.floorY : this.ceilingY)
    // Two rounded coordinates in one number: the ship is 175 m long and its
    // rooms sit within a few hundred metres of the origin, so a decimetre grid
    // is nowhere near the precision a double gives up.
    const key = Math.round(x * 10) * 100000 + Math.round(z * 10)
    if (cacheable) {
      const held = this.shaded[which].get(key)
      if (held !== undefined) return held
    }

    const shade = this.lit(this.openness(x, z), gain, x, y, z)
    if (cacheable) this.shaded[which].set(key, shade)
    return shade
  }

  floor(x: number, y: number, z: number): number {
    return this.flat(0, LIGHT.floor, x, y, z)
  }

  ceiling(x: number, y: number, z: number): number {
    return this.flat(1, LIGHT.ceiling, x, y, z)
  }

  /**
   * A vertical surface: a wall, a lintel, the side of a solid.
   *
   * `from` and `to` are the surface's own bottom and top, so the crease is at the
   * foot of a coffin as well as at the foot of a bulkhead, and `endDistance` is
   * how far along the run the point is from the nearer end of it — the jamb of a
   * doorway and the corner of a room both darken by it.
   */
  wall(x: number, y: number, z: number, from: number, to: number, endDistance = Infinity): number {
    const low = clamp01((y - from) / LIGHT.crease)
    const high = clamp01((to - y) / LIGHT.crease)
    const ends = clamp01(endDistance / LIGHT.crease)
    const shade = Math.min(low, high, ends) ** 0.8
    return this.lit(LIGHT.creaseFloor + (1 - LIGHT.creaseFloor) * shade, LIGHT.wall, x, y, z)
  }
}

/** What a vertex of a surface is multiplied by. Baked once, per `RoomLight`. */
type Shade = (x: number, y: number, z: number) => number

class MeshBuilder {
  readonly positions: number[] = []
  readonly normals: number[] = []
  readonly colors: number[] = []

  triangle(
    a: readonly [number, number, number],
    b: readonly [number, number, number],
    c: readonly [number, number, number],
    colour: Rgb,
    shade?: Shade,
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
      const light = shade ? shade(vertex[0], vertex[1], vertex[2]) : 1
      this.colors.push(colour[0] * light, colour[1] * light, colour[2] * light)
    }
  }

  /**
   * A horizontal triangle — a piece of floor or of ceiling — cut to the patch
   * size before it is written, so the bake has vertices to vary over.
   *
   * `up` picks which way it faces: the floor and the ceiling of a room are the
   * same triangulated footprint at two heights, wound opposite ways.
   */
  patch(
    a: Vec2,
    b: Vec2,
    c: Vec2,
    y: number,
    up: boolean,
    colour: Rgb,
    shade?: Shade,
    spacing = PATCH_EDGE,
  ): void {
    for (const [p, q, r] of subdivideTriangle(a, b, c, spacing)) {
      const first: [number, number, number] = [p[0], y, p[1]]
      const second: [number, number, number] = up ? [r[0], y, r[1]] : [q[0], y, q[1]]
      const third: [number, number, number] = up ? [q[0], y, q[1]] : [r[0], y, r[1]]
      this.triangle(first, second, third, colour, shade)
    }
  }

  /**
   * A vertical quad, cut into a grid of patches on the way.
   *
   * A nine-metre bulkhead written as two triangles cannot show the crease where it
   * meets the deck, nor the pool of the fitting hanging in front of it. Cut into
   * roughly two-metre cells, it shows both.
   *
   * **Which way it faces is the argument order.** Wound `start`→`end` and
   * bottom-up, the face normal comes out `(-dz, 0, dx)`: for a polygon wound
   * counter-clockwise in `[x, z]` that points *into* the polygon, and for one
   * wound clockwise, out of it. So a room hands over its walls counter-clockwise
   * — `wallSegments` guarantees it — and a solid, a column and a run of bars hand
   * theirs over clockwise, because the face of a bed has to look away from the
   * bed. There is no material setting that can recover this: the deck is drawn
   * `FrontSide`, and a quad wound the wrong way is not a dark quad, it is a
   * missing one, which is the only way an error here can be seen at all.
   */
  quad(start: Vec2, end: Vec2, bottom: number, top: number, colour: Rgb, shade?: Shade): void {
    const run = Math.hypot(end[0] - start[0], end[1] - start[1])
    const rise = top - bottom
    const across = Math.max(1, Math.ceil(run / (PATCH * COARSE)))
    const up = Math.max(1, Math.ceil(Math.abs(rise) / PATCH))

    const at = (u: number, v: number): [number, number, number] => [
      start[0] + (end[0] - start[0]) * u,
      bottom + rise * v,
      start[1] + (end[1] - start[1]) * u,
    ]

    for (let i = 0; i < across; i++) {
      for (let j = 0; j < up; j++) {
        const u0 = i / across
        const u1 = (i + 1) / across
        const v0 = j / up
        const v1 = (j + 1) / up
        const a = at(u0, v0)
        const b = at(u1, v0)
        const c = at(u1, v1)
        const d = at(u0, v1)
        this.triangle(a, b, c, colour, shade)
        this.triangle(a, c, d, colour, shade)
      }
    }
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
  light: RoomLight,
): void {
  const OFFSET = 0.03
  const horizontal = (a: Vec2, b: Vec2, y: number) => edges.push(a[0], y, a[1], b[0], y, b[1])
  const vertical = (point: Vec2, bottom: number, top: number) =>
    edges.push(point[0], bottom, point[1], point[0], top, point[1])

  // Clockwise, so every face looks out at the room rather than in at the solid:
  // see `MeshBuilder.quad`. `structureWalls` is left alone — collision reads a
  // segment as a line and does not care which end is which — so this is a
  // rendering decision made where the rendering happens, and the outline the
  // visitor bumps into is still the outline that gets drawn.
  const outline = toClockwise(structureFootprint(structure))
  const colour = colourFor(hex(STRUCTURE_COLOURS[structure.kind]), structure.provenance)
  const bottom = tier.elevation + structure.base
  const top = Math.min(bottom + structure.height, tier.elevation + ceilingOf(room, tier))

  // The solid takes the light of the room it stands in, from its own foot to its
  // own top: the lacquer of a coffin and the steel of a spring are lit by the
  // fittings over them and creased where they meet the deck, which is the whole
  // of what tells one from the other without a second material.
  const sides = (x: number, y: number, z: number) => light.wall(x, y, z, bottom, top)
  const facing = (x: number, y: number, z: number) => light.floor(x, y, z)

  // A run of bars is one solid to walk around and a row of uprights to see
  // through: drawn as a slab it would be the wall the cell fronts are not.
  if (structure.kind === 'bars') {
    const railBottom = Math.max(bottom, top - BAR_RAIL)
    for (const bar of grilleBars(structure)) {
      // Each upright is a little solid of its own, and wants the same way round.
      for (const [start, end] of iterateEdges(toClockwise(bar))) {
        builder.quad(start, end, bottom, railBottom, colour, sides)
      }
    }

    // The rail closes the tops of the uprights and gives the run a line to
    // read at a distance, the way a lintel does over a door.
    for (const [start, end] of iterateEdges(outline)) {
      builder.quad(start, end, railBottom, top, colour, sides)
      horizontal(start, end, railBottom + OFFSET)
      horizontal(start, end, top - OFFSET)
    }
    const railCap = triangulate(outline)
    for (let i = 0; i < railCap.length; i += 3) {
      const a = outline[railCap[i]]
      const b = outline[railCap[i + 1]]
      const c = outline[railCap[i + 2]]
      builder.patch(a, b, c, top, true, colour, facing)
    }
    for (const corner of outline) vertical(corner, bottom, top)
    return
  }

  for (const [start, end] of iterateEdges(outline)) {
    builder.quad(start, end, bottom, top, colour, sides)
    vertical(start, bottom, top)
    horizontal(start, end, top - OFFSET)
  }

  const cap = triangulate(outline)
  for (let i = 0; i < cap.length; i += 3) {
    const a = outline[cap[i]]
    const b = outline[cap[i + 1]]
    const c = outline[cap[i + 2]]
    builder.patch(a, b, c, top, true, colour, facing)
    // Hung off the floor, so it is closed underneath as well as on top. Its
    // underside is in shadow, which the crease at its own base already says.
    if (structure.base > 0) {
      builder.patch(a, b, c, bottom, false, colour, sides)
    }
  }
}

/**
 * The bounding sphere of one room's slice of the buffers.
 *
 * Computed here rather than by three.js, because `computeBoundingSphere` reads
 * the whole attribute: every room sharing one buffer would come back with the
 * bounding sphere of the entire deck, and a per-room mesh with the deck's
 * sphere is the same thing that could not be culled before.
 */
function boundsOf(
  positions: number[],
  start: number,
  count: number,
  edges: number[],
  edgeStart: number,
  edgeCount: number,
): { centre: readonly [number, number, number]; radius: number } {
  let minX = Infinity
  let minY = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let maxZ = -Infinity

  const stretch = (source: number[], from: number, points: number) => {
    for (let i = from * 3; i < (from + points) * 3; i += 3) {
      if (source[i] < minX) minX = source[i]
      if (source[i] > maxX) maxX = source[i]
      if (source[i + 1] < minY) minY = source[i + 1]
      if (source[i + 1] > maxY) maxY = source[i + 1]
      if (source[i + 2] < minZ) minZ = source[i + 2]
      if (source[i + 2] > maxZ) maxZ = source[i + 2]
    }
  }
  stretch(positions, start, count)
  stretch(edges, edgeStart, edgeCount)

  if (minX > maxX) return { centre: [0, 0, 0], radius: 0 }
  const centre: readonly [number, number, number] = [
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2,
  ]
  // The half-diagonal of the box, which encloses it whatever shape it is.
  return {
    centre,
    radius: Math.hypot(maxX - centre[0], maxY - centre[1], maxZ - centre[2]),
  }
}

/** The baked light of one room, as both the deck and a loose solid read it. */
function lightOf(space: Space, tier: Tier): RoomLight {
  return new RoomLight(
    space.footprint,
    tier.elevation,
    tier.elevation + ceilingOf(space, tier),
    space.provenance,
  )
}

/** That same solid on its own, for the Hatsu layer to draw and move. */
export function buildSolidMesh(structure: Structure, room: Space, tier: Tier): TierMesh {
  const builder = new MeshBuilder()
  const edges: number[] = []
  // The same light the deck baked into it, rebuilt for the room it was lifted
  // out of: a coffin carried across the burial chamber keeps the chamber's
  // fittings on it rather than turning into a flat silhouette the moment a
  // technique picks it up.
  extrudeSolid(builder, edges, structure, room, tier, lightOf(room, tier))
  const count = builder.positions.length / 3
  const edgeCount = edges.length / 3
  return {
    positions: new Float32Array(builder.positions),
    normals: new Float32Array(builder.normals),
    colors: new Float32Array(builder.colors),
    edges: new Float32Array(edges),
    seams: new Float32Array(0),
    // A solid lifted out of its deck by a technique takes the room's light with
    // it, not the room's lamps: the fittings stay on the ceiling they hang from.
    fittings: new Float32Array(0),
    fittingColors: new Float32Array(0),
    triangles: builder.positions.length / 9,
    groups: [
      {
        spaceId: room.id,
        start: 0,
        count,
        edgeStart: 0,
        edgeCount,
        seamStart: 0,
        seamCount: 0,
        fittingStart: 0,
        fittingCount: 0,
        ...boundsOf(builder.positions, 0, count, edges, 0, edgeCount),
      },
    ],
  }
}

/**
 * Builds every triangle of one deck, room by room.
 *
 * The passes used to run over the whole deck at a time — every floor, then
 * every wall, then every column — which put one room's geometry in half a dozen
 * places in the buffer. Grouping by room instead costs nothing at build time
 * and is what makes each room drawable on its own: see `MeshGroup`.
 */
export function buildTierMesh(plan: TierPlan, options: { reveal?: boolean } = {}): TierMesh {
  const builder = new MeshBuilder()
  const { tier } = plan
  const reveal = options.reveal ?? false
  const spaces = new Map(plan.spaces.map((space) => [space.id, space]))
  const heightOf = (space: Space) => tier.elevation + ceilingOf(space, tier)

  const edges: number[] = []
  const seams: number[] = []
  const fittings: number[] = []
  const fittingColors: number[] = []
  // Pulled a hair off the surface so the line is not fighting the polygon it
  // sits on for the same depth value.
  const OFFSET = 0.03
  const horizontal = (a: Vec2, b: Vec2, y: number) => edges.push(a[0], y, a[1], b[0], y, b[1])
  const vertical = (point: Vec2, bottom: number, top: number) =>
    edges.push(point[0], bottom, point[1], point[0], top, point[1])

  /**
   * One fitting: a square hung flat, facing the floor.
   *
   * Wound so the normal comes out downward, because that is the only side of it
   * anyone stands on. The 35 cm `fittingHeight` leaves under the ceiling is what
   * keeps this off the ceiling plane — a quad coplanar with the surface above it
   * would fight for the depth buffer, which is the thing `FrontSide` was brought
   * in to stop.
   */
  const fitting = (x: number, y: number, z: number, glow: Rgb) => {
    const h = FITTING_SIZE / 2
    const corners: Vec2[] = [
      [x - h, z - h],
      [x + h, z - h],
      [x + h, z + h],
      [x - h, z + h],
    ]
    for (const [a, b, c] of [
      [corners[0], corners[1], corners[2]],
      [corners[0], corners[2], corners[3]],
    ]) {
      fittings.push(a[0], y, a[1], b[0], y, b[1], c[0], y, c[1])
      for (let vertex = 0; vertex < 3; vertex++) {
        fittingColors.push(glow[0], glow[1], glow[2])
      }
    }
  }

  // Room walls and column faces arrive in the same list, which is the point:
  // the visitor collides with exactly what is drawn here. The faces of a solid
  // standing in a room are in that list too, for the same reason, but they are
  // raised by the structure pass below: extruded to the ceiling like a wall, a
  // bed would be a partition.
  //
  // They are taken exactly as they come, ends included: `wallSegments` hands a
  // room's walls over counter-clockwise and `columnWalls` hands a pillar's faces
  // over clockwise, which is what makes both of them face the hall out of the
  // same builder. Reordering this list would turn a wall inside out.
  const wallsOf = new Map<string, WallSegment[]>()
  for (const wall of plan.walls) {
    // A solid's face is raised by the structure pass and a doorway's cheek by the
    // doorway pass; extruded to the ceiling here, the first would be a partition
    // and the second would wall the opening up.
    if (wall.structureId || wall.jambOf) continue
    const held = wallsOf.get(wall.spaceId)
    if (held) held.push(wall)
    else wallsOf.set(wall.spaceId, [wall])
  }

  const standingIn = new Map<string, Structure[]>()
  for (const structure of plan.structures) {
    const held = standingIn.get(structure.spaceId)
    if (held) held.push(structure)
    else standingIn.set(structure.spaceId, [structure])
  }

  // A lintel belongs to one of the two rooms it spans, and either would do: the
  // rooms are adjacent by construction, so a visibility set that holds one
  // holds the other.
  const lintelsOf = new Map<string, Doorway[]>()
  for (const door of plan.doorways) {
    const held = lintelsOf.get(door.a)
    if (held) held.push(door)
    else lintelsOf.set(door.a, [door])
  }

  // The cheeks, taken back out of the collision list rather than recomputed, so
  // the segments drawn are the very objects the visitor is stopped by.
  const jambsOf = new Map<string, WallSegment[]>()
  for (const wall of plan.walls) {
    if (!wall.jambOf) continue
    const held = jambsOf.get(wall.jambOf)
    if (held) held.push(wall)
    else jambsOf.set(wall.jambOf, [wall])
  }

  const groups: MeshGroup[] = []

  for (const space of plan.spaces) {
    const start = builder.positions.length / 3
    const edgeStart = edges.length / 3
    const seamStart = seams.length / 3
    const fittingStart = fittings.length / 3

    const floorColour = reveal
      ? revealed(space.provenance, 0.62)
      : colourFor(hex(CATEGORY_COLOURS[space.category]), space.provenance)
    const ceilingColour = reveal
      ? revealed(space.provenance, 0.82)
      : colourFor(CEILING_COLOUR, space.provenance)
    const top = heightOf(space)
    const indices = triangulate(space.footprint)
    // Every surface of this room is shaded by this one object: the fittings of
    // the room, the corners of the room, and how much light a room the
    // reconstruction invented is allowed to claim.
    const light = lightOf(space, tier)
    /**
     * The bake, unless the reveal is on.
     *
     * Under the reveal a surface is not a surface any more, it is a badge: the
     * colour *is* the claim, and a legend read through a light gradient is a
     * legend you have to allow for. So the doctrine view takes the colours flat
     * and exact — which is also what lets it be checked, colour for colour,
     * against the palette the sources page publishes.
     */
    const bake = (shade: Shade): Shade | undefined => (reveal ? undefined : shade)

    for (let i = 0; i < indices.length; i += 3) {
      const a = space.footprint[indices[i]]
      const b = space.footprint[indices[i + 1]]
      const c = space.footprint[indices[i + 2]]

      // Floor faces up, ceiling faces down: the winding is simply reversed.
      builder.patch(
        a,
        b,
        c,
        tier.elevation,
        true,
        floorColour,
        bake((x, y, z) => light.floor(x, y, z)),
      )
      builder.patch(
        a,
        b,
        c,
        top,
        false,
        ceilingColour,
        bake((x, y, z) => light.ceiling(x, y, z)),
        // Left whole: see `PATCH` for why a lattice up here buys nothing.
        Infinity,
      )
    }

    // The plating, laid on the ship's grid and clipped to this room. Lifted off
    // the floor by the same hair the wall lines are, so it is not fighting the
    // deck for the same depth value.
    for (const [from, to] of plateSeams(space.footprint)) {
      seams.push(from[0], tier.elevation + OFFSET, from[1], to[0], tier.elevation + OFFSET, to[1])
    }

    /**
     * The fittings, which the bake has been reading off the same grid all along
     * and which nothing has drawn until now.
     *
     * A lit room with no visible lamp is a box that happens to be bright: the
     * pool on the floor says *that* there is light and never *where from*, and
     * the eye has nothing to measure the room against. Two triangles a fitting
     * fixes that, and it is the cheapest thing on this list by a long way — 3 065
     * fittings on the whole ship, 6 130 triangles against the 289 213 it already
     * draws, and one more draw call per room.
     *
     * Not under the reveal, for the reason the bake is not: there, every surface
     * has to say what it is worth as evidence, and a quad drawn as a light says
     * nothing about the sources. The fittings are derived — the plans no more draw
     * a lamp than they draw a pillar — so they belong to the walk, not the
     * doctrine.
     */
    if (!reveal) {
      const hang = fittingHeight(tier.elevation, top)
      // Dimmed by exactly what dims the pools: a corridor nobody drew gets both
      // its lamps and its lamplight at `LIGHT.inferredLamps`, so walking into an
      // invented part of the ship stays the one thing you can feel rather than a
      // legend you have to know.
      const burn = space.provenance === 'inferred' ? LIGHT.inferredLamps : 1
      const glow: Rgb = [FITTING_GLOW[0] * burn, FITTING_GLOW[1] * burn, FITTING_GLOW[2] * burn]
      for (const [x, z] of ceilingLamps(space.footprint)) fitting(x, hang, z, glow)
    }

    for (const wall of wallsOf.get(space.id) ?? []) {
      // Under the reveal a wall says one of two things: what the room is worth
      // as evidence, or — where the blueprint declared it blind — that the walk
      // shut it on purpose, which is a claim about the ship in its own right.
      const declaredBlind = reveal && plan.blind.some((seal) => runsAlong(wall, seal))
      const wallColour = declaredBlind
        ? BLIND_COLOUR
        : reveal
          ? revealed(space.provenance, 0.45)
          : colourFor(WALL_COLOUR, space.provenance)
      // The badge takes the baked light like any other albedo: the reveal is a
      // change of what the surfaces mean, not of how the room is lit, and a
      // doctrine painted in flat colour would lose the very corners and creases
      // that let you see which surface you are being shown.
      //
      // `run` is how far along the wall a point is from the nearer end of it, so
      // a corner and a door jamb both darken.
      const run = Math.hypot(wall.end[0] - wall.start[0], wall.end[1] - wall.start[1])
      builder.quad(
        wall.start,
        wall.end,
        tier.elevation,
        top,
        wallColour,
        bake((x, y, z) => {
          const along = Math.hypot(x - wall.start[0], z - wall.start[1])
          return light.wall(x, y, z, tier.elevation, top, Math.min(along, run - along))
        }),
      )
      horizontal(wall.start, wall.end, tier.elevation + OFFSET)
      horizontal(wall.start, wall.end, top - OFFSET)
    }

    // Columns get a cap so you are not looking up an open shaft, and a brighter
    // face than the walls so they read as structure at a distance.
    const colour = reveal
      ? revealed(space.provenance, 0.3)
      : colourFor(COLUMN_COLOUR, space.provenance)
    const h = COLUMN_HALF_WIDTH
    for (const centre of plan.columns.get(space.id) ?? []) {
      const corners: Vec2[] = [
        [centre[0] - h, centre[1] - h],
        [centre[0] + h, centre[1] - h],
        [centre[0] + h, centre[1] + h],
        [centre[0] - h, centre[1] + h],
      ]
      const cap = bake((x: number, y: number, z: number) => light.ceiling(x, y, z))
      builder.patch(corners[0], corners[1], corners[2], top, false, colour, cap)
      builder.patch(corners[0], corners[2], corners[3], top, false, colour, cap)
      // A column's faces are in the wall list, so they are drawn by the pass
      // above; what is left is the cap and the arrises.
      for (const corner of corners) vertical(corner, tier.elevation, top)
    }

    // What stands in the room. Its sides are already in `plan.walls`, so this
    // only has to raise them: the same outline, extruded to its own height and
    // capped, and never taller than the room it stands in.
    for (const structure of standingIn.get(space.id) ?? []) {
      extrudeSolid(builder, edges, structure, space, tier, light)
    }

    // Above each opening the wall carries on to the ceiling, so a doorway reads
    // as a door and not as a room with a side missing.
    for (const door of lintelsOf.get(space.id) ?? []) {
      const other = spaces.get(door.b)
      if (!other) continue
      const lintelTop = Math.max(top, heightOf(other))
      const lintelBottom = tier.elevation + DOOR_HEIGHT

      const provenance: Provenance =
        space.provenance === 'inferred' || other.provenance === 'inferred'
          ? 'inferred'
          : space.provenance
      // The one hundred and fifty-six openings the blueprint places by hand are
      // the only doorways nothing derives, so the reveal marks them: everything
      // else in the ship opened because two footprints touch.
      const lintelColour =
        reveal && plan.declared.has(sealKey(door.a, door.b))
          ? DECLARED_COLOUR
          : reveal
            ? revealed(provenance, 0.45)
            : colourFor(WALL_COLOUR, provenance)
      // Both ways round, because a lintel is the one surface on the deck with a
      // room on either side of it and only one entry in the buffers. A wall is
      // drawn twice over — once by each of the two rooms that share it, which is
      // what lets each take its own room's light — but a lintel belongs to
      // `door.a` alone, and drawn once it would be a hole in the ceiling of
      // `door.b`. Three hundred and sixty-eight openings at three triangles
      // each: 1 168 on the whole ship, against the 288 045 it already drew.
      if (lintelTop > lintelBottom) {
        const lintel = (from: Vec2, to: Vec2) =>
          builder.quad(
            from,
            to,
            lintelBottom,
            lintelTop,
            lintelColour,
            bake((x, y, z) => light.wall(x, y, z, lintelBottom, lintelTop)),
          )
        lintel(door.start, door.end)
        lintel(door.end, door.start)
      }

      /**
       * The depth of the opening: two cheeks and a soffit.
       *
       * Until now a doorway was a hole in a plane of no thickness — you crossed a
       * sheet of paper, and the one moment in the walk that ought to say "steel"
       * said nothing at all. The cheeks are already in `plan.walls`, so this pass
       * only has to raise them to head height, and what you collide with is by
       * construction what is drawn.
       *
       * The soffit closes the top. It is only drawn where there is a lintel over
       * it — in a room whose ceiling is exactly `DOOR_HEIGHT` the two would be
       * coplanar, and the opening runs the full height of the wall there anyway.
       */
      for (const cheek of jambsOf.get(sealKey(door.a, door.b)) ?? []) {
        builder.quad(
          cheek.start,
          cheek.end,
          tier.elevation,
          lintelBottom,
          lintelColour,
          bake((x, y, z) => light.wall(x, y, z, tier.elevation, lintelBottom)),
        )
        vertical(cheek.start, tier.elevation, lintelBottom)
        vertical(cheek.end, tier.elevation, lintelBottom)
      }

      if (lintelTop > lintelBottom) {
        const soffit = doorSoffit(door)
        const under = bake((x: number, y: number, z: number) => light.ceiling(x, y, z))
        for (let i = 1; i + 1 < soffit.length; i++) {
          builder.patch(
            soffit[0],
            soffit[i],
            soffit[i + 1],
            lintelBottom,
            false,
            lintelColour,
            under,
            Infinity,
          )
        }
        horizontal(door.start, door.end, lintelBottom + OFFSET)
      }
    }

    const count = builder.positions.length / 3 - start
    const edgeCount = edges.length / 3 - edgeStart
    const seamCount = seams.length / 3 - seamStart
    const fittingCount = fittings.length / 3 - fittingStart
    if (!count && !edgeCount) continue
    groups.push({
      spaceId: space.id,
      start,
      count,
      edgeStart,
      edgeCount,
      seamStart,
      seamCount,
      fittingStart,
      fittingCount,
      ...boundsOf(builder.positions, start, count, edges, edgeStart, edgeCount),
    })
  }

  return {
    positions: new Float32Array(builder.positions),
    normals: new Float32Array(builder.normals),
    colors: new Float32Array(builder.colors),
    edges: new Float32Array(edges),
    seams: new Float32Array(seams),
    fittings: new Float32Array(fittings),
    fittingColors: new Float32Array(fittingColors),
    triangles: builder.positions.length / 9,
    groups,
  }
}
