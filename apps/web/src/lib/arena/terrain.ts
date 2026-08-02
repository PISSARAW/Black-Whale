import { theShip } from '../tour/blueprint'
import { closestPointOnSegment, pointInPolygon } from '../tour/geometry'
import type { Polygon, Space, Structure, Vec2, WallSegment } from '../tour/types'

export const BANQUET_HALL_ID = 'tier-1-banquet-hall'
const SPAWN_CLEARANCE = 1.5
const SAMPLE_STEP = 2.5
const OPENING_DISTANCE = 24

export interface TerrainBounds {
  minX: number
  minZ: number
  width: number
  height: number
}

export interface CombatTerrain {
  id: string
  tierId: string
  space: Space
  footprint: Polygon
  walls: WallSegment[]
  structures: Structure[]
  spawns: readonly [Vec2, Vec2]
  bounds: TerrainBounds
}

/** The first arena is selected from the ship; no geometry is authored here. */
export function buildCombatTerrain(spaceId = BANQUET_HALL_ID): CombatTerrain {
  const ship = theShip()
  const space = ship.spaces.get(spaceId)
  if (!space) throw new Error(`Combat terrain ${spaceId} is not in the blueprint`)

  const plan = ship.plans.get(space.tierId)
  if (!plan) throw new Error(`Combat terrain tier ${space.tierId} has no plan`)

  const walls = plan.walls.filter((wall) => wall.spaceId === space.id)
  const structures = plan.structures.filter((structure) => structure.spaceId === space.id)
  const spawns = spawnPair(space.footprint, walls)
  return {
    id: space.id,
    tierId: space.tierId,
    space,
    footprint: space.footprint,
    walls,
    structures,
    spawns,
    bounds: boundsOf(space.footprint),
  }
}

function spawnPair(footprint: Polygon, walls: WallSegment[]): readonly [Vec2, Vec2] {
  const candidates = clearPoints(footprint, walls)
  if (candidates.length < 2) throw new Error('Combat terrain has fewer than two clear spawn points')

  const bounds = boundsOf(footprint)
  const centre: Vec2 = [bounds.minX + bounds.width / 2, bounds.minZ + bounds.height / 2]
  const first = nearestTo(candidates, centre)
  const second = candidates.reduce((best, point) =>
    Math.abs(distance(point, first) - OPENING_DISTANCE) <
    Math.abs(distance(best, first) - OPENING_DISTANCE)
      ? point
      : best,
  )
  return [first, second]
}

function clearPoints(footprint: Polygon, walls: WallSegment[]): Vec2[] {
  const bounds = boundsOf(footprint)
  const points: Vec2[] = []
  for (let x = bounds.minX + SAMPLE_STEP; x < bounds.minX + bounds.width; x += SAMPLE_STEP) {
    for (let z = bounds.minZ + SAMPLE_STEP; z < bounds.minZ + bounds.height; z += SAMPLE_STEP) {
      const point: Vec2 = [x, z]
      if (pointInPolygon(point, footprint) && clearanceFrom(point, walls) >= SPAWN_CLEARANCE) {
        points.push(point)
      }
    }
  }
  return points
}

function clearanceFrom(point: Vec2, walls: WallSegment[]): number {
  let nearest = Infinity
  for (const wall of walls) {
    const closest = closestPointOnSegment(point, wall.start, wall.end)
    nearest = Math.min(nearest, distance(point, closest))
  }
  return nearest
}

function nearestTo(points: Vec2[], origin: Vec2): Vec2 {
  return points.reduce((best, point) =>
    distance(point, origin) < distance(best, origin) ? point : best,
  )
}

function boundsOf(polygon: Polygon): TerrainBounds {
  const xs = polygon.map((point) => point[0])
  const zs = polygon.map((point) => point[1])
  const minX = Math.min(...xs)
  const minZ = Math.min(...zs)
  return {
    minX,
    minZ,
    width: Math.max(...xs) - minX,
    height: Math.max(...zs) - minZ,
  }
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}
