import { floorOf, type Ship } from './blueprint'
import type { Link, Structure, Vec2 } from './types'

export interface JumpArrival {
  at?: Vec2
  facing?: number
  looking?: number
  eyeHeight?: number
  cameraDistance?: number
  visibleSpaceIds?: readonly string[]
  surfaceHeight?: number
}

interface StairEnd {
  spaceId: string
  at: Vec2
  to: string
  arrival: JumpArrival
  height?: number
  direction?: Vec2
}

const distance = (a: Vec2, b: Vec2) => Math.hypot(a[0] - b[0], a[1] - b[1])

function landingDirection(from: Vec2, to: Vec2): Vec2 {
  const dx = to[0] - from[0],
    dz = to[1] - from[1]
  return Math.abs(dx) >= Math.abs(dz) ? [Math.sign(dx), 0] : [0, Math.sign(dz)]
}

function topTread(ship: Ship, link: Link): Structure | undefined {
  const steps = ship.structures.filter(
    ({ spaceId, kind, id }) =>
      spaceId === link.from && kind === 'platform' && /-stair-|-steps/.test(id),
  )
  const first = [...steps].sort((a, b) => distance(a.at, link.at) - distance(b.at, link.at))[0]
  if (!first || distance(first.at, link.at) > 2) return undefined
  const prefix = first.id.replace(/-\d+$/, '')
  return steps
    .filter(({ id }) => id.replace(/-\d+$/, '') === prefix)
    .sort((a, b) => b.height - a.height)[0]
}

function endsOf(ship: Ship, link: Link): StairEnd[] {
  const top = topTread(ship, link)
  const target = link.atTo ?? link.at
  const sourceRoom = ship.spaces.get(link.from)!
  const sourcePlan = ship.plans.get(sourceRoom.tierId)!
  const topHeight = top ? floorOf(sourceRoom, sourcePlan.tier) + top.base + top.height : undefined
  return [
    {
      spaceId: link.from,
      at: top ? target : link.at,
      to: link.to,
      arrival: { at: target },
      height: topHeight,
      direction: top ? landingDirection(top.at, target) : undefined,
    },
    {
      spaceId: link.to,
      at: target,
      to: link.from,
      arrival: { at: top?.at ?? link.at, surfaceHeight: topHeight },
      height: topHeight,
      direction: top ? landingDirection(target, top.at) : undefined,
    },
  ]
}

function entersLanding(end: StairEnd, movement: { from: Vec2; at: Vec2 }): boolean {
  if (distance(movement.at, end.at) > 0.8) return false
  if (!end.direction) return distance(movement.from, end.at) > 0.8
  return (
    (movement.at[0] - movement.from[0]) * end.direction[0] +
      (movement.at[1] - movement.from[1]) * end.direction[1] >
    0.000001
  )
}

/** Crossing an actual stair landing changes levels; spawning on it never bounces back. */
export class StairNavigator {
  readonly ends: readonly StairEnd[]

  constructor(ship: Ship) {
    this.ends = ship.links
      .filter(({ kind, retractable }) => kind === 'stair' && !retractable)
      .flatMap((link) => endsOf(ship, link))
  }

  cross(request: {
    spaceId: string | null
    from: Vec2
    at: Vec2
    height: number
    enabled: boolean
  }): { spaceId: string; arrival: JumpArrival } | null {
    if (!request.enabled) return null
    const end = this.ends.find(
      (candidate) =>
        candidate.spaceId === request.spaceId &&
        entersLanding(candidate, request) &&
        (candidate.height === undefined || Math.abs(candidate.height - request.height) < 0.27),
    )
    return end ? { spaceId: end.to, arrival: end.arrival } : null
  }
}
