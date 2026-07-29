/**
 * Moving the visitor through the reconstruction.
 *
 * The walls the visitor collides with are the walls `geometry.ts` produced for
 * the renderer, doorways already cut out of them. There is no second, simpler
 * collision model to drift out of step with what is on screen: if you can see
 * through an opening, you can walk through it.
 */
import { EPSILON, closestPointOnSegment } from './geometry'
import type { Link, Vec2, WallSegment } from './types'

/** Shoulder width of the visitor, in metres. */
export const VISITOR_RADIUS = 0.4

/** How close to a stairwell you have to stand for it to offer the other deck. */
export const LINK_REACH = 6

const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]]
const len = (a: Vec2) => Math.hypot(a[0], a[1])

/**
 * Slides the visitor from `from` towards `to` without letting them through a
 * wall.
 *
 * The move is cut into steps no longer than the visitor's radius, so a sprint
 * down a corridor cannot skip over a bulkhead between two frames, and each step
 * is pushed back out of any wall it ends up inside. Pushing out repeatedly is
 * what makes corners work: the first push frees one wall, the second the other.
 */
export function resolveMovement(
  from: Vec2,
  to: Vec2,
  walls: WallSegment[],
  radius = VISITOR_RADIUS,
): Vec2 {
  const delta = sub(to, from)
  const distance = len(delta)
  if (distance < EPSILON) return from

  const steps = Math.max(1, Math.ceil(distance / radius))
  let position = from

  for (let step = 0; step < steps; step++) {
    const target: Vec2 = [
      position[0] + (delta[0] / steps),
      position[1] + (delta[1] / steps),
    ]
    position = pushOutOfWalls(target, position, walls, radius)
  }

  return position
}

/**
 * @param point    where the visitor wants to stand
 * @param fallback the last position known to be clear, used to choose a side
 *                 when the visitor ends up exactly on a wall
 */
function pushOutOfWalls(point: Vec2, fallback: Vec2, walls: WallSegment[], radius: number): Vec2 {
  let position = point

  for (let pass = 0; pass < 4; pass++) {
    let corrected = false

    for (const wall of walls) {
      const closest = closestPointOnSegment(position, wall.start, wall.end)
      const away = sub(position, closest)
      const distance = len(away)
      if (distance >= radius) continue

      let normal: Vec2
      if (distance > EPSILON) {
        normal = [away[0] / distance, away[1] / distance]
      } else {
        // Dead on the wall: leave on the side the visitor came from.
        const back = sub(fallback, closest)
        const backLength = len(back)
        if (backLength <= EPSILON) continue
        normal = [back[0] / backLength, back[1] / backLength]
      }

      position = [closest[0] + normal[0] * radius, closest[1] + normal[1] * radius]
      corrected = true
    }

    if (!corrected) break
  }

  return position
}

/** Only the walls that can matter for a move, so the loop stays short. */
export function wallsNear(walls: WallSegment[], point: Vec2, reach: number): WallSegment[] {
  return walls.filter((wall) => {
    const minX = Math.min(wall.start[0], wall.end[0]) - reach
    const maxX = Math.max(wall.start[0], wall.end[0]) + reach
    const minZ = Math.min(wall.start[1], wall.end[1]) - reach
    const maxZ = Math.max(wall.start[1], wall.end[1]) + reach
    return point[0] >= minX && point[0] <= maxX && point[1] >= minZ && point[1] <= maxZ
  })
}

/**
 * The vertical link the visitor is standing on, if any, together with the space
 * it leads to from where they are.
 */
export function linkUnderfoot(
  links: Link[],
  spaceId: string | null,
  point: Vec2,
): { link: Link; to: string } | null {
  if (!spaceId) return null

  for (const link of links) {
    if (link.from !== spaceId && link.to !== spaceId) continue
    if (len(sub(point, link.at)) > LINK_REACH) continue
    return { link, to: link.from === spaceId ? link.to : link.from }
  }
  return null
}
