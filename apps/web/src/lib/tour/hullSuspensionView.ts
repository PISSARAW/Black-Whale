import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { floorOf, type TierPlan } from './blueprint'
import { dressHullSuspension } from './hullSuspensionArchitecture'
import type { Structure } from './types'

export const HULL_SUSPENSION_SPACE = 'tier-5-hull-suspension-bay'

export function hasHullSuspensionModel(structure: Structure): boolean {
  return structure.spaceId === HULL_SUSPENSION_SPACE && structure.kind === 'spring'
}

/** Removes the six coarse prisms while keeping their collision outlines in the walked plan. */
export function hullSuspensionSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => id === HULL_SUSPENSION_SPACE)) return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !hasHullSuspensionModel(structure)),
  }
}

/** Reconstructs the ribbed drums, exposed coils, piston rods and service gangway of ch. 406. */
export function buildHullSuspensionDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || spaceId !== HULL_SUSPENSION_SPACE) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null
  const structures = plan.structures.filter(hasHullSuspensionModel)
  if (!structures.length) return null

  const into = new BanquetDetailBuilder(THREE)
  dressHullSuspension({ into, structures, floor: floorOf(space, plan.tier) })
  return into.finish('hull-suspension-manga-details')
}
