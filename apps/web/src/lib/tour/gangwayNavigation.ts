import { floorOf, type Ship } from './blueprint'
import type { Link, Vec2 } from './types'

export const GANGWAY_WIDTH = 3.6
const SHOULDER_CLEARANCE = GANGWAY_WIDTH / 2 - 0.4

export interface GangwayPath {
  link: Link
  fromTier: string
  toTier: string
  from: Vec2
  to: Vec2
  fromY: number
  toY: number
  run: number
  length: number
}

export interface GangwayWalk {
  path: GangwayPath
  reverse: boolean
  progress: number
  auto: boolean
}

export function gangwayPaths(ship: Ship): GangwayPath[] {
  return ship.links
    .filter((link) => link.retractable)
    .flatMap((link) => {
      const from = ship.spaces.get(link.from)
      const to = ship.spaces.get(link.to)
      const fromTier = ship.tiers.find((tier) => tier.id === from?.tierId)
      const toTier = ship.tiers.find((tier) => tier.id === to?.tierId)
      if (!from || !to || !fromTier || !toTier) return []
      const end = link.atTo ?? link.at
      const run = Math.hypot(end[0] - link.at[0], end[1] - link.at[1])
      const fromY = floorOf(from, fromTier)
      const toY = floorOf(to, toTier)
      return [
        {
          link,
          fromTier: from.tierId,
          toTier: to.tierId,
          from: link.at,
          to: end,
          fromY,
          toY,
          run,
          length: Math.hypot(run, toY - fromY),
        },
      ]
    })
}

export function gangwayDirection(walk: GangwayWalk): Vec2 {
  const sign = walk.reverse ? -1 : 1
  return [
    ((walk.path.to[0] - walk.path.from[0]) / walk.path.run) * sign,
    ((walk.path.to[1] - walk.path.from[1]) / walk.path.run) * sign,
  ]
}

/** Enter only at a boarding point, while moving along an extended bridge. */
export function enterGangway(
  paths: GangwayPath[],
  request: {
    tierId: string
    at: Vec2
    movement: Vec2
    open: boolean
  },
): GangwayWalk | null {
  if (!request.open) return null
  for (const path of paths) {
    const reverse = path.toTier === request.tierId
    if (path.fromTier !== request.tierId && !reverse) continue
    const start = reverse ? path.to : path.from
    if (Math.hypot(request.at[0] - start[0], request.at[1] - start[1]) > 2.4) continue
    const walk = { path, reverse, progress: 0, auto: false }
    const direction = gangwayDirection(walk)
    if (direction[0] * request.movement[0] + direction[1] * request.movement[1] > 0.001) return walk
  }
  return null
}

/** Continuous surface movement, with physical rail clearance and slope speed. */
export function stepGangway(walk: GangwayWalk, at: Vec2, movement: Vec2) {
  const { path, reverse } = walk
  const direction = gangwayDirection(walk)
  const start = reverse ? path.to : path.from
  const along = (at[0] - start[0]) * direction[0] + (at[1] - start[1]) * direction[1]
  const advance =
    ((movement[0] * direction[0] + movement[1] * direction[1]) * path.run) / path.length
  const distance = along + advance
  const progress = Math.max(0, Math.min(1, distance / path.run))
  const side = Math.max(
    -SHOULDER_CLEARANCE,
    Math.min(
      SHOULDER_CLEARANCE,
      -(at[0] + movement[0] - start[0]) * direction[1] +
        (at[1] + movement[1] - start[1]) * direction[0],
    ),
  )
  const position: Vec2 = [
    start[0] + direction[0] * progress * path.run - direction[1] * side,
    start[1] + direction[1] * progress * path.run + direction[0] * side,
  ]
  const fromY = reverse ? path.toY : path.fromY
  const toY = reverse ? path.fromY : path.toY
  return {
    at: position,
    progress,
    floor: fromY + (toY - fromY) * progress,
    arrived: distance >= path.run,
    returned: distance < -0.1,
    destination: reverse ? path.link.from : path.link.to,
    destinationAt: reverse ? path.from : path.to,
  }
}

export function gangwayFloor(walk: GangwayWalk): number {
  const from = walk.reverse ? walk.path.toY : walk.path.fromY
  const to = walk.reverse ? walk.path.fromY : walk.path.toY
  return from + (to - from) * walk.progress
}
