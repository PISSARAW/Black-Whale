import { EPSILON } from './geometry'
import type { BlindWall } from './blueprint'
import type { Vec2, WallSegment } from './types'

/** Whether a wall segment runs along the stretch a seal keeps blind. */
export function runsAlong(wall: WallSegment, blind: BlindWall): boolean {
  const dx = blind.end[0] - blind.start[0]
  const dz = blind.end[1] - blind.start[1]
  const length = Math.hypot(dx, dz)
  if (length < EPSILON) return false
  const unit: Vec2 = [dx / length, dz / length]

  for (const point of [wall.start, wall.end]) {
    const ox = point[0] - blind.start[0]
    const oz = point[1] - blind.start[1]
    // Off the seal's line, or past either of its ends: a different wall.
    if (Math.abs(ox * unit[1] - oz * unit[0]) > 0.05) return false
    const t = ox * unit[0] + oz * unit[1]
    if (t < -0.05 || t > length + 0.05) return false
  }
  return true
}
