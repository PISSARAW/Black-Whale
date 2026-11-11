import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ApartmentSurface } from './apartmentDetailSurface'
import { buildApartmentReconstruction } from './apartmentReconstruction'
import { dressSalesaleArchitecture } from './salesaleArchitecture'
import { dressSalesaleFurniture } from './salesaleFurniture'
import type { Structure } from './types'

export const SALESALE_PREFIX = 'tier-1-royal-residential-sector-room-1008'
export const SALESALE_BEDROOM = `${SALESALE_PREFIX}-bedroom`
export const SALESALE_PRIVATE_SPACES = [
  'dining',
  'entrance',
  'living',
  'kitchen',
  'servants',
  'servants-wc',
  'bathroom',
].map((suffix) => `${SALESALE_PREFIX}-${suffix}`)

export const hasSalesaleModel = (structure: Structure): boolean =>
  structure.spaceId === SALESALE_BEDROOM || SALESALE_PRIVATE_SPACES.includes(structure.spaceId)

/** Keep the original collision plan, hiding only the blocks replaced by detailed meshes. */
export function salesaleSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || plan.tier.id !== 'interior-room-1008') return plan
  return { ...plan, structures: plan.structures.filter((item) => !hasSalesaleModel(item)) }
}

export function buildSalesaleDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null
  if (SALESALE_PRIVATE_SPACES.includes(spaceId))
    return buildApartmentReconstruction({ ...options, name: `salesale-apartment-${spaceId}` })
  if (spaceId !== SALESALE_BEDROOM) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  const context = { into, plan, space }
  dressSalesaleArchitecture(context)
  for (const structure of plan.structures.filter((item) => item.spaceId === spaceId)) {
    const surface = new ApartmentSurface(into, structure, floorOf(space, plan.tier))
    dressSalesaleFurniture(THREE, surface)
  }
  return into.finish('salesale-bedroom-details')
}
