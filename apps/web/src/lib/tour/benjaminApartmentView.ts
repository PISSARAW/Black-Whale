import type * as Three from 'three'
import type { TierPlan } from './blueprint'
import { buildApartmentReconstruction } from './apartmentReconstruction'

export const BENJAMIN_APARTMENT_TIER = 'interior-room-1001'
const LIVING = 'tier-1-royal-residential-sector-room-1001-living'

export function benjaminApartmentSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || plan.tier.id !== BENJAMIN_APARTMENT_TIER) return plan
  return { ...plan, structures: plan.structures.filter(({ spaceId }) => spaceId === LIVING) }
}

/** The other seven rooms are explicitly programme-type reconstructions, not panel reproductions. */
export function buildBenjaminApartmentDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { plan, spaceId, reveal } = options
  if (reveal || plan.tier.id !== BENJAMIN_APARTMENT_TIER || spaceId === LIVING) return null
  return buildApartmentReconstruction({
    ...options,
    name: `benjamin-apartment-${spaceId.split('-').at(-1)}`,
  })
}
