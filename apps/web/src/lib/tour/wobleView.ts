import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ApartmentSurface } from './apartmentDetailSurface'
import { buildApartmentReconstruction } from './apartmentReconstruction'
import { dressWobleArchitecture } from './wobleArchitecture'
import { dressWobleFurniture } from './wobleFurniture'
import type { Structure } from './types'

export const WOBLE_PREFIX = 'tier-1-royal-residential-sector-room-1014'
export const WOBLE_BEDROOM = `${WOBLE_PREFIX}-bedroom`
export const WOBLE_LIVING = `${WOBLE_PREFIX}-living`
export const WOBLE_DINING = `${WOBLE_PREFIX}-dining`
export const WOBLE_KITCHEN = `${WOBLE_PREFIX}-kitchen`
export const WOBLE_BATHROOM = `${WOBLE_PREFIX}-bathroom`
export const WOBLE_PANEL_SPACES = [
  WOBLE_LIVING,
  WOBLE_DINING,
  WOBLE_KITCHEN,
  WOBLE_BEDROOM,
  WOBLE_BATHROOM,
]
export const WOBLE_PRIVATE_SPACES = ['entrance', 'servants', 'servants-wc'].map(
  (suffix) => `${WOBLE_PREFIX}-${suffix}`,
)

export const hasWobleModel = (structure: Structure): boolean =>
  [...WOBLE_PANEL_SPACES, ...WOBLE_PRIVATE_SPACES].includes(structure.spaceId)

/** Keep the original collision plan, hiding only the blocks replaced by detailed meshes. */
export function wobleSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || plan.tier.id !== 'interior-room-1014') return plan
  return { ...plan, structures: plan.structures.filter((item) => !hasWobleModel(item)) }
}

export function buildWobleDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null
  if (WOBLE_PRIVATE_SPACES.includes(spaceId))
    return buildApartmentReconstruction({ ...options, name: `woble-apartment-${spaceId}` })
  if (!WOBLE_PANEL_SPACES.includes(spaceId)) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  const context = { into, plan, space }
  dressWobleArchitecture(context)
  for (const structure of plan.structures.filter((item) => item.spaceId === spaceId)) {
    const surface = new ApartmentSurface(into, structure, floorOf(space, plan.tier))
    dressWobleFurniture(THREE, surface)
  }
  return into.finish('woble-apartment-details')
}
