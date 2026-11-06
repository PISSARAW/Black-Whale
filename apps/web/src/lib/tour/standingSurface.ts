import { floorOf, spaceAt, type TierPlan } from './blueprint'
import { pointInPolygon, structureFootprint } from './geometry'
import type { Space, Vec2 } from './types'

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
