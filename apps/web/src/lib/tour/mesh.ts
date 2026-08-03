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
  distanceToBoundary,
  doorSoffit,
  grilleBars,
  iterateEdges,
  lanternRect,
  plateSeams,
  sealKey,
  structureFootprint,
  subdivideTriangle,
  toClockwise,
  triangulate,
} from './geometry'
import { ceilingOf, floorOf } from './blueprint'
import { hex, lamplightOf, lampsOf } from './light'
import type { Lamplight, Rgb } from './light'
import type { BlindWall, TierPlan } from './blueprint'
import type {
  Doorway,
  Polygon,
  Provenance,
  Segment,
  Space,
  SpaceCategory,
  Structure,
  StructureKind,
  Tier,
  Triangle,
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
  /**
   * And of the window glass, which is zero for 312 of the 314 spaces.
   *
   * Its own range rather than more of the fittings' because the glass is the one
   * surface on the deck whose colour is not settled at bake time: it is the hour
   * of the voyage, and the hour changes with the event the walk projects. See
   * `panes`.
   */
  paneStart: number
  paneCount: number
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
  /**
   * The glass of the two windows, in its own buffer.
   *
   * It used to be in `fittings`, which was right as long as the only question
   * that buffer answered was *which surfaces are sources*. It is not right once
   * the sky has an hour: a fitting burns at a value the bake settled — the
   * room's own filament, dimmed by what an invented room may claim — and the
   * glass burns at whatever is outside it, which is a fact about the voyage
   * clock and not about the deck. Two claims, two buffers, and the one that
   * changes is the small one: a few dozen triangles in two rooms.
   */
  panes: Float32Array
  /**
   * What each pane vertex is worth **relative to the sky**: 1 above the horizon,
   * `SEA_FRACTION` below it.
   *
   * Relative and not absolute, which is the whole of chantier C. The material's
   * own colour carries the hour — `skyOf(...).glow` — and this carries the one
   * thing about the glass the hour does not change: that the water gives back
   * 45 % of whatever the sky is doing. So the bake stays pure and deterministic,
   * midnight and noon are the same buffer, and changing the hour is one
   * `material.color.set` rather than a rebuild of the deck.
   */
  paneColors: Float32Array
  /** Triangle count, for a sanity check and for the debug read-out. */
  triangles: number
  /** Where each room's geometry sits in the buffers above, in plan order. */
  groups: MeshGroup[]
}

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
  // The frame, not the glass. What is seen through the opening is the emissive
  // pane the room draws in front of this — see `WINDOW_GLOW`.
  window: 0x14181e,
  lifeboat: 0x8a8f96,
  pillar: 0x6a5a4a,
  bars: 0x7f868e,
  manacle: 0x6f6250,
  camera: 0x22262a,
  telephone: 0x2a2622,
  duct: 0x3a3d42,
  // Darker than the ducting it belongs to: a grille is mostly the gaps in it.
  vent: 0x24272b,
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
 * What a window burns at: the sky of the Dark Continent, and it is cold.
 *
 * Every other source on the ship is a filament — `LAMP_PEAK` is taken above
 * white for the same reason this is: nothing on a display is brighter than white,
 * so what makes a surface read as a *source* rather than as a pale square is that
 * it saturates before its surroundings do, and the filmic curve in `TourScene`
 * rolls it off rather than clipping it. Every lamp on board is warm because a lamp
 * of the period is warm, and the whole interior is lit by nothing else.
 * The two windows are the exception, so they are the exception here too: the same
 * trick of sitting above white, in the opposite direction on the spectrum. Walk
 * into one of those two rooms and the light is a different colour from the light
 * everywhere else on board, which is the entire point of drawing them at all.
 *
 * Lower than a fitting, and by a good margin. A window is not a lamp — it is a
 * grey daylight the ship is carrying towards a continent nobody comes back from —
 * and 36 m of pane at a fitting's intensity would be the brightest thing in the
 * reconstruction by two orders of area.
 */
export const WINDOW_GLOW: Rgb = [0.62, 0.86, 1.28]

/**
 * What the bottom of a window burns at, because the bottom of it is the sea.
 *
 * The Black Whale sails. The panel of the observation deck draws the bay full of
 * cloud with the water under it and the container city of the lower tiers between
 * the two, and a pane painted one flat value from sill to head says the ship is
 * flying through an even sky — which is the one thing the panel does not show.
 *
 * Derived from `WINDOW_GLOW` rather than picked, because that is the honest
 * relation: what is below the horizon is the same sky, reflected off a surface
 * that swallows most of it. So the hue is the sky's and only the value falls, and
 * it falls below white — the water is bright against the steel of the room and it
 * does not burn the way the cloud above it does.
 *
 * The fraction is exported because it is the relation rather than the value: the
 * pane is baked with the two bands *relative* to each other — see `pane` — and
 * `$lib/tour/sky` applies the same 45 % at every hour of the day, because a
 * relation that is honest at noon does not become false at dusk.
 */
export const SEA_FRACTION = 0.45

export const SEA_GLOW: Rgb = [
  WINDOW_GLOW[0] * SEA_FRACTION,
  WINDOW_GLOW[1] * SEA_FRACTION,
  WINDOW_GLOW[2] * SEA_FRACTION,
]

/**
 * Where the horizon crosses the glass: the visitor's own eye, and no higher.
 *
 * The horizon is at infinity, so it meets a pane at the height of the eye looking
 * through it and at no other height — a metre from the glass or thirty, standing
 * on Tier 3 or in the King's living room sixty-five metres above it, the water
 * ends on the level of your eyes. The Earth's curve would put it a quarter of a
 * degree lower from this high up, which is nine millimetres on a pane two metres
 * away, and the pane is not drawn to nine millimetres.
 *
 * So this is `EYE_HEIGHT` in `TourScene`, and it is a constant here for the
 * reason the pane is static geometry: the mesh is baked once, and a visitor who
 * takes a shorter body — see `eyesOf` — moves their eye without moving the sea.
 * That error is centimetres on a band that is 0,7 m of a 6 m opening, and the
 * alternative is rebuilding the deck every time someone changes bodies.
 */
export const HORIZON = 1.7

/**
 * How far a window throws, and how finely its pane is sampled as a source.
 *
 * A fitting is a point and reaches `LIGHT.reach`; a window is a surface up to
 * 36 m long, and a point source at its middle would light the centre of the
 * observation deck and leave both ends of the same glass dark. So the pane is cut
 * into sources every `WINDOW_SAMPLE` metres and each one throws its own pool —
 * which is what a surface light is, done in the only place this bake can afford
 * it: two rooms out of 314.
 *
 * The reach is twice a fitting's because the opening is: 6 m of glass over the
 * observation deck is not a lamp on a ceiling grid, and daylight that stopped 9 m
 * in would read as a lamp hung against the glass.
 */
export const WINDOW_REACH = 18
export const WINDOW_SAMPLE = 2.5

/**
 * What one sample of pane is worth against one fitting.
 *
 * A run of samples sums, so the weight is per sample and not per window: at this
 * value a floor two metres inside the great window takes about what two fittings
 * would give it, and the far end of the observation deck takes nothing. The sky
 * is dim, there is a great deal of it, and it falls off — all three are true of
 * the thing being modelled.
 */
const WINDOW_WEIGHT = 0.4

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value)

/**
 * A window's pane, cut into the point sources the bake reads.
 *
 * The long faces of the solid are the glass — a window is a thin rectangle laid
 * along the wall it is in — so the sources run along the longer axis of the
 * footprint, at the middle of the opening's height. Its own function rather than
 * a loop inside `RoomLight`, because the mesh has to draw the pane in exactly the
 * places the light comes from, which is the same bargain `fittingHeight` settles
 * for the ceiling fittings.
 */
export function windowSources(structure: Structure, floorY: number): [number, number, number][] {
  const outline = structureFootprint(structure)
  let longest: [Vec2, Vec2] | null = null
  let span = 0
  for (const [a, b] of iterateEdges(outline)) {
    const run = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (run > span) {
      span = run
      longest = [a, b]
    }
  }
  if (!longest || span < EPSILON) return []

  const [a, b] = longest
  const y = floorY + structure.base + structure.height / 2
  const steps = Math.max(1, Math.round(span / WINDOW_SAMPLE))
  const sources: [number, number, number][] = []
  // Sampled at the middle of each step rather than at its ends, so a 9 m pane
  // gives four sources spread over it and not five with two on the corners.
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps
    sources.push([a[0] + (b[0] - a[0]) * t, y, a[1] + (b[1] - a[1]) * t])
  }
  return sources
}

/** Two grid indices in one number, so the fittings are not keyed by strings. */
const cellKey = (i: number, j: number) => i * 4096 + j

/** A point in the world, in metres: `[x, y, z]`, `y` up. */
type Vec3 = readonly [number, number, number]

/** A room as its light reads it: its outline, its two heights, and its sky. */
interface LitRoom {
  footprint: Polygon
  floorY: number
  ceilingY: number
  /** How much light a room the reconstruction invented is allowed to claim. */
  provenance: Provenance
  /** The grid it hangs its lamps on, and what they burn at: see `light.ts`. */
  lamplight: Lamplight
  sky?: readonly Vec3[]
}

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

  private readonly footprint: Polygon
  /**
   * The sky, where the room has any: `windowSources` of every window in it.
   *
   * Empty for 312 of the 314 spaces, which is why it is a plain array walked in
   * full rather than bucketed on the fitting grid — the two rooms that do have
   * one have a single window each, and the cost of the loop is the cost of the
   * two of them.
   */
  private readonly sky: readonly Vec3[]

  /**
   * The grid this room's lamps hang on, how far they throw and how hard.
   *
   * The whole of the class system arrives through this one field: a cell on Tier
   * 5 and the King's living room run the same code and come out looking nothing
   * alike, because `lamplightOf` gave them a different grid and a different burn.
   */
  private readonly lamplight: Lamplight

  constructor(room: LitRoom) {
    const { footprint, floorY, ceilingY, provenance, lamplight, sky = [] } = room
    this.footprint = footprint
    this.sky = sky
    this.lamplight = lamplight
    const inferred = provenance === 'inferred'
    this.fill = LIGHT.fill * (inferred ? LIGHT.inferredFill : 1)
    this.lamps = (inferred ? LIGHT.inferredLamps : 1) * lamplight.power
    this.floorY = floorY
    this.ceilingY = ceilingY

    const hang = fittingHeight(floorY, ceilingY)
    const { spacing } = lamplight
    for (const [x, z] of lampsOf(footprint, lamplight)) {
      const key = cellKey(Math.round(x / spacing), Math.round(z / spacing))
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
    const { spacing, reach } = this.lamplight
    const gx = Math.round(x / spacing)
    const gz = Math.round(z / spacing)

    // A fitting in cell `i` is keyed `i + 1` — the cells are indexed by their
    // centres — and one can be in reach from two cells away on that side and one
    // on the other. Anything outside that window is beyond the reach by
    // arithmetic, so the window is a shortcut and not an approximation. That is
    // what `REACH_RATIO` is holding still: the reach follows the grid, so this
    // window is right on a royal deck's 5,6 m grid and in the hold's 22 m one.
    for (let i = gx - 1; i <= gx + 2; i++) {
      for (let j = gz - 1; j <= gz + 2; j++) {
        const held = this.cells.get(cellKey(i, j))
        if (!held) continue
        for (const [lx, ly, lz] of held) {
          const distance = Math.hypot(x - lx, y - ly, z - lz)
          if (distance >= reach) continue
          // Squared falloff, cut off at the reach rather than trailing to zero:
          // a lamp two rooms down a corridor must not light this floor at all.
          const fall = 1 - distance / reach
          total += fall * fall
        }
      }
    }
    return total
  }

  /**
   * How much daylight reaches a point, summed over the pane.
   *
   * Outside `this.lamps` on purpose: a room the reconstruction invented gets a
   * fifth of its lamplight because the plans put no lamp there, and that argument
   * says nothing about a window — a window is declared in the blueprint, and the
   * two that exist stand in rooms a panel draws. Nothing invented has one, and if
   * anything ever did, the sky would still not be dimmed by our not having drawn
   * the corridor it shines down.
   */
  private daylight(x: number, y: number, z: number): number {
    let total = 0
    for (const [sx, sy, sz] of this.sky) {
      const distance = Math.hypot(x - sx, y - sy, z - sz)
      if (distance >= WINDOW_REACH) continue
      const fall = 1 - distance / WINDOW_REACH
      total += fall * fall
    }
    return total * WINDOW_WEIGHT
  }

  /**
   * How much light of any kind arrives at a point: the fittings, weighted by
   * what a room the reconstruction invented is allowed to claim, plus the sky.
   *
   * Kept apart from the albedo so that the multiplier itself — `openness *
   * (fill + gain * sources)` — is written where the surface's own `gain` is
   * already in hand, and no call has to carry both a point and a surface.
   */
  private sourcesAt(x: number, y: number, z: number): number {
    return this.lamps * this.pool(x, y, z) + this.daylight(x, y, z)
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
   * The shader for a horizontal surface — a floor or a ceiling — with its gain
   * and its cache bound once rather than passed per vertex.
   *
   * A shader and not a measurement because the surface's own constants are the
   * same for every one of its vertices: binding them here is what keeps the
   * per-vertex call down to the point itself, with nothing allocated to carry
   * it. Off the cache when the surface is at the height the cache is for — the
   * cap of a coffin is horizontal too and stands at its own height, so it is
   * measured rather than looked up.
   */
  private horizontal(which: 0 | 1, gain: number): Shade {
    return (x, y, z) => {
      const cacheable = y === (which === 0 ? this.floorY : this.ceilingY)
      // Two rounded coordinates in one number: the ship is 175 m long and its
      // rooms sit within a few hundred metres of the origin, so a decimetre grid
      // is nowhere near the precision a double gives up.
      const key = Math.round(x * 10) * 100000 + Math.round(z * 10)
      if (cacheable) {
        const held = this.shaded[which].get(key)
        if (held !== undefined) return held
      }

      const shade = this.openness(x, z) * (this.fill + gain * this.sourcesAt(x, y, z))
      if (cacheable) this.shaded[which].set(key, shade)
      return shade
    }
  }

  readonly floor: Shade = this.horizontal(0, LIGHT.floor)

  readonly ceiling: Shade = this.horizontal(1, LIGHT.ceiling)

  /**
   * The shader for a vertical surface: a wall, a lintel, the side of a solid.
   *
   * `from` and `to` are the surface's own bottom and top, so the crease is at the
   * foot of a coffin as well as at the foot of a bulkhead. `endFalloff` gives how
   * far along the run a point is from the nearer end of it — the jamb of a
   * doorway and the corner of a room both darken by it — and is a function of the
   * point because, unlike the span, it is the one part that varies across the
   * surface. Left out, the surface has no ends to darken towards.
   */
  wall(from: number, to: number, endFalloff?: (x: number, z: number) => number): Shade {
    return (x, y, z) => {
      const low = clamp01((y - from) / LIGHT.crease)
      const high = clamp01((to - y) / LIGHT.crease)
      const ends = clamp01((endFalloff ? endFalloff(x, z) : Infinity) / LIGHT.crease)
      const shade = Math.min(low, high, ends) ** 0.8
      const openness = LIGHT.creaseFloor + (1 - LIGHT.creaseFloor) * shade
      return openness * (this.fill + LIGHT.wall * this.sourcesAt(x, y, z))
    }
  }
}

/** What a vertex of a surface is multiplied by. Baked once, per `RoomLight`. */
type Shade = (x: number, y: number, z: number) => number

/** Three corners of one written triangle, in the order they are wound. */
type Corners = readonly [Vec3, Vec3, Vec3]

/**
 * How a surface is coloured: its albedo, and the bake that varies it per
 * vertex. `shade` is left out under the reveal, where the colour *is* the claim
 * and a gradient over it would be something to allow for.
 */
interface Paint {
  colour: Rgb
  shade?: Shade
}

/** The height a horizontal surface sits at, and which way it faces. */
interface Plane {
  y: number
  /**
   * Up for a floor, down for a ceiling: the two are the same triangulated
   * footprint at two heights, wound opposite ways.
   */
  up: boolean
  /** The longest edge a piece may keep. `Infinity` writes it whole. */
  spacing?: number
}

/** The bottom and top a vertical surface runs between, in metres. */
interface Span {
  bottom: number
  top: number
}

/**
 * The two buffers a solid is written into: the shaded triangles, and the plain
 * line list that draws its outline over them. They are filled together and by
 * the same pass, so they travel together.
 */
interface Surfaces {
  builder: MeshBuilder
  edges: number[]
}

/** Where a solid stands, and by whose light it is therefore lit. */
interface Standing {
  room: Space
  tier: Tier
  light: RoomLight
}

/**
 * A run of points inside a shared buffer.
 *
 * Every room's geometry lives in one array per deck, so a room is a slice of it
 * rather than an array of its own — and a slice is where it starts and how many
 * points long it is, which is exactly what has to be said to measure one.
 */
interface BufferRun {
  data: number[]
  start: number
  count: number
}

/**
 * Where a lifted solid came from.
 *
 * `standing` is the rest of what is in the room, and it is optional for the same
 * reason it is on `lightOf`: it only changes the answer in the two rooms with a
 * window in them.
 */
interface SolidPlacement {
  room: Space
  tier: Tier
  standing?: readonly Structure[]
}

class MeshBuilder {
  readonly positions: number[] = []
  readonly normals: number[] = []
  readonly colors: number[] = []

  triangle([a, b, c]: Corners, colour: Rgb, shade?: Shade): void {
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
  patch(triangle: Triangle, plane: Plane, paint: Paint): void {
    const { y, up, spacing = PATCH_EDGE } = plane
    for (const [p, q, r] of subdivideTriangle(triangle, spacing)) {
      const first: Vec3 = [p[0], y, p[1]]
      const second: Vec3 = up ? [r[0], y, r[1]] : [q[0], y, q[1]]
      const third: Vec3 = up ? [q[0], y, q[1]] : [r[0], y, r[1]]
      this.triangle([first, second, third], paint.colour, paint.shade)
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
  quad([start, end]: Segment, span: Span, paint: Paint): void {
    const { bottom, top } = span
    const run = Math.hypot(end[0] - start[0], end[1] - start[1])
    const rise = top - bottom
    const across = Math.max(1, Math.ceil(run / (PATCH * COARSE)))
    const up = Math.max(1, Math.ceil(Math.abs(rise) / PATCH))

    const at = (u: number, v: number): Vec3 => [
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
        this.triangle([a, b, c], paint.colour, paint.shade)
        this.triangle([a, c, d], paint.colour, paint.shade)
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
function extrudeSolid(into: Surfaces, structure: Structure, where: Standing): void {
  const { builder, edges } = into
  const { room, tier, light } = where
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
  const baseColour = hex(STRUCTURE_COLOURS[structure.kind])
  const auralised = structure.aura === 'pink' ? blend(baseColour, [1, 0.4, 0.7], 0.5) : baseColour
  const colour = colourFor(auralised, structure.provenance)
  const bottom = floorOf(room, tier) + structure.base
  const top = Math.min(bottom + structure.height, floorOf(room, tier) + ceilingOf(room, tier))

  // The solid takes the light of the room it stands in, from its own foot to its
  // own top: the lacquer of a coffin and the steel of a spring are lit by the
  // fittings over them and creased where they meet the deck, which is the whole
  // of what tells one from the other without a second material.
  const sides = light.wall(bottom, top)
  const facing = light.floor

  // A run of bars is one solid to walk around and a row of uprights to see
  // through: drawn as a slab it would be the wall the cell fronts are not.
  if (structure.kind === 'bars') {
    const railBottom = Math.max(bottom, top - BAR_RAIL)
    for (const bar of grilleBars(structure)) {
      // Each upright is a little solid of its own, and wants the same way round.
      for (const [start, end] of iterateEdges(toClockwise(bar))) {
        builder.quad([start, end], { bottom, top: railBottom }, { colour, shade: sides })
      }
    }

    // The rail closes the tops of the uprights and gives the run a line to
    // read at a distance, the way a lintel does over a door.
    for (const [start, end] of iterateEdges(outline)) {
      builder.quad([start, end], { bottom: railBottom, top }, { colour, shade: sides })
      horizontal(start, end, railBottom + OFFSET)
      horizontal(start, end, top - OFFSET)
    }
    const railCap = triangulate(outline)
    for (let i = 0; i < railCap.length; i += 3) {
      const a = outline[railCap[i]]
      const b = outline[railCap[i + 1]]
      const c = outline[railCap[i + 2]]
      builder.patch([a, b, c], { y: top, up: true }, { colour, shade: facing })
    }
    for (const corner of outline) vertical(corner, bottom, top)
    return
  }

  for (const [start, end] of iterateEdges(outline)) {
    builder.quad([start, end], { bottom, top }, { colour, shade: sides })
    vertical(start, bottom, top)
    horizontal(start, end, top - OFFSET)
  }

  const cap = triangulate(outline)
  for (let i = 0; i < cap.length; i += 3) {
    const a = outline[cap[i]]
    const b = outline[cap[i + 1]]
    const c = outline[cap[i + 2]]
    builder.patch([a, b, c], { y: top, up: true }, { colour, shade: facing })
    // Hung off the floor, so it is closed underneath as well as on top. Its
    // underside is in shadow, which the crease at its own base already says.
    if (structure.base > 0) {
      builder.patch([a, b, c], { y: bottom, up: false }, { colour, shade: sides })
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
function boundsOf(vertices: BufferRun, edges: BufferRun): { centre: Vec3; radius: number } {
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
  stretch(vertices.data, vertices.start, vertices.count)
  stretch(edges.data, edges.start, edges.count)

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

/**
 * The baked light of one room, as both the deck and a loose solid read it.
 *
 * `standing` is what the room holds, and it is here for one reason: the two
 * windows of the ship are sources, so a room's light cannot be built from its
 * footprint alone any more. Defaulted to nothing, because 312 rooms are lit by
 * their fittings and by nothing else.
 */
function lightOf(space: Space, tier: Tier, standing: readonly Structure[] = []): RoomLight {
  const sky: Vec3[] = []
  for (const structure of standing) {
    if (structure.kind === 'window') sky.push(...windowSources(structure, floorOf(space, tier)))
  }
  return new RoomLight({
    footprint: space.footprint,
    floorY: floorOf(space, tier),
    ceilingY: floorOf(space, tier) + ceilingOf(space, tier),
    provenance: space.provenance,
    lamplight: lamplightOf(space, tier),
    sky,
  })
}

/**
 * That same solid on its own, for the Hatsu layer to draw and move.
 *
 * `standing` is the rest of what is in the room, and it is optional for the same
 * reason it is on `lightOf`: it only changes the answer in the two rooms with a
 * window in them. Pass the room's structures and a coffin carried across the
 * King's living room keeps the daylight on it; pass nothing and it is lit by the
 * fittings alone, which is right everywhere else on the ship.
 */
export function buildSolidMesh(structure: Structure, where: SolidPlacement): TierMesh {
  const { room, tier, standing = [] } = where
  const builder = new MeshBuilder()
  const edges: number[] = []
  // The same light the deck baked into it, rebuilt for the room it was lifted
  // out of: a coffin carried across the burial chamber keeps the chamber's
  // fittings on it rather than turning into a flat silhouette the moment a
  // technique picks it up.
  extrudeSolid({ builder, edges }, structure, { room, tier, light: lightOf(room, tier, standing) })
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
        ...boundsOf(
          { data: builder.positions, start: 0, count },
          { data: edges, start: 0, count: edgeCount },
        ),
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
  const heightOf = (space: Space) => floorOf(space, tier) + ceilingOf(space, tier)

  const edges: number[] = []
  const seams: number[] = []
  const fittings: number[] = []
  const fittingColors: number[] = []
  const panes: number[] = []
  const paneColors: number[] = []
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
  const fitting = ([x, y, z]: Vec3, glow: Rgb) => {
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

  /**
   * The glass of one window: its long faces, drawn as light rather than as steel.
   *
   * In a buffer of its own, with a material that refuses to be lit — the same
   * reason a lamp has one. A pane run through the Lambert material would take the
   * headlamp like any other surface and come out as a pale rectangle, which is a
   * wall, and the ship has 157 842 m² of those.
   *
   * Its own buffer rather than the fittings', because a fitting's value is
   * settled here and the glass's is not: what is outside is the hour of the
   * voyage. So what is baked is the *relation* between the two bands — the sky
   * at 1, the water at `SEA_FRACTION` — and the hour is a colour on the
   * material. At the drawn state of ch. 380 the product is `WINDOW_GLOW` and
   * `SEA_GLOW` exactly, which is the test.
   *
   * Both long faces, and the outboard one is never seen — you cannot get outside
   * the hull. Cheaper than deciding which side of the glass the room is on.
   *
   * Each face is cut at the horizon and drawn twice: the sky above it and the sea
   * below it — see `SEA_GLOW` and `HORIZON`. A window on this ship looks at water,
   * and the one thing a view of water has that a view of nothing has is a line
   * across it. Where the horizon falls outside the opening — a sill above your eye,
   * a head below it — the cut does not happen and the pane is one value, which is
   * also what you would see.
   *
   * Wound and offset the way `extrudeSolid` winds a solid: `toClockwise`, so each
   * face looks out of the frame, and lifted 2 cm off it so the pane is not fighting
   * the frame it sits in for the same depth value.
   */
  const pane = (structure: Structure, floorY: number) => {
    const outline = toClockwise(structureFootprint(structure))
    const bottom = tier.elevation + structure.base
    const top = bottom + structure.height
    // Clamped into the opening, so a window whose sill is already above the eye
    // is all sky and one whose head is below it is all water, without a band of
    // either being drawn outside the frame it belongs to.
    const horizon = Math.min(Math.max(floorY + HORIZON, bottom), top)
    const edgesOf = [...iterateEdges(outline)]
    const runs = edgesOf.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]))
    const longest = Math.max(...runs)

    for (const [index, [start, end]] of edgesOf.entries()) {
      // The glass, not the reveal of the frame: a window is a thin rectangle laid
      // along its wall, so only the faces that run its length are panes.
      if (runs[index] < longest - EPSILON) continue
      const run = runs[index]
      const nx = -(end[1] - start[1]) / run
      const nz = (end[0] - start[0]) / run
      const a: Vec2 = [start[0] + nx * 0.02, start[1] + nz * 0.02]
      const b: Vec2 = [end[0] + nx * 0.02, end[1] + nz * 0.02]

      const band = (low: number, high: number, share: number) => {
        if (high - low < EPSILON) return
        for (const [p, q, r] of [
          [
            [a, low],
            [b, low],
            [b, high],
          ],
          [
            [a, low],
            [b, high],
            [a, high],
          ],
        ] as [[Vec2, number], [Vec2, number], [Vec2, number]][]) {
          panes.push(p[0][0], p[1], p[0][1], q[0][0], q[1], q[0][1], r[0][0], r[1], r[0][1])
          for (let vertex = 0; vertex < 3; vertex++) {
            paneColors.push(share, share, share)
          }
        }
      }

      band(bottom, horizon, SEA_FRACTION)
      band(horizon, top, 1)
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
    // Everything in this pass hangs off the floor of this room, which is the
    // deck everywhere but the handful of rooms a panel draws a step into.
    const base = floorOf(space, tier)
    const start = builder.positions.length / 3
    const edgeStart = edges.length / 3
    const seamStart = seams.length / 3
    const fittingStart = fittings.length / 3
    const paneStart = panes.length / 3

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
    const light = lightOf(space, tier, standingIn.get(space.id))
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
        [a, b, c],
        { y: base, up: true },
        { colour: floorColour, shade: bake(light.floor) },
      )
      // A lantern replaces this pass with the border-and-panel one below: the
      // ceiling is cut open over the middle of the room rather than closed.
      if (space.lantern) continue
      builder.patch(
        [a, b, c],
        // Left whole: see `PATCH` for why a lattice up here buys nothing.
        { y: top, up: false, spacing: Infinity },
        { colour: ceilingColour, shade: bake(light.ceiling) },
      )
    }

    /**
     * The lantern: the ceiling cut open over the middle of the room and lifted.
     *
     * The border stays where the ceiling was, the panel goes up by its rise, and
     * the four sides between them are the whole point — they are what the eye
     * measures the room against from underneath. Drawn here rather than derived
     * as a solid because it is a *void*: nothing is added to the collision list,
     * and a visitor walks under it exactly as they walked under a flat ceiling.
     */
    if (space.lantern) {
      const shade = bake(light.ceiling)
      const xs = space.footprint.map((corner) => corner[0])
      const zs = space.footprint.map((corner) => corner[1])
      const [x0, x1] = [Math.min(...xs), Math.max(...xs)]
      const [z0, z1] = [Math.min(...zs), Math.max(...zs)]
      const rect = lanternRect(space.lantern)
      const [lx0, lz0] = rect[0]
      const [lx1, lz1] = rect[2]
      const panelTop = top + space.lantern.rise

      const band = (a: Vec2, c: Vec2, y: number) => {
        if (Math.abs(c[0] - a[0]) < EPSILON || Math.abs(c[1] - a[1]) < EPSILON) return
        const b: Vec2 = [c[0], a[1]]
        const d: Vec2 = [a[0], c[1]]
        builder.patch(
          [a, b, c],
          { y, up: false, spacing: Infinity },
          { colour: ceilingColour, shade },
        )
        builder.patch(
          [a, c, d],
          { y, up: false, spacing: Infinity },
          { colour: ceilingColour, shade },
        )
      }
      band([x0, z0], [x1, lz0], top)
      band([x0, lz1], [x1, z1], top)
      band([x0, lz0], [lx0, lz1], top)
      band([lx1, lz0], [x1, lz1], top)
      band([lx0, lz0], [lx1, lz1], panelTop)

      // Wound like a room's walls rather than like a column's: the sides of a
      // coffer are seen from inside it.
      for (const [start, end] of iterateEdges(rect)) {
        builder.quad([start, end], { bottom: top, top: panelTop }, { colour: ceilingColour, shade })
        horizontal(start, end, top + OFFSET)
        horizontal(start, end, panelTop - OFFSET)
      }
    }

    // The plating, laid on the ship's grid and clipped to this room. Lifted off
    // the floor by the same hair the wall lines are, so it is not fighting the
    // deck for the same depth value.
    for (const [from, to] of plateSeams(space.footprint)) {
      seams.push(from[0], base + OFFSET, from[1], to[0], base + OFFSET, to[1])
    }

    /**
     * The fittings, which the bake has been reading off the same grid all along
     * and which nothing has drawn until now.
     *
     * A lit room with no visible lamp is a box that happens to be bright: the
     * pool on the floor says *that* there is light and never *where from*, and
     * the eye has nothing to measure the room against. Two triangles a fitting
     * fixes that, and it is the cheapest thing on this list by a long way — 2 489
     * fittings on the whole ship, 4 978 triangles against the 341 035 it already
     * draws, and one more draw call per room.
     *
     * How many of them a deck gets is now the plainest statement the walk makes
     * about the ship: 662 over Tier 1 and 83 over Tier 5, off nothing but the
     * elevation the blueprint gives and what the rooms are for.
     *
     * Not under the reveal, for the reason the bake is not: there, every surface
     * has to say what it is worth as evidence, and a quad drawn as a light says
     * nothing about the sources. The fittings are derived — the plans no more draw
     * a lamp than they draw a pillar — so they belong to the walk, not the
     * doctrine.
     */
    if (!reveal) {
      const hang = fittingHeight(base, top)
      // Dimmed by exactly what dims the pools: a corridor nobody drew gets both
      // its lamps and its lamplight at `LIGHT.inferredLamps`, so walking into an
      // invented part of the ship stays the one thing you can feel rather than a
      // legend you have to know.
      const burn = space.provenance === 'inferred' ? LIGHT.inferredLamps : 1
      // The room's own lamp, not the ship's: a fitting is drawn in the colour and
      // at the strength the bake under it was computed from, so the row of lamps
      // over a Tier 1 corridor is visibly a warmer and closer row than the one
      // over the same corridor five decks down. Draw one glow for all of them and
      // the class system would be in the floor and denied by the ceiling.
      const lamplight = lamplightOf(space, tier)
      const glow: Rgb = [
        lamplight.glow[0] * burn,
        lamplight.glow[1] * burn,
        lamplight.glow[2] * burn,
      ]
      for (const [x, z] of lampsOf(space.footprint, lamplight)) fitting([x, hang, z], glow)

      // And the sky, in the two rooms that have any. Undimmed by provenance —
      // see `RoomLight.daylight` — and in a buffer of its own, because a
      // fitting burns at a value this bake settles and the glass burns at the
      // hour of the voyage, which it does not.
      for (const structure of standingIn.get(space.id) ?? []) {
        if (structure.kind === 'window') pane(structure, floorOf(space, tier))
      }
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
        [wall.start, wall.end],
        { bottom: base, top },
        {
          colour: wallColour,
          shade: bake(
            light.wall(base, top, (x, z) => {
              const along = Math.hypot(x - wall.start[0], z - wall.start[1])
              return Math.min(along, run - along)
            }),
          ),
        },
      )
      horizontal(wall.start, wall.end, base + OFFSET)
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
      const cap = bake(light.ceiling)
      builder.patch(
        [corners[0], corners[1], corners[2]],
        { y: top, up: false },
        { colour, shade: cap },
      )
      builder.patch(
        [corners[0], corners[2], corners[3]],
        { y: top, up: false },
        { colour, shade: cap },
      )
      // A column's faces are in the wall list, so they are drawn by the pass
      // above; what is left is the cap and the arrises.
      for (const corner of corners) vertical(corner, base, top)
    }

    // What stands in the room. Its sides are already in `plan.walls`, so this
    // only has to raise them: the same outline, extruded to its own height and
    // capped, and never taller than the room it stands in.
    for (const structure of standingIn.get(space.id) ?? []) {
      extrudeSolid({ builder, edges }, structure, { room: space, tier, light })
    }

    // Above each opening the wall carries on to the ceiling, so a doorway reads
    // as a door and not as a room with a side missing.
    for (const door of lintelsOf.get(space.id) ?? []) {
      const other = spaces.get(door.b)
      if (!other) continue
      const lintelTop = Math.max(top, heightOf(other))
      const lintelBottom = base + DOOR_HEIGHT

      /**
       * The riser, where the two rooms are at different heights.
       *
       * An opening between two floors is otherwise the one place a step cannot
       * be seen: the wall is cut away, and the higher floor would end in mid-air
       * over the lower one. Drawn from the higher side only, so it is drawn once,
       * and wound to face the room you climb it from.
       */
      const otherBase = floorOf(other, tier)
      if (base > otherBase + EPSILON) {
        builder.quad(
          [door.end, door.start],
          { bottom: otherBase, top: base },
          {
            colour: colourFor(WALL_COLOUR, space.provenance),
            shade: bake(light.wall(otherBase, base)),
          },
        )
        horizontal(door.start, door.end, base + OFFSET)
      }

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
            [from, to],
            { bottom: lintelBottom, top: lintelTop },
            { colour: lintelColour, shade: bake(light.wall(lintelBottom, lintelTop)) },
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
          [cheek.start, cheek.end],
          { bottom: base, top: lintelBottom },
          { colour: lintelColour, shade: bake(light.wall(base, lintelBottom)) },
        )
        vertical(cheek.start, base, lintelBottom)
        vertical(cheek.end, base, lintelBottom)
      }

      if (lintelTop > lintelBottom) {
        const soffit = doorSoffit(door)
        const under = bake(light.ceiling)
        for (let i = 1; i + 1 < soffit.length; i++) {
          builder.patch(
            [soffit[0], soffit[i], soffit[i + 1]],
            { y: lintelBottom, up: false, spacing: Infinity },
            { colour: lintelColour, shade: under },
          )
        }
        horizontal(door.start, door.end, lintelBottom + OFFSET)
      }
    }

    const count = builder.positions.length / 3 - start
    const edgeCount = edges.length / 3 - edgeStart
    const seamCount = seams.length / 3 - seamStart
    const fittingCount = fittings.length / 3 - fittingStart
    const paneCount = panes.length / 3 - paneStart
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
      paneStart,
      paneCount,
      ...boundsOf(
        { data: builder.positions, start, count },
        { data: edges, start: edgeStart, count: edgeCount },
      ),
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
    panes: new Float32Array(panes),
    paneColors: new Float32Array(paneColors),
    triangles: builder.positions.length / 9,
    groups,
  }
}
