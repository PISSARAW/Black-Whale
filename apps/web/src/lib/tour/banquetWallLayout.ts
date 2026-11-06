import type { TierPlan } from './blueprint'
import { pointInPolygon } from './geometry'
import type { Space, Vec2, Structure } from './types'
import type { Point3 } from './banquetDetailBuilder'

export interface BanquetWallRun {
  start: Vec2
  tangent: Vec2
  inward: Vec2
  length: number
  angle: number
}

/** Wall runs already stop at every doorway; column and furniture faces are excluded. */
export function banquetWallRuns(plan: TierPlan, space: Space): BanquetWallRun[] {
  return plan.walls
    .filter((wall) => wall.spaceId === space.id && !wall.structureId && !wall.jambOf)
    .flatMap((wall) => {
      const dx = wall.end[0] - wall.start[0],
        dz = wall.end[1] - wall.start[1]
      const length = Math.hypot(dx, dz)
      if (length < 1.6) return []
      const normal: Vec2 = [dz / length, -dx / length]
      const middle: Vec2 = [(wall.start[0] + wall.end[0]) / 2, (wall.start[1] + wall.end[1]) / 2]
      const sign = pointInPolygon(
        [middle[0] + normal[0] * 0.05, middle[1] + normal[1] * 0.05],
        space.footprint,
      )
        ? 1
        : -1
      const inward: Vec2 = [normal[0] * sign, normal[1] * sign]
      return [
        {
          start: wall.start,
          tangent: [dx / length, dz / length] as Vec2,
          inward,
          length,
          angle: Math.atan2(inward[0], inward[1]),
        },
      ]
    })
}

export function wallPoint(
  run: BanquetWallRun,
  options: { along: number; y: number; inset?: number },
): Point3 {
  const inset = options.inset ?? 0.08
  return [
    run.start[0] + run.tangent[0] * options.along + run.inward[0] * inset,
    options.y,
    run.start[1] + run.tangent[1] * options.along + run.inward[1] * inset,
  ]
}

export function wallBays(run: BanquetWallRun): { along: number; width: number; index: number }[] {
  const count = Math.max(1, Math.floor(run.length / 3.6))
  const pitch = (run.length - 0.5) / count
  return Array.from({ length: count }, (_, index) => ({
    along: 0.25 + pitch * (index + 0.5),
    width: pitch - 0.32,
    index,
  }))
}

/** The balconies follow the actual slab extents, including the entrance notch. */
export function galleryFront(structure: Structure) {
  const length = Math.max(...structure.size)
  const depth = Math.min(...structure.size)
  const inward = structure.at[0] < -1 ? 1 : -1
  return {
    x: structure.at[0] + (inward * depth) / 2,
    z: structure.at[1],
    length,
    depth,
    inward,
    bottom: structure.base,
    top: structure.base + structure.height,
  }
}
