/**
 * Turns the flat footprints of `data/ship/blueprint.json` into the polygons,
 * doorways and wall stretches a first-person walk needs.
 *
 * Everything here is pure and framework-free: the same functions feed the
 * renderer, the collision test and the validation suite, so a wall the player
 * bumps into is by construction the wall that was drawn.
 */
import type {
  DoorOverride,
  Doorway,
  Lantern,
  Polygon,
  Segment,
  Space,
  Structure,
  Triangle,
  Vec2,
  WallSegment,
} from './types'

/** Below this, two coordinates are the same point. Footprints are in metres. */
export const EPSILON = 0.05

/** Doorways are cut to this width when the shared wall allows it. */
export const DOOR_WIDTH = 3

/** A shared wall shorter than this is a corner touch, not a way through. */
export const MIN_DOOR_WIDTH = 1.2

/** Head height of an opening. Above it, the wall carries on to the ceiling. */
export const DOOR_HEIGHT = 2.6

/**
 * The tallest rise the visitor takes in stride, in metres.
 *
 * Two levels of one room are a step; a step you cannot take is a storey, and a
 * storey is a `link` with a stair on it. Three risers of twenty centimetres is
 * what the banquet hall's service end is drawn as, and it is about the limit of
 * what a floor can do to another floor without becoming a different deck.
 */
export const STEP_UP = 0.6

/**
 * How deep a doorway is, in metres.
 *
 * The blueprint gives partitions no thickness, and a wall of no thickness is a
 * claim about the ship in its own right — the same kind of claim as a
 * seven-thousand-square-metre hall with no pillars in it, and just as false. You
 * do not cut an opening through a sheet of paper in a hull. So the depth is
 * derived, like `columnPositions` and `ceilingLamps` before it.
 *
 * What is derived is deliberately *local*. The two faces of a shared bulkhead
 * stay where they are, coplanar on the wall line — moving them apart would touch
 * all 29 333 metres of partition on the ship and undo the one thing that lets
 * each room light its own side. What gets thickness is the opening: a 30 cm frame
 * of cheek and soffit, drawn inside the gap the wall already leaves. It is the
 * only place thickness can be seen, so it is the only place it is claimed, and
 * the honest way to read the result is that the ship has thick doorways in thin
 * walls rather than that it has thick walls.
 *
 * 30 cm is a bulkhead door of the period, and it leaves the full `DOOR_WIDTH` to
 * walk through: the cheeks sit at the ends of the opening rather than inside it.
 */
export const JAMB_DEPTH = 0.3

const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]]
const len = (a: Vec2) => Math.hypot(a[0], a[1])
const dot = (a: Vec2, b: Vec2) => a[0] * b[0] + a[1] * b[1]
const cross = (a: Vec2, b: Vec2) => a[0] * b[1] - a[1] * b[0]

/** Twice the signed area. Positive means counter-clockwise in `[x, z]`. */
export function signedArea(polygon: Polygon): number {
  let total = 0
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    total += cross(a, b)
  }
  return total / 2
}

export const polygonArea = (polygon: Polygon): number => Math.abs(signedArea(polygon))

/** Returns the polygon wound counter-clockwise, copying only when needed. */
export function toCounterClockwise(polygon: Polygon): Polygon {
  return signedArea(polygon) < 0 ? [...polygon].reverse() : polygon
}

/**
 * Returns the polygon wound clockwise, copying only when needed.
 *
 * The mirror of `toCounterClockwise`, and what a *solid* is wound by: a room is
 * drawn from the inside and a coffin from the outside, so the two want opposite
 * windings out of the same builder. See `MeshBuilder.quad` in `mesh.ts`.
 */
export function toClockwise(polygon: Polygon): Polygon {
  return signedArea(polygon) > 0 ? [...polygon].reverse() : polygon
}

/** Ray casting. Points exactly on an edge are not guaranteed either way. */
export function pointInPolygon(point: Vec2, polygon: Polygon): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    const straddles = a[1] > point[1] !== b[1] > point[1]
    if (!straddles) continue
    const x = ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    if (point[0] < x) inside = !inside
  }
  return inside
}

/** The closest point to `p` on segment `a`→`b`. */
export function closestPointOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const ab = sub(b, a)
  const lengthSquared = dot(ab, ab)
  if (lengthSquared < EPSILON * EPSILON) return a
  let t = dot(sub(p, a), ab) / lengthSquared
  t = Math.max(0, Math.min(1, t))
  return [a[0] + ab[0] * t, a[1] + ab[1] * t]
}

export const iterateEdges = function* (polygon: Polygon): Generator<[Vec2, Vec2]> {
  for (let i = 0; i < polygon.length; i++) {
    yield [polygon[i], polygon[(i + 1) % polygon.length]]
  }
}

/**
 * The stretch two segments share when they lie on the same line, expressed as
 * the distance along `a1`→`a2`. Returns `null` when they are not collinear or
 * only meet at a point.
 */
export function collinearOverlap(a: Segment, b: Segment): { from: number; to: number } | null {
  const [a1, a2] = a
  const [b1, b2] = b
  const dir = sub(a2, a1)
  const length = len(dir)
  if (length < EPSILON) return null
  const unit: Vec2 = [dir[0] / length, dir[1] / length]

  // Both ends of B have to sit on A's line, and B has to run along it.
  if (Math.abs(cross(unit, sub(b1, a1))) > EPSILON) return null
  if (Math.abs(cross(unit, sub(b2, a1))) > EPSILON) return null

  const t1 = dot(sub(b1, a1), unit)
  const t2 = dot(sub(b2, a1), unit)
  const from = Math.max(0, Math.min(t1, t2))
  const to = Math.min(length, Math.max(t1, t2))
  return to - from > EPSILON ? { from, to } : null
}

const along = (a: Vec2, unit: Vec2, t: number): Vec2 => [a[0] + unit[0] * t, a[1] + unit[1] * t]

/** The key under which a pair of spaces is sealed, order-independent. */
export const sealKey = (a: string, b: string): string => [a, b].sort().join('|')

/** The longest stretch of wall two footprints hold in common. */
export function longestSharedWall(
  a: Polygon,
  b: Polygon,
): { from: number; to: number; a1: Vec2; unit: Vec2 } | null {
  let best: { from: number; to: number; a1: Vec2; unit: Vec2 } | null = null

  for (const [a1, a2] of iterateEdges(a)) {
    const dir = sub(a2, a1)
    const length = len(dir)
    if (length < EPSILON) continue
    const unit: Vec2 = [dir[0] / length, dir[1] / length]

    for (const [b1, b2] of iterateEdges(b)) {
      const overlap = collinearOverlap([a1, a2], [b1, b2])
      if (!overlap) continue
      if (!best || overlap.to - overlap.from > best.to - best.from) {
        best = { ...overlap, a1, unit }
      }
    }
  }

  return best
}

/**
 * Finds every doorway on a tier by looking for walls two spaces hold in common.
 *
 * Adjacency is the connection: nothing in the blueprint says "these two rooms
 * have a door". A footprint that touches its neighbour opens onto it, and one
 * that does not is shut off — which is why an unreachable space is a data error
 * the validator can state plainly.
 *
 * Adjacency alone is not *sufficient*, though. The guards' round meets the aft
 * promenade along the whole aft end of the princes' sector, and nothing goes
 * through: the sector is walled there, and the gate forward is the only way in.
 * `sealed` names those pairs, and the blueprint has to say
 * so explicitly — a blind wall is a claim about the ship, so it is recorded
 * rather than guessed from the category of the rooms.
 */
export interface DoorwayRules {
  /** Pairs that share a wall with nothing through it. */
  sealed?: ReadonlySet<string>
  /** Pairs whose opening is placed by hand, keyed by `sealKey`. */
  overrides?: ReadonlyMap<string, DoorOverride>
}

export function deriveDoorways(spaces: Space[], rules: DoorwayRules = {}): Doorway[] {
  const doorways: Doorway[] = []

  for (let i = 0; i < spaces.length; i++) {
    for (let j = i + 1; j < spaces.length; j++) {
      const a = spaces[i]
      const b = spaces[j]
      if (a.tierId !== b.tierId) continue

      const key = sealKey(a.id, b.id)
      const override = rules.overrides?.get(key)

      // A declared door beats everything: it is how an envelope is entered at
      // all, and how a plan places an opening the geometry would have centred.
      if (!override) {
        if (rules.sealed?.has(key)) continue
        if (a.envelope !== b.envelope) continue
      }

      const best = longestSharedWall(a.footprint, b.footprint)
      if (!best) continue
      const span = best.to - best.from
      if (!override && span < MIN_DOOR_WIDTH) continue

      const width = Math.min(override?.width ?? DOOR_WIDTH, span)
      // Where along the shared wall the opening sits: the declared point,
      // projected onto the wall and pulled back inside it, or its midpoint.
      const middle = override
        ? Math.min(
            best.to - width / 2,
            Math.max(
              best.from + width / 2,
              (override.at[0] - best.a1[0]) * best.unit[0] +
                (override.at[1] - best.a1[1]) * best.unit[1],
            ),
          )
        : (best.from + best.to) / 2

      doorways.push({
        tierId: a.tierId,
        a: a.id,
        b: b.id,
        start: along(best.a1, best.unit, middle - width / 2),
        end: along(best.a1, best.unit, middle + width / 2),
        width,
      })
    }
  }

  return doorways
}

/**
 * The walls of one space, with its doorways cut out.
 *
 * Each edge is walked as an interval, the openings that fall on it are removed,
 * and what is left comes back as wall. An edge fully spanned by an opening
 * yields nothing.
 *
 * Walked counter-clockwise rather than in the order the blueprint happens to
 * list the corners in, because a wall segment is not only something to collide
 * with: `mesh.ts` raises these very segments into the quads the visitor sees, and
 * it faces a quad by the way round its segment runs — see `MeshBuilder.quad`.
 * Three of the ship's three hundred and fourteen footprints are written
 * clockwise, and their fifty-seven walls used to be built inside out, which no
 * amount of care in the renderer could have told from the wall next to it.
 */
export function wallSegments(space: Space, doorways: Doorway[]): WallSegment[] {
  const mine = doorways.filter((door) => door.a === space.id || door.b === space.id)
  const walls: WallSegment[] = []

  for (const [a1, a2] of iterateEdges(toCounterClockwise(space.footprint))) {
    const dir = sub(a2, a1)
    const length = len(dir)
    if (length < EPSILON) continue
    const unit: Vec2 = [dir[0] / length, dir[1] / length]

    const gaps: Array<[number, number]> = []
    for (const door of mine) {
      const overlap = collinearOverlap([a1, a2], [door.start, door.end])
      if (overlap) gaps.push([overlap.from, overlap.to])
    }
    gaps.sort((left, right) => left[0] - right[0])

    let cursor = 0
    for (const [from, to] of gaps) {
      if (from - cursor > EPSILON) {
        walls.push({
          spaceId: space.id,
          start: along(a1, unit, cursor),
          end: along(a1, unit, from),
        })
      }
      cursor = Math.max(cursor, to)
    }
    if (length - cursor > EPSILON) {
      walls.push({
        spaceId: space.id,
        start: along(a1, unit, cursor),
        end: along(a1, unit, length),
      })
    }
  }

  return walls
}

/**
 * The two cheeks of one doorway, as the wall segments the visitor collides with.
 *
 * A cheek runs across the thickness of the partition — `JAMB_DEPTH`, half of it
 * either side of the wall line — at each end of the opening, and it faces *into*
 * the opening: the pair of them are what you walk between. Wound so that
 * `MeshBuilder.quad` faces them that way, which for the cheek at `start` means
 * running it against the opening's own direction and for the one at `end` with it.
 *
 * They go in `plan.walls` because collision has to have them. The gap the opening
 * leaves is `DOOR_WIDTH` wide and the visitor is 0,8 m across, so these take
 * nothing away from getting through — what they take away is cutting the corner,
 * which is the one thing a doorframe of no depth let you do.
 */
export function doorJambs(door: Doorway): WallSegment[] {
  const dx = door.end[0] - door.start[0]
  const dz = door.end[1] - door.start[1]
  const length = len([dx, dz])
  if (length < EPSILON) return []

  const unit: Vec2 = [dx / length, dz / length]
  // Across the partition: the wall's own normal in plan, half the depth each way.
  const half = JAMB_DEPTH / 2
  const out: Vec2 = [-unit[1] * half, unit[0] * half]
  const id = sealKey(door.a, door.b)

  return [
    {
      spaceId: door.a,
      jambOf: id,
      start: [door.start[0] + out[0], door.start[1] + out[1]],
      end: [door.start[0] - out[0], door.start[1] - out[1]],
    },
    {
      spaceId: door.a,
      jambOf: id,
      start: [door.end[0] - out[0], door.end[1] - out[1]],
      end: [door.end[0] + out[0], door.end[1] + out[1]],
    },
  ]
}

/**
 * The soffit of one doorway: the underside of the lintel, as a polygon in plan.
 *
 * Closes the top of the opening, so a doorway is a way through something rather
 * than a hole in a plane. Returned wound counter-clockwise in `[x, z]`, which is
 * what `MeshBuilder.patch` turns downward — the only side of it anyone stands on.
 */
export function doorSoffit(door: Doorway): Polygon {
  const dx = door.end[0] - door.start[0]
  const dz = door.end[1] - door.start[1]
  const length = len([dx, dz])
  if (length < EPSILON) return []

  const unit: Vec2 = [dx / length, dz / length]
  const half = JAMB_DEPTH / 2
  const out: Vec2 = [-unit[1] * half, unit[0] * half]

  return toCounterClockwise([
    [door.start[0] + out[0], door.start[1] + out[1]],
    [door.end[0] + out[0], door.end[1] + out[1]],
    [door.end[0] - out[0], door.end[1] - out[1]],
    [door.start[0] - out[0], door.start[1] - out[1]],
  ])
}

/**
 * Ear clipping for simple polygons, concave included. Returns index triples
 * into the polygon, wound counter-clockwise.
 *
 * The footprints have a handful of vertices each, so the quadratic loop costs
 * nothing and the alternative — pulling in a triangulation dependency for the
 * few notched rooms on the ship — is not worth it.
 */
export function triangulate(polygon: Polygon): number[] {
  const ccw = toCounterClockwise(polygon)
  const flipped = ccw !== polygon
  const remaining = ccw.map((_, index) => index)
  const triangles: number[] = []

  const at = (index: number) => ccw[index]
  const map = (index: number) => (flipped ? polygon.length - 1 - index : index)

  let guard = remaining.length * remaining.length
  while (remaining.length > 3 && guard-- > 0) {
    let clipped = false

    for (let i = 0; i < remaining.length; i++) {
      const prev = remaining[(i - 1 + remaining.length) % remaining.length]
      const current = remaining[i]
      const next = remaining[(i + 1) % remaining.length]
      const a = at(prev)
      const b = at(current)
      const c = at(next)

      // Reflex corners cannot be ears.
      if (cross(sub(b, a), sub(c, b)) <= EPSILON) continue

      // Nor can a corner with another vertex sitting inside it.
      const contains = remaining.some((index) => {
        if (index === prev || index === current || index === next) return false
        return pointInTriangle(at(index), [a, b, c])
      })
      if (contains) continue

      triangles.push(map(prev), map(current), map(next))
      remaining.splice(i, 1)
      clipped = true
      break
    }

    // A polygon that is not simple would otherwise spin here forever.
    if (!clipped) break
  }

  if (remaining.length === 3) triangles.push(...remaining.map(map))
  return triangles
}

function pointInTriangle(p: Vec2, [a, b, c]: Triangle): boolean {
  const d1 = cross(sub(b, a), sub(p, a))
  const d2 = cross(sub(c, b), sub(p, b))
  const d3 = cross(sub(a, c), sub(p, c))
  return d1 >= 0 && d2 >= 0 && d3 >= 0
}

/**
 * A point inside the polygon and clear of its walls.
 *
 * Rooms are expected to share walls, so a point sitting *on* an edge says
 * nothing about whether two of them overlap — only a point strictly within
 * does.
 */
export function strictlyInside(point: Vec2, polygon: Polygon): boolean {
  if (!pointInPolygon(point, polygon)) return false
  for (const [a, b] of iterateEdges(polygon)) {
    if (len(sub(point, closestPointOnSegment(point, a, b))) <= EPSILON) return false
  }
  return true
}

/** Whether two polygons share interior area, which no two spaces may do. */
export function polygonsOverlap(a: Polygon, b: Polygon): boolean {
  if (a.some((point) => strictlyInside(point, b))) return true
  if (b.some((point) => strictlyInside(point, a))) return true

  // Vertices alone miss the case of two rooms drawn on the same floor, whose
  // corners all land on each other's walls.
  if (triangleCentroids(a).some((point) => strictlyInside(point, b))) return true
  if (triangleCentroids(b).some((point) => strictlyInside(point, a))) return true

  for (const [a1, a2] of iterateEdges(a)) {
    for (const [b1, b2] of iterateEdges(b)) {
      if (segmentsProperlyCross([a1, a2], [b1, b2])) return true
    }
  }
  return false
}

/**
 * Whether `inner` lies wholly within `outer` — one thing standing on another,
 * rather than two things claiming the same floor.
 */
export function polygonContains(outer: Polygon, inner: Polygon): boolean {
  if (!inner.every((point) => pointInPolygon(point, outer))) return false
  for (const [a1, a2] of iterateEdges(outer)) {
    for (const [b1, b2] of iterateEdges(inner)) {
      if (segmentsProperlyCross([a1, a2], [b1, b2])) return false
    }
  }
  return true
}

function triangleCentroids(polygon: Polygon): Vec2[] {
  const triangles = triangulate(polygon)
  const points: Vec2[] = []
  for (let i = 0; i < triangles.length; i += 3) {
    const a = polygon[triangles[i]]
    const b = polygon[triangles[i + 1]]
    const c = polygon[triangles[i + 2]]
    points.push([(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3])
  }
  return points
}

/** Crossings that pass through each other, ignoring shared walls and corners. */
function segmentsProperlyCross([a1, a2]: Segment, [b1, b2]: Segment): boolean {
  const d1 = cross(sub(a2, a1), sub(b1, a1))
  const d2 = cross(sub(a2, a1), sub(b2, a1))
  const d3 = cross(sub(b2, b1), sub(a1, b1))
  const d4 = cross(sub(b2, b1), sub(a2, b1))
  return (
    ((d1 > EPSILON && d2 < -EPSILON) || (d1 < -EPSILON && d2 > EPSILON)) &&
    ((d3 > EPSILON && d4 < -EPSILON) || (d3 < -EPSILON && d4 > EPSILON))
  )
}

/** Half the width of a structural column, in metres. */
export const COLUMN_HALF_WIDTH = 0.45

/** Spaces smaller than this carry their own roof and get no columns. */
export const COLUMN_MIN_AREA = 420

/** Centre-to-centre spacing of the column grid. */
export const COLUMN_SPACING = 11

/** A column is never planted closer than this to a wall. */
const COLUMN_MARGIN = 3.5

/**
 * Where a room needs pillars to hold its ceiling up.
 *
 * The deck plans draw rooms as empty outlines, which at these sizes leaves the
 * visitor in a featureless hall with nothing to judge distance against. A hall
 * of this span would be built on columns, so the reconstruction puts them on a
 * regular grid — and the renderer and the collision test read this same
 * function, so a pillar you can see is a pillar you walk around.
 */
export function columnPositions(footprint: Polygon): Vec2[] {
  if (polygonArea(footprint) < COLUMN_MIN_AREA) return []

  const xs = footprint.map((point) => point[0])
  const zs = footprint.map((point) => point[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)

  // Centre the grid on the room, so the pillars read as deliberate rather than
  // as whatever fell out of the bounding box.
  const countX = Math.floor((maxX - minX - COLUMN_MARGIN * 2) / COLUMN_SPACING)
  const countZ = Math.floor((maxZ - minZ - COLUMN_MARGIN * 2) / COLUMN_SPACING)
  if (countX < 1 && countZ < 1) return []

  const startX = (minX + maxX) / 2 - ((countX - 1) * COLUMN_SPACING) / 2
  const startZ = (minZ + maxZ) / 2 - ((countZ - 1) * COLUMN_SPACING) / 2
  const columns: Vec2[] = []

  for (let i = 0; i < Math.max(countX, 1); i++) {
    for (let j = 0; j < Math.max(countZ, 1); j++) {
      const point: Vec2 = [startX + i * COLUMN_SPACING, startZ + j * COLUMN_SPACING]
      if (!pointInPolygon(point, footprint)) continue
      const clearOfWalls = [...iterateEdges(footprint)].every(
        ([a, b]) => len(sub(point, closestPointOnSegment(point, a, b))) > COLUMN_MARGIN,
      )
      if (clearOfWalls) columns.push(point)
    }
  }

  return columns
}

/**
 * The four faces of a column, as wall segments the visitor collides with.
 *
 * Wound clockwise, which is the opposite of a room and the same as a solid: a
 * column is a thing you walk around rather than a thing you stand in, so its
 * faces have to look out at the hall and not in at the pillar. `mesh.ts` draws
 * these from the same list as the room's own walls — see `MeshBuilder.quad` — so
 * the way round is the only thing telling it which of the two it has.
 */
export function columnWalls(spaceId: string, centre: Vec2): WallSegment[] {
  const h = COLUMN_HALF_WIDTH
  const corners: Vec2[] = [
    [centre[0] - h, centre[1] - h],
    [centre[0] - h, centre[1] + h],
    [centre[0] + h, centre[1] + h],
    [centre[0] + h, centre[1] - h],
  ]
  return corners.map((corner, index) => ({
    spaceId,
    start: corner,
    end: corners[(index + 1) % corners.length],
  }))
}

/**
 * The outline of a solid standing in a room, in the level's coordinates.
 *
 * A rectangle when `sides` is `null` — a coffin, a stage — and otherwise a
 * regular polygon of that many sides inscribed in the same box, which is how a
 * spring or a reliquary comes out round. Both are then turned about the centre,
 * so the ring of coffins can point every one of its members at the middle of
 * the chamber without fourteen hand-written quadrilaterals in the blueprint.
 */
export function structureFootprint(structure: Structure): Polygon {
  const [halfWidth, halfDepth] = [structure.size[0] / 2, structure.size[1] / 2]
  const angle = (structure.rotation * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const local: Vec2[] = structure.sides
    ? Array.from({ length: structure.sides }, (_, index) => {
        const step = (index * 2 * Math.PI) / structure.sides!
        return [Math.sin(step) * halfWidth, Math.cos(step) * halfDepth] as Vec2
      })
    : [
        [-halfWidth, -halfDepth],
        [halfWidth, -halfDepth],
        [halfWidth, halfDepth],
        [-halfWidth, halfDepth],
      ]

  return local.map(([x, z]) => [
    structure.at[0] + x * cos - z * sin,
    structure.at[1] + x * sin + z * cos,
  ])
}

/** Across-the-run thickness of one upright of a grille, in metres. */
export const BAR_THICKNESS = 0.06

/** Centre-to-centre spacing of the uprights: close enough that no one passes. */
export const BAR_PITCH = 0.19

/** How deep the rail that caps a run of bars is, measured down from its top. */
export const BAR_RAIL = 0.12

/**
 * The uprights a run of bars is drawn as, in the level's coordinates.
 *
 * A grille is stored as a single solid — its `size` is the length of the run
 * and the thickness of the screen — because that is what it does: you walk
 * around it, and the gate beside it is where you get through. Drawing it as
 * one slab, though, would be a partition, and a cell you cannot see into is a
 * store room. So the run is *drawn* as this row of uprights and the rail over
 * them, while collision keeps reading the run itself. The two cannot drift:
 * every upright is inside the outline collision already uses.
 */
export function grilleBars(structure: Structure): Polygon[] {
  const [width, depth] = structure.size
  const alongX = width >= depth
  const length = alongX ? width : depth
  const across = alongX ? depth : width

  const count = Math.max(2, Math.round(length / BAR_PITCH))
  const step = (length - BAR_THICKNESS) / (count - 1)
  const angle = (structure.rotation * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const bars: Polygon[] = []
  for (let index = 0; index < count; index++) {
    const offset = -length / 2 + BAR_THICKNESS / 2 + index * step
    const halfAlong = BAR_THICKNESS / 2
    const halfAcross = across / 2
    const centre: Vec2 = alongX ? [offset, 0] : [0, offset]
    const half: Vec2 = alongX ? [halfAlong, halfAcross] : [halfAcross, halfAlong]

    bars.push(
      (
        [
          [-half[0], -half[1]],
          [half[0], -half[1]],
          [half[0], half[1]],
          [-half[0], half[1]],
        ] as Vec2[]
      ).map(([x, z]) => {
        const localX = centre[0] + x
        const localZ = centre[1] + z
        return [
          structure.at[0] + localX * cos - localZ * sin,
          structure.at[1] + localX * sin + localZ * cos,
        ] as Vec2
      }),
    )
  }

  return bars
}

/**
 * How much clear air under a solid makes it something you walk under rather
 * than something you walk around.
 */
export const HEADROOM = 2.1

/**
 * Whether a solid stands on the floor at all.
 *
 * A structure's faces are what the visitor collides with, which is right for
 * everything resting on the deck and wrong for everything hung above it. The
 * casino's mezzanine runs over the shopfronts it shelters, the theatre's boxes
 * run down its side walls above the aisles, and a curtain hangs across the top
 * of the proscenium: colliding with those at floor level fences off the very
 * places they are drawn over. Anything whose underside clears head height is
 * therefore drawn and not collided with — you walk under it, as you would.
 */
export function blocksTheFloor(structure: Structure): boolean {
  return structure.base < HEADROOM
}

/** The four corners of a lantern, in the level's own frame. */
export function lanternRect(lantern: Lantern): Polygon {
  const [x, z] = lantern.at
  const [w, l] = lantern.size
  return [
    [x - w / 2, z - l / 2],
    [x + w / 2, z - l / 2],
    [x + w / 2, z + l / 2],
    [x - w / 2, z + l / 2],
  ]
}

/** The faces of a structure, as wall segments the visitor collides with. */
export function structureWalls(structure: Structure): WallSegment[] {
  return [...iterateEdges(structureFootprint(structure))].map(([start, end]) => ({
    spaceId: structure.spaceId,
    start,
    end,
    structureId: structure.id,
  }))
}

/** A representative interior point, used to drop the visitor into a space. */
export function interiorPoint(polygon: Polygon): Vec2 {
  const triangles = triangulate(polygon)
  let best: Vec2 = centroid(polygon)
  let bestArea = -1

  for (let i = 0; i < triangles.length; i += 3) {
    const a = polygon[triangles[i]]
    const b = polygon[triangles[i + 1]]
    const c = polygon[triangles[i + 2]]
    const area = Math.abs(cross(sub(b, a), sub(c, a))) / 2
    if (area > bestArea) {
      bestArea = area
      best = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3]
    }
  }
  return best
}

function centroid(polygon: Polygon): Vec2 {
  const sum = polygon.reduce<[number, number]>((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0])
  return [sum[0] / polygon.length, sum[1] / polygon.length]
}

/** The total length of a footprint's outline, for a room's wall area. */
export function perimeter(polygon: Polygon): number {
  let total = 0
  for (const [a, b] of iterateEdges(polygon)) total += len(sub(b, a))
  return total
}

/**
 * The longest straight line the footprint holds between two of its corners.
 *
 * This is the sight line a room can offer, and it is what the fog and the
 * reverberation are both scaled by: a cabin measures a couple of metres across
 * and the banquet hall a hundred and sixty, and one setting cannot be right for
 * both. Corner to corner rather than through the middle of the polygon, because
 * an L-shaped hall is still a hall — the visitor walks the bend.
 */
export function longestChord(polygon: Polygon): number {
  let longest = 0
  for (let i = 0; i < polygon.length; i++) {
    for (let j = i + 1; j < polygon.length; j++) {
      const span = len(sub(polygon[j], polygon[i]))
      if (span > longest) longest = span
    }
  }
  return longest
}

/** How far a point stands from the nearest wall of its room. */
export function distanceToBoundary(point: Vec2, polygon: Polygon): number {
  let nearest = Infinity
  for (const [a, b] of iterateEdges(polygon)) {
    const distance = len(sub(point, closestPointOnSegment(point, a, b)))
    if (distance < nearest) nearest = distance
  }
  return Number.isFinite(nearest) ? nearest : 0
}

/**
 * The stretches of the segment `a`→`b` that lie inside the polygon.
 *
 * Every crossing of the outline is collected, sorted along the segment, and each
 * span between two crossings is kept or dropped on whether its middle is inside.
 * That handles a footprint with a bite out of it — an L, a ring of cabins around
 * a stairwell — without assuming the outline is convex.
 */
export function clipSegment(polygon: Polygon, a: Vec2, b: Vec2): [Vec2, Vec2][] {
  const dir = sub(b, a)
  const length = len(dir)
  if (length < EPSILON) return []
  const unit: Vec2 = [dir[0] / length, dir[1] / length]

  const crossings = [0, length]
  for (const [p, q] of iterateEdges(polygon)) {
    const edge = sub(q, p)
    const denominator = cross(unit, edge)
    if (Math.abs(denominator) < 1e-9) continue
    const offset = sub(p, a)
    const t = cross(offset, edge) / denominator
    const u = cross(offset, unit) / denominator
    if (t < 0 || t > length || u < 0 || u > 1) continue
    crossings.push(t)
  }
  crossings.sort((x, y) => x - y)

  const spans: [Vec2, Vec2][] = []
  for (let i = 0; i < crossings.length - 1; i++) {
    const from = crossings[i]
    const to = crossings[i + 1]
    if (to - from < EPSILON) continue
    if (!pointInPolygon(along(a, unit, (from + to) / 2), polygon)) continue
    spans.push([along(a, unit, from), along(a, unit, to)])
  }
  return spans
}

/**
 * Centre-to-centre spacing of the deck plates, in metres.
 *
 * The one thing a bare floor withholds is how fast you are crossing it. A
 * hundred-and-fifty-seven-metre hall drawn as an unbroken sheet reads the same
 * at a walk as at a sprint, and the reconstruction's own case for its scale —
 * that these are rooms a person walks, not a diagram — is the case for giving
 * the eye something to count. A plate this size is what a hull of this period is
 * riveted from, and it passes underfoot about once per stride.
 */
export const PLATE_PITCH = 1.2

/**
 * Where the seams between deck plates fall inside a footprint.
 *
 * Laid on a grid in the ship's own coordinates rather than the room's, so the
 * courses run on through a doorway instead of restarting at every threshold —
 * the plating was laid before the partitions.
 */
export function plateSeams(polygon: Polygon, pitch = PLATE_PITCH): [Vec2, Vec2][] {
  if (pitch < EPSILON || polygon.length < 3) return []

  const xs = polygon.map((point) => point[0])
  const zs = polygon.map((point) => point[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)

  const seams: [Vec2, Vec2][] = []
  for (let x = Math.ceil(minX / pitch) * pitch; x <= maxX; x += pitch) {
    seams.push(...clipSegment(polygon, [x, minZ - 1], [x, maxZ + 1]))
  }
  for (let z = Math.ceil(minZ / pitch) * pitch; z <= maxZ; z += pitch) {
    seams.push(...clipSegment(polygon, [minX - 1, z], [maxX + 1, z]))
  }
  return seams
}

/**
 * Centre-to-centre spacing of the ceiling fittings, in metres.
 *
 * A ship this size is lit, and the reconstruction drew not one lamp: every room
 * took the same flat wash, so a corridor and a ballroom were the same
 * illumination over different footprints. Fittings on a grid are what the deck
 * plans imply and never draw — the same standing the columns have — and eight
 * metres is the span one bulkhead-mounted lamp of the period covers.
 *
 * Laid on the ship's grid rather than each room's, like the plating: the lamps of
 * a corridor line up with the lamps of the hall it opens into, because the
 * wiring ran before the partitions.
 */
export const LAMP_SPACING = 8

/**
 * Where a room's ceiling fittings hang.
 *
 * Nothing is drawn for them — see `mesh.ts`, which bakes their light into the
 * vertex colours the deck already carries — so this is a list of positions, not
 * of geometry, and it costs no triangle and no draw call. A room too small to
 * hold a grid point still gets one: a cabin has a light.
 */
export function ceilingLamps(footprint: Polygon, spacing = LAMP_SPACING): Vec2[] {
  if (spacing < EPSILON || footprint.length < 3) return []

  const xs = footprint.map((point) => point[0])
  const zs = footprint.map((point) => point[1])
  const lamps: Vec2[] = []

  // Cell centres, so a corridor as wide as one cell is lit down its middle
  // rather than along the wall.
  const first = (values: number[]) => Math.floor(Math.min(...values) / spacing) - 1
  const last = (values: number[]) => Math.ceil(Math.max(...values) / spacing) + 1

  for (let i = first(xs); i <= last(xs); i++) {
    for (let j = first(zs); j <= last(zs); j++) {
      const point: Vec2 = [(i + 0.5) * spacing, (j + 0.5) * spacing]
      if (pointInPolygon(point, footprint)) lamps.push(point)
    }
  }

  return lamps.length ? lamps : [interiorPoint(footprint)]
}

/**
 * The triangle cut into smaller ones until no edge is longer than `maxEdge`.
 *
 * The deck is lit by point lights and shaded per vertex, so a floor drawn as two
 * enormous triangles can only be flat: there is nowhere between its corners to
 * put a value. Splitting the longest edge in half and recursing gives every
 * surface interior vertices to hold light in, and keeps the split at the middle
 * of an edge so neighbouring triangles agree on it and no crack opens up.
 */
export function subdivideTriangle(triangle: Triangle, maxEdge: number): Triangle[] {
  const [a, b, c] = triangle
  const ab = len(sub(b, a))
  const bc = len(sub(c, b))
  const ca = len(sub(a, c))
  const longest = Math.max(ab, bc, ca)
  if (!(maxEdge > 0) || longest <= maxEdge) return [triangle]

  const mid = (p: Vec2, q: Vec2): Vec2 => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
  // Split the longest edge, so the pieces stay as near equilateral as the
  // original was rather than growing ever thinner slivers.
  if (longest === ab) {
    const m = mid(a, b)
    return [...subdivideTriangle([a, m, c], maxEdge), ...subdivideTriangle([m, b, c], maxEdge)]
  }
  if (longest === bc) {
    const m = mid(b, c)
    return [...subdivideTriangle([a, b, m], maxEdge), ...subdivideTriangle([a, m, c], maxEdge)]
  }
  const m = mid(c, a)
  return [...subdivideTriangle([a, b, m], maxEdge), ...subdivideTriangle([m, b, c], maxEdge)]
}
