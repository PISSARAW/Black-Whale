import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ApartmentSurface } from './apartmentDetailSurface'
import { buildApartmentReconstruction } from './apartmentReconstruction'
import { dressKachoArchitecture } from './kachoArchitecture'
import { dressKachoFurniture } from './kachoFurniture'
import type { Structure } from './types'

export const KACHO_PREFIX = 'tier-1-royal-residential-sector-room-1010'
export const KACHO_LIVING = `${KACHO_PREFIX}-living`
export const KACHO_KITCHEN = `${KACHO_PREFIX}-kitchen`
export const KACHO_DINING = `${KACHO_PREFIX}-dining`
export const KACHO_PRIVATE_SPACES = [
  'bedroom',
  'entrance',
  'servants',
  'servants-wc',
  'bathroom',
].map((suffix) => `${KACHO_PREFIX}-${suffix}`)

export const hasKachoModel = (structure: Structure): boolean =>
  structure.spaceId === KACHO_LIVING ||
  structure.spaceId === KACHO_KITCHEN ||
  structure.spaceId === KACHO_DINING ||
  KACHO_PRIVATE_SPACES.includes(structure.spaceId)

/** Keep the original collision plan, hiding only the blocks replaced by detailed meshes. */
export function kachoSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || plan.tier.id !== 'interior-room-1010') return plan
  return { ...plan, structures: plan.structures.filter((item) => !hasKachoModel(item)) }
}

export function buildKachoDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null
  if (KACHO_PRIVATE_SPACES.includes(spaceId))
    return buildApartmentReconstruction({ ...options, name: `kacho-apartment-${spaceId}` })
  if (![KACHO_LIVING, KACHO_KITCHEN, KACHO_DINING].includes(spaceId)) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  const context = { into, plan, space }
  dressKachoArchitecture(context)
  for (const structure of plan.structures.filter((item) => item.spaceId === spaceId)) {
    const surface = new ApartmentSurface(into, structure, floorOf(space, plan.tier))
    dressKachoFurniture(surface)
  }
  return into.finish('kacho-salon-details')
}
