import { describe, expect, it } from 'vitest'
import { buildShip } from './blueprint'
import { blocksTheFloor, distanceToBoundary, pointInPolygon, structureFootprint } from './geometry'
import { VISITOR_RADIUS } from './navigation'
import type { Doorway, Polygon, Space, Structure, Vec2 } from './types'

const STEP = 0.4
const FURNITURE = new Set(['counter', 'table', 'bed', 'seat', 'cabinet', 'basin', 'lifeboat'])

const bounds = (polygon: Polygon) => ({
  x0: Math.min(...polygon.map(([x]) => x)),
  x1: Math.max(...polygon.map(([x]) => x)),
  z0: Math.min(...polygon.map(([, z]) => z)),
  z1: Math.max(...polygon.map(([, z]) => z)),
})

function blocked(point: Vec2, structure: Structure): boolean {
  const footprint = structureFootprint(structure)
  return pointInPolygon(point, footprint) || distanceToBoundary(point, footprint) < VISITOR_RADIUS
}

function walkableGrid(space: Space, furniture: Structure[]) {
  const box = bounds(space.footprint)
  const points: Vec2[] = []
  const byPosition = new Map<string, number>()
  const key = (x: number, z: number) => `${x.toFixed(3)},${z.toFixed(3)}`

  for (let x = Math.ceil(box.x0 / STEP) * STEP; x <= box.x1; x += STEP) {
    for (let z = Math.ceil(box.z0 / STEP) * STEP; z <= box.z1; z += STEP) {
      const point: Vec2 = [x, z]
      if (!pointInPolygon(point, space.footprint)) continue
      if (distanceToBoundary(point, space.footprint) < VISITOR_RADIUS) continue
      if (furniture.some((structure) => blocked(point, structure))) continue
      byPosition.set(key(x, z), points.length)
      points.push(point)
    }
  }

  const component = Array(points.length).fill(-1)
  let nextComponent = 0
  for (let start = 0; start < points.length; start += 1) {
    if (component[start] !== -1) continue
    component[start] = nextComponent
    const queue = [start]
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const current = queue[cursor]
      const [x, z] = points[current]
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        const neighbour = byPosition.get(key(x + dx * STEP, z + dz * STEP))
        if (neighbour === undefined || component[neighbour] !== -1) continue
        if (
          dx &&
          dz &&
          (!byPosition.has(key(x + dx * STEP, z)) || !byPosition.has(key(x, z + dz * STEP)))
        )
          continue
        component[neighbour] = nextComponent
        queue.push(neighbour)
      }
    }
    nextComponent += 1
  }
  return { points, component }
}

const midpoint = (door: Doorway): Vec2 => [
  (door.start[0] + door.end[0]) / 2,
  (door.start[1] + door.end[1]) / 2,
]

describe('furniture circulation throughout the ship', () => {
  it('never separates two accesses unless the architecture explicitly seals them', () => {
    const ship = buildShip()
    const failures: string[] = []

    for (const plan of ship.plans.values()) {
      for (const space of plan.spaces) {
        const accesses = plan.doorways
          .filter(({ a, b }) => a === space.id || b === space.id)
          .map(midpoint)
        for (const link of ship.links) {
          if (link.from === space.id) accesses.push(link.at)
          if (link.to === space.id) {
            const arrival = link.atTo ?? link.at
            // Some inter-deck links only author their departure coordinate;
            // the transition chooses a target spawn instead of reusing a
            // coordinate from the other deck's frame.
            if (
              pointInPolygon(arrival, space.footprint) ||
              distanceToBoundary(arrival, space.footprint) < 2
            )
              accesses.push(arrival)
          }
        }
        if (!accesses.length) continue

        const furniture = plan.structures.filter(
          (structure) =>
            structure.spaceId === space.id &&
            FURNITURE.has(structure.kind) &&
            blocksTheFloor(structure),
        )
        if (!furniture.length) continue

        const grid = walkableGrid(space, furniture)
        const accessComponents = new Set<number>()
        let missingAccess = false
        for (const access of accesses) {
          let nearest = -1
          let distance = 2
          for (let index = 0; index < grid.points.length; index += 1) {
            const [x, z] = grid.points[index]
            const candidate = Math.hypot(x - access[0], z - access[1])
            if (candidate >= distance) continue
            distance = candidate
            nearest = index
          }
          if (nearest >= 0) accessComponents.add(grid.component[nearest])
          else missingAccess = true
        }
        if (missingAccess || accessComponents.size > 1) failures.push(`${plan.tier.id}/${space.id}`)
      }
    }

    expect(failures).toEqual([])
  })
})
