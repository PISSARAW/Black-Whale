import type { TierPlan } from './blueprint'
import { pointInPolygon } from './geometry'
import type { Space, Vec2 } from './types'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'

export interface CorridorWallRun {
  start: Vec2
  tangent: Vec2
  inward: Vec2
  length: number
  angle: number
}

export interface WallBoxPlacement {
  along: number
  y: number
  colour: number
  inset?: number
}

export interface WallBay {
  along: number
  width: number
  index: number
}

/** Determines which ship tier (1 to 5) a space belongs to. */
export function tierOfSpace(spaceId: string, tierFallback = 'tier-1'): 1 | 2 | 3 | 4 | 5 {
  const match = spaceId.match(/^tier-([1-5])/)
  if (match) {
    const parsed = Number(match[1])
    if (parsed >= 1 && parsed <= 5) return parsed as 1 | 2 | 3 | 4 | 5
  }
  const tierMatch = tierFallback.match(/^tier-([1-5])/)
  if (tierMatch) {
    const parsed = Number(tierMatch[1])
    if (parsed >= 1 && parsed <= 5) return parsed as 1 | 2 | 3 | 4 | 5
  }
  return 1
}

/** Extracts usable continuous wall runs for a corridor space. */
export function corridorWallRuns(plan: TierPlan, space: Space): CorridorWallRun[] {
  return plan.walls
    .filter((wall) => wall.spaceId === space.id && !wall.structureId && !wall.jambOf)
    .flatMap((wall) => {
      const dx = wall.end[0] - wall.start[0]
      const dz = wall.end[1] - wall.start[1]
      const length = Math.hypot(dx, dz)
      if (length < 1.4) return []
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
  run: CorridorWallRun,
  options: { along: number; y: number; inset?: number },
): Point3 {
  const inset = options.inset ?? 0.08
  return [
    run.start[0] + run.tangent[0] * options.along + run.inward[0] * inset,
    options.y,
    run.start[1] + run.tangent[1] * options.along + run.inward[1] * inset,
  ]
}

export interface WallSurface {
  into: BanquetDetailBuilder
  run: CorridorWallRun
}

export function wallBox(wall: WallSurface, size: Point3, options: WallBoxPlacement): void {
  wall.into.box(size, {
    at: wallPoint(wall.run, {
      along: options.along,
      y: options.y,
      inset: options.inset,
    }),
    rotation: [0, wall.run.angle, 0],
    colour: options.colour,
  })
}

export function wallBays(run: CorridorWallRun, bayPitch = 3.2): WallBay[] {
  const count = Math.max(1, Math.floor(run.length / bayPitch))
  const pitch = run.length / count
  return Array.from({ length: count }, (_, index) => ({
    along: pitch * (index + 0.5),
    width: Math.max(0.6, pitch - 0.4),
    index,
  }))
}
