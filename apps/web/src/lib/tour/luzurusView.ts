import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ApartmentSurface } from './apartmentDetailSurface'
import { buildApartmentReconstruction } from './apartmentReconstruction'
import { dressLuzurusArchitecture } from './luzurusArchitecture'
import { dressLuzurusFurniture } from './luzurusFurniture'
import type { Structure } from './types'

export const LUZURUS_PREFIX = 'tier-1-royal-residential-sector-room-1007'
export const LUZURUS_LIVING = `${LUZURUS_PREFIX}-living`
export const LUZURUS_PRIVATE_SPACES = [
  'dining',
  'entrance',
  'bedroom',
  'kitchen',
  'servants',
  'servants-wc',
  'bathroom',
].map((suffix) => `${LUZURUS_PREFIX}-${suffix}`)

export const hasLuzurusModel = (structure: Structure): boolean =>
  structure.spaceId === LUZURUS_LIVING || LUZURUS_PRIVATE_SPACES.includes(structure.spaceId)

/** Keep the original collision plan, hiding only the blocks replaced by detailed meshes. */
export function luzurusSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || plan.tier.id !== 'interior-room-1007') return plan
  return { ...plan, structures: plan.structures.filter((item) => !hasLuzurusModel(item)) }
}

export function buildLuzurusDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null
  if (LUZURUS_PRIVATE_SPACES.includes(spaceId))
    return buildApartmentReconstruction({ ...options, name: `luzurus-apartment-${spaceId}` })
  if (spaceId !== LUZURUS_LIVING) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  const context = { into, plan, space }
  dressLuzurusArchitecture(context)
  for (const structure of plan.structures.filter((item) => item.spaceId === spaceId)) {
    const surface = new ApartmentSurface(into, structure, floorOf(space, plan.tier))
    dressLuzurusFurniture(surface)
  }
  return into.finish('luzurus-salon-details')
}
