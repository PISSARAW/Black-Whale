/**
 * Doorways: how two rooms that share a wall get an opening between them.
 *
 * The shared wall is found geometrically (`longestSharedWall`), the opening is
 * cut to a walkable width unless the blueprint declares the pair sealed, and
 * what the wall leaves on either side comes back as the segments the visitor
 * collides with and the renderer draws.
 */
import type { DoorOverride, Doorway, Polygon, Space, Vec2, WallSegment } from './types'
import {
  EPSILON,
  along,
  collinearOverlap,
  iterateEdges,
  len,
  sub,
  toCounterClockwise,
} from './geometry-math'

/** Doorways are cut to this width when the shared wall allows it. */
export const DOOR_WIDTH = 3

/** A shared wall shorter than this is a corner touch, not a way through. */
export const MIN_DOOR_WIDTH = 1.2

/** Head height of an opening. Above it, the wall carries on to the ceiling. */
export const DOOR_HEIGHT = 2.6

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
 * `sealed` names those pairs, and the blueprint has to say so explicitly — a
 * blind wall is a claim about the ship, so it is recorded rather than guessed
 * from the category of the rooms.
 */
export interface DoorwayRules {
  /** Pairs that share a wall with nothing through it. */
  sealed?: ReadonlySet<string>
  /** Pairs whose opening is placed by hand, keyed by `sealKey`. */
  overrides?: ReadonlyMap<string, DoorOverride>
  /** Pairs where the wall has been cut, keyed by `sealKey`. */
  cutWalls?: ReadonlySet<string>
}

export function deriveDoorways(spaces: Space[], rules: DoorwayRules = {}): Doorway[] {
  const doorways: Doorway[] = []
  for (let i = 0; i < spaces.length; i++) {
    for (let j = i + 1; j < spaces.length; j++) {
      const doorway = pairDoorway(spaces[i], spaces[j], rules)
      if (doorway) doorways.push(doorway)
    }
  }
  return doorways
}

/** The opening two neighbouring rooms share, or `null` when no wall is cut. */
function pairDoorway(a: Space, b: Space, rules: DoorwayRules): Doorway | null {
  if (a.tierId !== b.tierId || blockedByRules(a, b, rules)) return null

  const wall = longestSharedWall(a.footprint, b.footprint)
  const span = wall ? wall.to - wall.from : 0
  if (!wall) return null

  const override = rules.overrides?.get(sealKey(a.id, b.id))
  if (!override && span < MIN_DOOR_WIDTH) return null
  return openingOn(wall, { a, b, override })
}

/** Whether the blueprint stands between these two rooms and their neighbours. */
function blockedByRules(a: Space, b: Space, rules: DoorwayRules): boolean {
  const key = sealKey(a.id, b.id)
  // A declared door beats everything: it is how an envelope is entered at all,
  // and how a plan places an opening the geometry would have centred.
  if (rules.overrides?.has(key) || rules.cutWalls?.has(key)) return false
  return rules.sealed?.has(key) === true || a.envelope !== b.envelope
}

/** Cuts the opening into `wall`: centred, or pulled towards the declared point. */
function openingOn(
  wall: { from: number; to: number; a1: Vec2; unit: Vec2 },
  side: { a: Space; b: Space; override?: DoorOverride },
): Doorway {
  const span = wall.to - wall.from
  const override = side.override
  const width = Math.min(override?.width ?? DOOR_WIDTH, span)
  const middle = override
    ? Math.min(
        wall.to - width / 2,
        Math.max(
          wall.from + width / 2,
          (override.at[0] - wall.a1[0]) * wall.unit[0] +
            (override.at[1] - wall.a1[1]) * wall.unit[1],
        ),
      )
    : (wall.from + wall.to) / 2
  const at = (t: number): Vec2 => [
    wall.a1[0] + wall.unit[0] * t,
    wall.a1[1] + wall.unit[1] * t,
  ]

  return {
    tierId: side.a.tierId,
    a: side.a.id,
    b: side.b.id,
    start: at(middle - width / 2),
    end: at(middle + width / 2),
    width,
  }
}

/** One edge of a footprint, walked as a directed segment. */
interface EdgeWalk {
  spaceId: string
  start: Vec2
  unit: Vec2
  length: number
}

/** A wall stretch between two distances along one walked edge. */
function stretch(edge: EdgeWalk, from: number, to: number): WallSegment {
  const at = (t: number): Vec2 => [edge.start[0] + edge.unit[0] * t, edge.start[1] + edge.unit[1] * t]
  return { spaceId: edge.spaceId, start: at(from), end: at(to) }
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
    const unit = norm(dir)
    const edge: EdgeWalk = { spaceId: space.id, start: a1, unit, length }
    walls.push(...solidStretches(edge, mine))
  }

  return walls
}

const norm = (dir: Vec2): Vec2 => {
  const length = len(dir)
  return length < EPSILON ? dir : ([dir[0] / length, dir[1] / length] as Vec2)
}

/** Walks one edge and returns the wall left between the openings that cross it. */
function solidStretches(edge: EdgeWalk, doors: Doorway[]): WallSegment[] {
  const end = along(edge.start, edge.unit, edge.length)
  const gaps: Array<[number, number]> = []
  for (const door of doors) {
    const overlap = collinearOverlap([edge.start, end], [door.start, door.end])
    if (overlap) gaps.push([overlap.from, overlap.to])
  }
  gaps.sort((left, right) => left[0] - right[0])

  const walls: WallSegment[] = []
  let cursor = 0
  for (const [from, to] of gaps) {
    if (from - cursor > EPSILON) walls.push(stretch(edge, cursor, from))
    cursor = Math.max(cursor, to)
  }
  if (edge.length - cursor > EPSILON) walls.push(stretch(edge, cursor, edge.length))
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
