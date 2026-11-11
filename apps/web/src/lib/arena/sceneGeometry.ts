import { structureFootprint } from '../tour/geometry'
import type { Structure, Vec2, WallSegment } from '../tour/types'

/** Small geometric readings the arena page makes of its own scene. */

/** Where a solid the reticle rests on is anchored, e.g. by Bungee Gum. */
export function solidCentre(structure: Structure): Vec2 {
  return polygonCentre(structureFootprint(structure))
}

export function polygonCentre(points: Vec2[]): Vec2 {
  const sum = points.reduce<Vec2>(
    (total, point) => [total[0] + point[0], total[1] + point[1]],
    [0, 0],
  )
  return [sum[0] / points.length, sum[1] / points.length]
}

/** The square the opponent's body blocks, as walls the camera collides with. */
export function blockerAt(at: Vec2, spaceId: string): WallSegment[] {
  const radius = 0.55
  const corners: Vec2[] = [
    [at[0] - radius, at[1] - radius],
    [at[0] + radius, at[1] - radius],
    [at[0] + radius, at[1] + radius],
    [at[0] - radius, at[1] + radius],
  ]
  return corners.map((start, index) => ({
    spaceId,
    start,
    end: corners[(index + 1) % corners.length],
  }))
}

export function facing(from: Vec2, to: Vec2): number {
  return Math.atan2(from[0] - to[0], from[1] - to[1])
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

const MOVEMENT_CODES = [
  'KeyW',
  'KeyZ',
  'KeyS',
  'KeyA',
  'KeyQ',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]

export function isMovement(code: string): boolean {
  return MOVEMENT_CODES.includes(code)
}
