import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ApartmentSurface } from './apartmentDetailSurface'
import { buildApartmentReconstruction } from './apartmentReconstruction'
import { dressHalkenburgArchitecture } from './halkenburgArchitecture'
import { dressHalkenburgFurniture } from './halkenburgFurniture'
import type { Structure } from './types'

export const HALKENBURG_PREFIX = 'tier-1-royal-residential-sector-room-1009'
export const HALKENBURG_LIVING = `${HALKENBURG_PREFIX}-living`
export const HALKENBURG_BEDROOM = `${HALKENBURG_PREFIX}-bedroom`
export const HALKENBURG_PRIVATE_SPACES = [
  'dining',
  'entrance',
  'kitchen',
  'servants',
  'servants-wc',
  'bathroom',
].map((suffix) => `${HALKENBURG_PREFIX}-${suffix}`)

export const hasHalkenburgModel = (structure: Structure): boolean =>
  structure.spaceId === HALKENBURG_LIVING ||
  structure.spaceId === HALKENBURG_BEDROOM ||
  HALKENBURG_PRIVATE_SPACES.includes(structure.spaceId)

/** Keep the original collision plan, hiding only the blocks replaced by detailed meshes. */
export function halkenburgSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || plan.tier.id !== 'interior-room-1009') return plan
  return { ...plan, structures: plan.structures.filter((item) => !hasHalkenburgModel(item)) }
}

export function buildHalkenburgDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null
  if (HALKENBURG_PRIVATE_SPACES.includes(spaceId))
    return buildApartmentReconstruction({ ...options, name: `halkenburg-apartment-${spaceId}` })
  if (![HALKENBURG_LIVING, HALKENBURG_BEDROOM].includes(spaceId)) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  const context = { into, plan, space }
  dressHalkenburgArchitecture(context)
  for (const structure of plan.structures.filter((item) => item.spaceId === spaceId)) {
    const surface = new ApartmentSurface(into, structure, floorOf(space, plan.tier))
    dressHalkenburgFurniture(THREE, surface)
  }
  return into.finish('halkenburg-salon-details')
}
