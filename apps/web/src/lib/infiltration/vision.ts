import type { WallSegment, Vec2 } from '../tour/types'
import type { Witness } from './state'

export const VISION_HALF_ANGLE = Math.PI / 3

export function canSee(
  witness: Witness,
  target: { position: Vec2; spaceId: string | null },
  walls: WallSegment[],
): boolean {
  if (!target.spaceId || witness.spaceId !== target.spaceId) return false
  const dx = target.position[0] - witness.position[0]
  const dz = target.position[1] - witness.position[1]
  const distance = Math.hypot(dx, dz)
  if (distance > witness.sight) return false
  if (angleBetween(Math.atan2(dx, dz), witness.heading) > VISION_HALF_ANGLE) return false
  return !walls.some((wall) =>
    intersects([witness.position, target.position], [wall.start, wall.end]),
  )
}

function angleBetween(a: number, b: number): number {
  const raw = Math.abs(a - b) % (Math.PI * 2)
  return raw > Math.PI ? Math.PI * 2 - raw : raw
}

function intersects([a, b]: [Vec2, Vec2], [c, d]: [Vec2, Vec2]): boolean {
  const denominator = cross(sub(b, a), sub(d, c))
  if (Math.abs(denominator) < 1e-7) return false
  const t = cross(sub(c, a), sub(d, c)) / denominator
  const u = cross(sub(c, a), sub(b, a)) / denominator
  return t > 0.01 && t < 0.99 && u >= 0 && u <= 1
}

function sub(a: Vec2, b: Vec2): Vec2 {
  return [a[0] - b[0], a[1] - b[1]]
}
function cross(a: Vec2, b: Vec2): number {
  return a[0] * b[1] - a[1] * b[0]
}
