import { floorOf, type Ship } from './blueprint'
import {
  isCasinoSpiralLink,
  SPIRAL_CENTRE,
  SPIRAL_GATE_WIDTH,
  SPIRAL_RADIUS,
  SPIRAL_RUN,
  SPIRAL_SWEEP,
} from './casinoSpiralLayout'
import { standingSurface } from './standingSurface'
import type { Vec2 } from './types'

const CLEARANCE = SPIRAL_GATE_WIDTH / 2 - 0.4
const APPROACH = 0.44
const CURVED_RUN = SPIRAL_SWEEP * SPIRAL_RADIUS
const CURVE_END = SPIRAL_RUN + CURVED_RUN
const LENGTH = CURVE_END + SPIRAL_RUN

export interface SpiralLanding {
  spaceId: string
  tierId: string
  at: Vec2
  floor: number
}

export interface SpiralPath {
  upper: SpiralLanding
  lower: SpiralLanding
  steps: number
}

export function casinoSpiralPath(ship: Ship): SpiralPath | null {
  const link = ship.links.find(isCasinoSpiralLink)
  if (!link?.atTo) return null
  const top = ship.spaces.get(link.from)!
  const bottom = ship.spaces.get(link.to)!
  const topPlan = ship.plans.get(top.tierId)!
  const bottomPlan = ship.plans.get(bottom.tierId)!
  const upper = {
    spaceId: top.id,
    tierId: top.tierId,
    at: link.at,
    floor: floorOf(top, topPlan.tier),
  }
  const lower = {
    spaceId: bottom.id,
    tierId: bottom.tierId,
    at: link.atTo,
    floor: standingSurface(bottomPlan, [link.atTo[0] - 0.06, link.atTo[1]], bottom),
  }
  return { upper, lower, steps: Math.ceil((upper.floor - lower.floor) / 0.19) }
}

export function spiralAngle(fraction: number): number {
  return Math.PI / 2 - fraction * SPIRAL_SWEEP
}

export function spiralPoint(angle: number, radius: number): Vec2 {
  return [SPIRAL_CENTRE[0] + radius * Math.cos(angle), SPIRAL_CENTRE[1] + radius * Math.sin(angle)]
}

export function spiralTreadFloor(path: SpiralPath, step: number): number {
  return path.upper.floor - ((path.upper.floor - path.lower.floor) * step) / path.steps
}

function landingAt(path: SpiralPath, spaceId: string | null): SpiralLanding | null {
  if (spaceId === path.upper.spaceId) return path.upper
  return spaceId === path.lower.spaceId ? path.lower : null
}

function sample(path: SpiralPath, distance: number, side: number) {
  if (distance <= SPIRAL_RUN) {
    return {
      at: [path.upper.at[0] + distance, path.upper.at[1] + side] as Vec2,
      floor: path.upper.floor,
      yaw: -Math.PI / 2,
    }
  }
  if (distance >= CURVE_END) {
    return {
      at: [path.lower.at[0] + LENGTH - distance, path.lower.at[1] - side] as Vec2,
      floor: path.lower.floor,
      yaw: -Math.PI / 2 + SPIRAL_SWEEP,
    }
  }
  const fraction = (distance - SPIRAL_RUN) / CURVED_RUN
  return {
    at: spiralPoint(spiralAngle(fraction), SPIRAL_RADIUS + side),
    floor: spiralTreadFloor(path, Math.min(path.steps, Math.floor(fraction * path.steps) + 1)),
    yaw: -Math.PI / 2 + fraction * SPIRAL_SWEEP,
  }
}

export class CasinoSpiralWalk {
  readonly path: SpiralPath | null
  private distance = 0
  private side = 0
  origin: SpiralLanding | null = null

  constructor(ship: Ship) {
    this.path = casinoSpiralPath(ship)
  }

  get floor(): number | undefined {
    if (this.origin && this.path) return sample(this.path, this.distance, this.side).floor
    return undefined
  }

  reset(): void {
    this.origin = null
  }

  partner(spaceId: string | null): SpiralLanding | null {
    if (spaceId === this.path?.upper.spaceId) return this.path.lower
    if (spaceId === this.path?.lower.spaceId) return this.path.upper
    return null
  }

  enter(spaceId: string | null, from: Vec2, to: Vec2): boolean {
    const path = this.path
    if (!path) return false
    const end = landingAt(path, spaceId)
    if (!end || to[0] <= from[0]) return false
    const threshold = end.at[0] - APPROACH
    if (from[0] > end.at[0] || to[0] < threshold) return false
    const crossing = Math.max(0, (threshold - from[0]) / (to[0] - from[0]))
    const lateral = from[1] + (to[1] - from[1]) * crossing - end.at[1]
    if (Math.abs(lateral) > CLEARANCE) return false
    this.origin = end
    const upper = end === path.upper
    const before = end.at[0] - from[0]
    this.distance = upper ? -before : LENGTH + before
    this.side = (from[1] - end.at[1]) * (upper ? 1 : -1)
    return true
  }

  advance(movement: Vec2) {
    const path = this.path
    if (!path || !this.origin) return null
    const before = sample(path, this.distance, this.side)
    const forward: Vec2 = [-Math.sin(before.yaw), -Math.cos(before.yaw)]
    const along = movement[0] * forward[0] + movement[1] * forward[1]
    const sideways = movement[1] * forward[0] - movement[0] * forward[1]
    this.side = Math.max(-CLEARANCE, Math.min(CLEARANCE, this.side + sideways))
    const next = this.distance + along
    const landing = next <= -APPROACH ? path.upper : next >= LENGTH + APPROACH ? path.lower : null
    this.distance = Math.max(-APPROACH, Math.min(LENGTH + APPROACH, next))
    const after = sample(path, this.distance, this.side)
    return {
      at: after.at,
      turn: after.yaw - before.yaw,
      landing,
    }
  }
}
