import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ApartmentSurface } from './apartmentDetailSurface'
import { buildApartmentReconstruction } from './apartmentReconstruction'
import { dressPrincelyWallPanels } from './princelyWallPanels'
import { dressPrincelyRoomGrid } from './princelyRoomGrid'
import { dressTysonCheckerRug } from './tysonRug'
import { dressTysonFurniture } from './tysonFurniture'
import type { Structure } from './types'

export const TYSON_PREFIX = 'tier-1-royal-residential-sector-room-1006'
export const TYSON_LIVING = `${TYSON_PREFIX}-living`
export const TYSON_PRIVATE_SPACES = [
  'dining',
  'entrance',
  'bedroom',
  'kitchen',
  'servants',
  'servants-wc',
  'bathroom',
].map((suffix) => `${TYSON_PREFIX}-${suffix}`)

export const hasTysonModel = (structure: Structure): boolean =>
  structure.spaceId === TYSON_LIVING || TYSON_PRIVATE_SPACES.includes(structure.spaceId)

/** Keep the original collision plan, hiding only the blocks replaced by detailed meshes. */
export function tysonSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || plan.tier.id !== 'interior-room-1006') return plan
  return { ...plan, structures: plan.structures.filter((item) => !hasTysonModel(item)) }
}

export function buildTysonDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null
  if (TYSON_PRIVATE_SPACES.includes(spaceId))
    return buildApartmentReconstruction({ ...options, name: `tyson-apartment-${spaceId}` })
  if (spaceId !== TYSON_LIVING) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  const context = { into, plan, space }
  dressPrincelyWallPanels(context)
  dressPrincelyRoomGrid(context, false)
  dressPrincelyRoomGrid(context, true)
  dressTysonCheckerRug(into, floorOf(space, plan.tier))
  for (const structure of plan.structures.filter((item) => item.spaceId === spaceId)) {
    const surface = new ApartmentSurface(into, structure, floorOf(space, plan.tier))
    dressTysonFurniture(surface)
  }
  return into.finish('tyson-salon-details')
}
