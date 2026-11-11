import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ApartmentSurface } from './apartmentDetailSurface'
import { buildApartmentReconstruction } from './apartmentReconstruction'
import { dressMarayamArchitecture } from './marayamArchitecture'
import { dressMarayamFurniture } from './marayamFurniture'
import type { Structure } from './types'

export const MARAYAM_PREFIX = 'tier-1-royal-residential-sector-room-1013'
export const MARAYAM_BEDROOM = `${MARAYAM_PREFIX}-bedroom`
export const MARAYAM_LIVING = `${MARAYAM_PREFIX}-living`
export const MARAYAM_DINING = `${MARAYAM_PREFIX}-dining`
export const MARAYAM_STAFF = `${MARAYAM_PREFIX}-servants`
export const MARAYAM_PANEL_SPACES = [MARAYAM_LIVING, MARAYAM_DINING, MARAYAM_STAFF, MARAYAM_BEDROOM]
export const MARAYAM_PRIVATE_SPACES = ['entrance', 'kitchen', 'servants-wc', 'bathroom'].map(
  (suffix) => `${MARAYAM_PREFIX}-${suffix}`,
)

export const hasMarayamModel = (structure: Structure): boolean =>
  [...MARAYAM_PANEL_SPACES, ...MARAYAM_PRIVATE_SPACES].includes(structure.spaceId)

/** Keep the original collision plan, hiding only the blocks replaced by detailed meshes. */
export function marayamSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || plan.tier.id !== 'interior-room-1013') return plan
  return { ...plan, structures: plan.structures.filter((item) => !hasMarayamModel(item)) }
}

export function buildMarayamDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null
  if (MARAYAM_PRIVATE_SPACES.includes(spaceId))
    return buildApartmentReconstruction({ ...options, name: `marayam-apartment-${spaceId}` })
  if (!MARAYAM_PANEL_SPACES.includes(spaceId)) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  const context = { into, plan, space }
  dressMarayamArchitecture(context)
  for (const structure of plan.structures.filter((item) => item.spaceId === spaceId)) {
    const surface = new ApartmentSurface(into, structure, floorOf(space, plan.tier))
    dressMarayamFurniture(THREE, surface)
  }
  return into.finish('marayam-apartment-details')
}
