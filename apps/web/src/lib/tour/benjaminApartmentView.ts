import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { floorOf, type TierPlan } from './blueprint'
import { BenjaminRoomSurface } from './benjaminRoomDetailSurface'
import { dressBenjaminApartmentArchitecture } from './benjaminApartmentArchitecture'
import { dressBenjaminApartmentFurniture } from './benjaminApartmentFurniture'
import { dressBenjaminApartmentUtilities } from './benjaminApartmentUtilities'

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
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || plan.tier.id !== BENJAMIN_APARTMENT_TIER || spaceId === LIVING) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  dressBenjaminApartmentArchitecture({ into, plan, space })
  for (const structure of plan.structures.filter((item) => item.spaceId === spaceId)) {
    const surface = new BenjaminRoomSurface(into, structure, floorOf(space, plan.tier))
    dressBenjaminApartmentFurniture(surface)
    dressBenjaminApartmentUtilities(surface)
  }
  return into.finish(`benjamin-apartment-${spaceId.split('-').at(-1)}`)
}
