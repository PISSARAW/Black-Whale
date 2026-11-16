import { pointInPolygon, polygonsOverlap, structureFootprint } from '../tour/geometry'
import type { Polygon, Space, Structure, Vec2 } from '../tour/types'
import { FIGHT_BODY_HALF_WIDTH } from './stageRoomCut'

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
  /** Lateral room reserved around the rendered bodies. */
  bodyHalfWidth?: number
}

/** Half the engine's lane (0–100 at 0.115 m a unit), with room to lunge. */
const HALF_LENGTH = 6.4
/** How far either side of the line a body reaches. */
const HALF_WIDTH = FIGHT_BODY_HALF_WIDTH
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
  /** Exact clearance of the detailed room model, beyond its coarse collision boxes. */
  isClear?: (lane: FightLane) => boolean
  halfWidth?: number
  /** The entire body strip is in the opened fourth wall, in front of the retained model. */
  cutaway?: boolean
  /** Optional weighted landmarks read from the room's own furniture. */
  sights?: readonly Vec2[]
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

function gridOf(footprint: Polygon, spacing = GRID): Vec2[] {
  const { minX, maxX, minZ, maxZ } = boundsOf(footprint)
  const points: Vec2[] = []
  for (let x = minX + spacing / 2; x < maxX; x += spacing) {
    for (let z = minZ + spacing / 2; z < maxZ; z += spacing) points.push([x, z])
  }
  return points
}

function laneSamples(lane: FightLane): Vec2[] {
  const [dx, dz] = lane.direction
  const [bx, bz] = laneBackdrop(lane.direction)
  const samples: Vec2[] = []
  for (let along = -HALF_LENGTH; along <= HALF_LENGTH; along += SAMPLE) {
    for (const across of [
      -(lane.bodyHalfWidth ?? HALF_WIDTH),
      0,
      lane.bodyHalfWidth ?? HALF_WIDTH,
    ]) {
      samples.push([
        lane.centre[0] + dx * along + bx * across,
        lane.centre[1] + dz * along + bz * across,
      ])
    }
  }
  return samples
}

function laneIsClear(lane: FightLane, footprint: Polygon, blockers: Polygon[]): boolean {
  const [dx, dz] = lane.direction
  const halfWidth = lane.bodyHalfWidth ?? HALF_WIDTH
  const strip: Polygon = [
    [-HALF_LENGTH, -halfWidth],
    [HALF_LENGTH, -halfWidth],
    [HALF_LENGTH, halfWidth],
    [-HALF_LENGTH, halfWidth],
  ].map(([along, across]) => [
    lane.centre[0] + dx * along + dz * across,
    lane.centre[1] + dz * along - dx * across,
  ])
  return (
    laneSamples(lane).every((point) => pointInPolygon(point, footprint)) &&
    !blockers.some((solid) => polygonsOverlap(strip, solid))
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
function sightsBehind(lane: FightLane, sights: readonly Vec2[], targeted = false): number {
  const [dx, dz] = lane.direction
  const [bx, bz] = laneBackdrop(lane.direction)
  let seen = 0
  for (const [x, z] of sights) {
    const along = (x - lane.centre[0]) * dx + (z - lane.centre[1]) * dz
    const depth = (x - lane.centre[0]) * bx + (z - lane.centre[1]) * bz
    // A near wall is much narrower on screen than the distant end of a hall.
    const framedWidth = targeted
      ? Math.min(FRAME_HALF_WIDTH, (9.2 + depth) * 0.46) - 0.5
      : FRAME_HALF_WIDTH
    if (Math.abs(along) < framedWidth && depth > 1.5 && depth < FRAME_DEPTH) seen += 1
  }
  return Math.min(seen, SIGHTS_CAP)
}

/**
 * A lane is worth what stands behind it first — a stage, a bench, a window —
 * and only then how close its back wall is. A bare wall at the ideal distance
 * loses to a furnished room seen from further off.
 */
function laneScore(
  lane: FightLane,
  options: { footprint: Polygon; sights: readonly Vec2[]; targeted?: boolean },
): number {
  const { footprint, sights, targeted } = options
  const { minX, maxX, minZ, maxZ } = boundsOf(footprint)
  const middle = Math.hypot(lane.centre[0] - (minX + maxX) / 2, lane.centre[1] - (minZ + maxZ) / 2)
  const behind = reach(lane.centre, laneBackdrop(lane.direction), footprint)
  return (
    sightsBehind(lane, sights, targeted) * 3 - Math.abs(behind - BACKDROP) * 0.4 - middle * 0.05
  )
}

/** Everything a fighter cannot stand in, as plan outlines. */
function blockersOf(structures: readonly Structure[], obstacles: LaneObstacles): Polygon[] {
  if (obstacles.cutaway) return []
  return [
    ...structures.filter((structure) => structure.base < HEADROOM).map(structureFootprint),
    ...(obstacles.columns ?? []).map(columnClearance),
    ...(obstacles.barriers ?? []),
  ]
}

function clearsModel(lane: FightLane, validate?: LaneObstacles['isClear']): boolean {
  return validate?.(lane) ?? true
}

function bestLane(options: {
  footprint: Polygon
  blockers: Polygon[]
  sights: readonly Vec2[]
  directions: readonly Vec2[]
  spacing: number
  isClear?: (lane: FightLane) => boolean
  stopAtFirst?: boolean
  halfWidth?: number
  targeted?: boolean
}): FightLane | null {
  const { footprint, blockers, directions, spacing } = options
  let best: { lane: FightLane; score: number } | null = null
  for (const centre of gridOf(footprint, spacing)) {
    for (const direction of directions) {
      const lane = { centre, direction, bodyHalfWidth: options.halfWidth }
      if (!laneIsClear(lane, footprint, blockers)) continue
      const score = laneScore(lane, options)
      if (best && score <= best.score) continue
      if (!clearsModel(lane, options.isClear)) continue
      if (options.stopAtFirst) return lane
      best = { lane, score }
    }
  }
  return best?.lane ?? null
}

function furnitureDirections(structures: readonly Structure[]): Vec2[] {
  const directions = new Map<string, Vec2>()
  const keep = (direction: Vec2) =>
    directions.set(direction.map((value) => value.toFixed(5)).join(':'), direction)
  DIRECTIONS.forEach(keep)
  for (const structure of structures) {
    const angle = (structure.rotation * Math.PI) / 180
    const dx = Math.cos(angle)
    const dz = -Math.sin(angle)
    keep([dx, dz])
    keep([-dx, -dz])
  }
  return [...directions.values()]
}

/** Detail overhangs can require a direction between the furniture's axes. */
const FINE_DIRECTIONS: readonly Vec2[] = Array.from({ length: 72 }, (_, index) => {
  const angle = (index * Math.PI) / 36
  return [Math.cos(angle), Math.sin(angle)] as const
})

const COMPOSITION_DIRECTIONS: readonly Vec2[] = DIRECTIONS.flatMap(([dx, dz]) =>
  [-45, -30, -15, 15, 30, 45].map((degrees): Vec2 => {
    const angle = (degrees * Math.PI) / 180
    return [
      dx * Math.cos(angle) - dz * Math.sin(angle),
      dx * Math.sin(angle) + dz * Math.cos(angle),
    ]
  }),
)

function composedLane(options: {
  lane: FightLane
  space: Space
  structures: readonly Structure[]
  obstacles: LaneObstacles
}): FightLane {
  const { lane, space, structures, obstacles } = options
  if (!obstacles.sights) return lane
  const scoring = { footprint: space.footprint, sights: obstacles.sights, targeted: true }
  const tilted = bestLane({
    footprint: space.footprint,
    blockers: blockersOf(structures, obstacles),
    sights: obstacles.sights,
    isClear: obstacles.isClear,
    halfWidth: obstacles.halfWidth,
    directions: COMPOSITION_DIRECTIONS,
    spacing: GRID,
    targeted: true,
  })
  let best = lane
  if (tilted && laneScore(tilted, scoring) > laneScore(best, scoring)) best = tilted
  if (laneScore(best, scoring) > 12) return best
  const fine = bestLane({
    footprint: space.footprint,
    blockers: blockersOf(structures, obstacles),
    sights: obstacles.sights,
    isClear: obstacles.isClear,
    halfWidth: obstacles.halfWidth,
    directions: COMPOSITION_DIRECTIONS,
    spacing: GRID / 4,
    targeted: true,
  })
  if (fine && laneScore(fine, scoring) > laneScore(best, scoring)) best = fine
  return best
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
  const sights = obstacles.sights ?? structures.map((structure) => structure.at)
  const room = {
    footprint: space.footprint,
    blockers,
    sights,
    isClear: obstacles.isClear,
    halfWidth: obstacles.halfWidth,
    targeted: Boolean(obstacles.sights),
  }
  const coarse = bestLane({ ...room, directions: DIRECTIONS, spacing: GRID })
  if (coarse) return composedLane({ lane: coarse, space, structures, obstacles })

  // A rotunda's radial furniture can leave only narrow diagonal passages.
  // Before rejecting the room, search more finely along the
  // furniture's own directions, looking at either side of each passage.
  const fine = bestLane({ ...room, directions: furnitureDirections(structures), spacing: GRID / 4 })
  if (fine) return fine
  const precise = bestLane({
    ...room,
    directions: FINE_DIRECTIONS,
    spacing: GRID / 8,
    stopAtFirst: true,
  })
  if (precise) return precise
  throw new Error(`No clear fight lane in ${space.id}`)
}
