import { pointInPolygon, structureFootprint } from '../tour/geometry'
import type { Polygon, Space, Structure, Vec2 } from '../tour/types'

/**
 * The strip of a room a duel is fought along.
 *
 * `direction` is the unit vector the fighters move on, in the plan's own
 * `[x, z]`. The audience stands on its left-hand side and the backdrop is on
 * its right, so the choice of direction is also the choice of which wall the
 * camera looks at.
 */
export interface FightLane {
  centre: Vec2
  direction: Vec2
}

/** Half the engine's lane (0–100 at 0.115 m a unit), with room to lunge. */
const HALF_LENGTH = 6.4
/** How far either side of the line a body reaches. */
const HALF_WIDTH = 1
const SAMPLE = 0.8
const GRID = 2
/** A solid hung above this is walked under, not into. */
const HEADROOM = 2.2
/** How far behind the fighters the backdrop reads best. */
const BACKDROP = 7
const RAY_LIMIT = 40
const COLUMN_CLEARANCE = 1.1
/** What the camera frames behind the fighters, in metres either side and deep. */
const FRAME_HALF_WIDTH = 11
const FRAME_DEPTH = 24
const SIGHTS_CAP = 8

/** What stands in a room besides the blueprint's own solids. */
export interface LaneObstacles {
  /** Pillar centres, from the plan's column grid. */
  columns?: readonly Vec2[]
  /** Hand-modelled barriers the blueprint does not list, as plan outlines. */
  barriers?: readonly Polygon[]
}

const DIRECTIONS: readonly Vec2[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

/** The backdrop side of a lane: the right-hand normal of its direction. */
export function laneBackdrop(direction: Vec2): Vec2 {
  return [direction[1], -direction[0]]
}

function boundsOf(footprint: Polygon) {
  const xs = footprint.map((point) => point[0])
  const zs = footprint.map((point) => point[1])
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
  }
}

function gridOf(footprint: Polygon): Vec2[] {
  const { minX, maxX, minZ, maxZ } = boundsOf(footprint)
  const points: Vec2[] = []
  for (let x = minX + GRID / 2; x < maxX; x += GRID) {
    for (let z = minZ + GRID / 2; z < maxZ; z += GRID) points.push([x, z])
  }
  return points
}

function laneSamples(lane: FightLane): Vec2[] {
  const [dx, dz] = lane.direction
  const [bx, bz] = laneBackdrop(lane.direction)
  const samples: Vec2[] = []
  for (let along = -HALF_LENGTH; along <= HALF_LENGTH; along += SAMPLE) {
    for (const across of [-HALF_WIDTH, 0, HALF_WIDTH]) {
      samples.push([
        lane.centre[0] + dx * along + bx * across,
        lane.centre[1] + dz * along + bz * across,
      ])
    }
  }
  return samples
}

function laneIsClear(lane: FightLane, footprint: Polygon, blockers: Polygon[]): boolean {
  return laneSamples(lane).every(
    (point) =>
      pointInPolygon(point, footprint) && !blockers.some((solid) => pointInPolygon(point, solid)),
  )
}

/** The square a pillar keeps clear around itself, pier and plinth included. */
function columnClearance([x, z]: Vec2): Polygon {
  return [
    [x - COLUMN_CLEARANCE, z - COLUMN_CLEARANCE],
    [x + COLUMN_CLEARANCE, z - COLUMN_CLEARANCE],
    [x + COLUMN_CLEARANCE, z + COLUMN_CLEARANCE],
    [x - COLUMN_CLEARANCE, z + COLUMN_CLEARANCE],
  ]
}

/** How far the room runs from `from` along `towards` before a wall. */
function reach(from: Vec2, towards: Vec2, footprint: Polygon): number {
  for (let distance = 0.5; distance < RAY_LIMIT; distance += 0.5) {
    const point: Vec2 = [from[0] + towards[0] * distance, from[1] + towards[1] * distance]
    if (!pointInPolygon(point, footprint)) return distance
  }
  return RAY_LIMIT
}

/** How many of the room's solids the camera would find behind this lane. */
function sightsBehind(lane: FightLane, sights: readonly Vec2[]): number {
  const [dx, dz] = lane.direction
  const [bx, bz] = laneBackdrop(lane.direction)
  let seen = 0
  for (const [x, z] of sights) {
    const along = (x - lane.centre[0]) * dx + (z - lane.centre[1]) * dz
    const depth = (x - lane.centre[0]) * bx + (z - lane.centre[1]) * bz
    if (Math.abs(along) < FRAME_HALF_WIDTH && depth > 1.5 && depth < FRAME_DEPTH) seen += 1
  }
  return Math.min(seen, SIGHTS_CAP)
}

/**
 * A lane is worth what stands behind it first — a stage, a bench, a window —
 * and only then how close its back wall is. A bare wall at the ideal distance
 * loses to a furnished room seen from further off.
 */
function laneScore(lane: FightLane, footprint: Polygon, sights: readonly Vec2[]): number {
  const { minX, maxX, minZ, maxZ } = boundsOf(footprint)
  const middle = Math.hypot(lane.centre[0] - (minX + maxX) / 2, lane.centre[1] - (minZ + maxZ) / 2)
  const behind = reach(lane.centre, laneBackdrop(lane.direction), footprint)
  return sightsBehind(lane, sights) * 3 - Math.abs(behind - BACKDROP) * 0.4 - middle * 0.05
}

/** A room too small or too furnished for a clear strip still gets its long axis. */
function fallbackLane(footprint: Polygon): FightLane {
  const { minX, maxX, minZ, maxZ } = boundsOf(footprint)
  const centre: Vec2 = [(minX + maxX) / 2, (minZ + maxZ) / 2]
  return { centre, direction: maxX - minX >= maxZ - minZ ? [1, 0] : [0, 1] }
}

/** Everything a fighter cannot stand in, as plan outlines. */
function blockersOf(structures: readonly Structure[], obstacles: LaneObstacles): Polygon[] {
  return [
    ...structures.filter((structure) => structure.base < HEADROOM).map(structureFootprint),
    ...(obstacles.columns ?? []).map(columnClearance),
    ...(obstacles.barriers ?? []),
  ]
}

/**
 * Picks the clear strip of a room with the best backdrop behind it.
 *
 * Nothing is authored per room: the strip is derived from the footprint and
 * from what stands in it, so a room refurnished in the blueprint moves its
 * duel without anyone touching this file.
 */
export function findFightLane(
  space: Space,
  structures: readonly Structure[],
  obstacles: LaneObstacles = {},
): FightLane {
  const blockers = blockersOf(structures, obstacles)
  const sights = structures.map((structure) => structure.at)
  let best: { lane: FightLane; score: number } | null = null
  for (const centre of gridOf(space.footprint)) {
    for (const direction of DIRECTIONS) {
      const lane = { centre, direction }
      if (!laneIsClear(lane, space.footprint, blockers)) continue
      const score = laneScore(lane, space.footprint, sights)
      if (!best || score > best.score) best = { lane, score }
    }
  }
  return best?.lane ?? fallbackLane(space.footprint)
}
