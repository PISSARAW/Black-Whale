import type { Lantern, Polygon, Structure, Triangle, Vec2, WallSegment } from './types'

import {
  EPSILON,
  along,
  pointInPolygon,
  iterateEdges,
  closestPointOnSegment,
  polygonArea,
  len,
  sub,
  cross,
  triangulate,
} from './geometry-math'

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
  let best: Vec2 = polygonCentroid(polygon)
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

/** The average of the outline's corners — close enough for lamp fallbacks. */
function polygonCentroid(polygon: Polygon): Vec2 {
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

  const crossings = outlineCrossings(polygon, { origin: a, unit, length })
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

/** Where the segment crosses the outline, sorted along it, ends included. */
function outlineCrossings(
  polygon: Polygon,
  ray: { origin: Vec2; unit: Vec2; length: number },
): number[] {
  const crossings = [0, ray.length]
  for (const [p, q] of iterateEdges(polygon)) {
    const edge = sub(q, p)
    const denominator = cross(ray.unit, edge)
    if (Math.abs(denominator) < 1e-9) continue
    const offset = sub(p, ray.origin)
    const t = cross(offset, edge) / denominator
    const u = cross(offset, ray.unit) / denominator
    if (t < 0 || t > ray.length || u < 0 || u > 1) continue
    crossings.push(t)
  }
  return crossings.sort((x, y) => x - y)
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
 * Laid on each room's own grid rather than on the ship's, and that is a
 * correction rather than a preference. The lamps used to sit at `(i + 0.5) *
 * spacing` in ship coordinates — one grid for the whole hull, on the claim that
 * the wiring ran before the partitions — and what a room got out of it was
 * decided by where its walls happened to fall modulo the spacing. Ninety-three
 * of the 318 spaces caught no cell centre at all and fell through to the single
 * `interiorPoint` below: one lamp for the 2 205 m² of the Tier 5 aft corridor,
 * one for the 1 764 m² of Tier 4's forward corridor. Worse, it made neighbours
 * disagree for no reason anyone on board could see — the two royal residential
 * corridors, 147 m² each, took one lamp while the cross-gaps beside them took
 * seven, and the deck read as though the electricians had run out halfway.
 *
 * A phase lottery is not a claim about the ship. So the grid keeps its nominal
 * pitch — which is what `REACH_RATIO` and `RoomLight.pool`'s window of cells
 * are owed — and is centred on the room instead: a corridor is lit down its
 * middle whatever its width, a cabin gets its one lamp over the floor rather
 * than in a corner, and two rooms of the same shape are lit the same wherever
 * they stand. What is lost is the lamps of a corridor lining up with the lamps
 * of the hall it opens into, which was true of at most the rooms the lottery
 * happened to favour anyway.
 */
export const LAMP_SPACING = 8

/**
 * Where the lamps fall along one axis: `n` of them at the nominal pitch, centred
 * on the room's extent.
 *
 * `n` is the extent rounded to whole pitches and never less than one, so a room
 * narrower than its own grid still gets a row down its centre rather than none.
 */
function lampAxis(min: number, max: number, spacing: number): number[] {
  const count = Math.max(1, Math.round((max - min) / spacing))
  const middle = (min + max) / 2
  const positions: number[] = []
  for (let k = 0; k < count; k++) positions.push(middle + (k - (count - 1) / 2) * spacing)
  return positions
}

/**
 * Where a room's ceiling fittings hang.
 *
 * Nothing is drawn for them — see `mesh.ts`, which bakes their light into the
 * vertex colours the deck already carries — so this is a list of positions, not
 * of geometry, and it costs no triangle and no draw call. A room too small to
 * hold a grid point still gets one: a cabin has a light.
 *
 * The `interiorPoint` fallback survives for the one case the centred grid cannot
 * answer — a room concave enough that every point of its own grid lands outside
 * it — where before it caught a quarter of the ship.
 */
export function ceilingLamps(footprint: Polygon, spacing = LAMP_SPACING): Vec2[] {
  if (spacing < EPSILON || footprint.length < 3) return []

  const xs = footprint.map((point) => point[0])
  const zs = footprint.map((point) => point[1])
  const lamps: Vec2[] = []

  for (const x of lampAxis(Math.min(...xs), Math.max(...xs), spacing)) {
    for (const z of lampAxis(Math.min(...zs), Math.max(...zs), spacing)) {
      const point: Vec2 = [x, z]
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
