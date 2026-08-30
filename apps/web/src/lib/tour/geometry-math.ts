/**
 * The flat-footprint maths every other geometry module builds on: winding,
 * containment, distance, triangulation. Everything here is pure and
 * framework-free: the same functions feed the renderer, the collision test and
 * the validation suite, so a wall the player bumps into is by construction the
 * wall that was drawn.
 */
import type { Polygon, Segment, Triangle, Vec2 } from './types'

/** Below this, two coordinates are the same point. Footprints are in metres. */
export const EPSILON = 0.05

/**
 * The tallest rise the visitor takes in stride, in metres.
 *
 * Two levels of one room are a step; a step you cannot take is a storey, and a
 * storey is a `link` with a stair on it. Three risers of twenty centimetres is
 * what the banquet hall's service end is drawn as, and it is about the limit of
 * what a floor can do to another floor without becoming a different deck.
 */
export const STEP_UP = 0.6

const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]]
export const len = (a: Vec2) => Math.hypot(a[0], a[1])
const dot = (a: Vec2, b: Vec2) => a[0] * b[0] + a[1] * b[1]
export const cross = (a: Vec2, b: Vec2) => a[0] * b[1] - a[1] * b[0]
export { sub }

/** Twice the signed area. Positive means counter-clockwise in `[x, z]`. */

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

/** A point `t` metres along the unit vector `unit` from `a`. */
export const along = (a: Vec2, unit: Vec2, t: number): Vec2 => [
  a[0] + unit[0] * t,
  a[1] + unit[1] * t,
]

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
