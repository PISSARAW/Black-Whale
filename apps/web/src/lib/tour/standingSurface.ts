import { floorOf, spaceAt, type TierPlan } from './blueprint'
import { pointInPolygon, STEP_UP, structureFootprint } from './geometry'
import type { Doorway, Space, Vec2 } from './types'

/** A deliberate arrival on a resting platform stands on its top, never inside it.
 * Suspended galleries remain a separate level reached through their stairs. */
export function standingSurface(plan: TierPlan, at: Vec2, room?: Space): number {
  const space = room ?? spaceAt(plan, at) ?? plan.spaces[0]
  const floor = floorOf(space, plan.tier)
  const tops = plan.structures
    .filter(
      (structure) =>
        structure.spaceId === space.id &&
        structure.kind === 'platform' &&
        structure.base === 0 &&
        pointInPolygon(at, structureFootprint(structure)),
    )
    .map(({ height }) => floor + height)
  return Math.max(floor, ...tops)
}

/** A raised landing can meet a stair tread at the doorway above the hall floor. */
export function doorwaySurfaceRise(plan: TierPlan, doorway: Doorway): number {
  const a = plan.spaces.find(({ id }) => id === doorway.a)!
  const b = plan.spaces.find(({ id }) => id === doorway.b)!
  const rise = Math.abs(floorOf(a, plan.tier) - floorOf(b, plan.tier))
  if (rise <= STEP_UP) return rise

  const [x0, z0] = doorway.start
  const [x1, z1] = doorway.end
  const length = Math.hypot(x1 - x0, z1 - z0)
  const mx = (x0 + x1) / 2
  const mz = (z0 + z1) / 2
  const dx = ((z1 - z0) / length) * 0.06
  const dz = ((x0 - x1) / length) * 0.06
  const left: Vec2 = [mx + dx, mz + dz]
  const right: Vec2 = [mx - dx, mz - dz]
  const [near, far] = pointInPolygon(left, a.footprint) ? [left, right] : [right, left]

  return Math.abs(standingSurface(plan, near, a) - standingSurface(plan, far, b))
}
