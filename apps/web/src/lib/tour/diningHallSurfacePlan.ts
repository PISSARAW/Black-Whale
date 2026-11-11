import type { TierPlan } from './blueprint'
import type { Structure } from './types'

const HALL = 'tier-5-central-dining-hall'
const CUSTOM = new Set(['service-counter', 'menu-board', 'dispensers'].map((id) => `${HALL}-${id}`))

/** Rotated Hatsu solids retain their generic, correctly oriented representation. */
export function hasDiningHallModel(structure: Structure): boolean {
  if (structure.spaceId !== HALL || structure.rotation % 360 !== 0) return false
  return structure.kind === 'table' || structure.kind === 'seat' || CUSTOM.has(structure.id)
}

/** Drawing only: collision, provenance, doorways and the shared ship plan stay intact. */
export function diningHallSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => id === HALL)) return plan
  return { ...plan, structures: plan.structures.filter((solid) => !hasDiningHallModel(solid)) }
}
