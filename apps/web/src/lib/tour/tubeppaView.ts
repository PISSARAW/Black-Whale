import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ApartmentSurface } from './apartmentDetailSurface'
import { buildApartmentReconstruction } from './apartmentReconstruction'
import { dressApartmentFurniture } from './apartmentFurniture'
import { dressTubeppaArchitecture } from './tubeppaArchitecture'
import { dressTubeppaWorkstation } from './tubeppaWorkstation'
import { dressTubeppaBoard } from './tubeppaBoards'
import type { Structure } from './types'

export const TUBEPPA_PREFIX = 'tier-1-royal-residential-sector-room-1005'
export const TUBEPPA_LIVING = `${TUBEPPA_PREFIX}-living`
export const TUBEPPA_PRIVATE_SPACES = [
  'dining',
  'entrance',
  'bedroom',
  'kitchen',
  'servants',
  'servants-wc',
  'bathroom',
].map((suffix) => `${TUBEPPA_PREFIX}-${suffix}`)

export const hasTubeppaModel = (structure: Structure): boolean =>
  structure.spaceId === TUBEPPA_LIVING || TUBEPPA_PRIVATE_SPACES.includes(structure.spaceId)

/** Keep the original collision plan, hiding only the blocks replaced by detailed meshes. */
export function tubeppaSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || plan.tier.id !== 'interior-room-1005') return plan
  return { ...plan, structures: plan.structures.filter((item) => !hasTubeppaModel(item)) }
}

export function buildTubeppaDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null
  if (TUBEPPA_PRIVATE_SPACES.includes(spaceId))
    return buildApartmentReconstruction({ ...options, name: `tubeppa-apartment-${spaceId}` })
  if (spaceId !== TUBEPPA_LIVING) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  dressTubeppaArchitecture({ into, plan, space })
  for (const structure of plan.structures.filter((item) => item.spaceId === spaceId)) {
    const surface = new ApartmentSurface(into, structure, floorOf(space, plan.tier))
    if (structure.kind === 'painting') dressTubeppaBoard(surface)
    else if (structure.id.endsWith('-desk') || structure.id.endsWith('-desk-chair'))
      dressTubeppaWorkstation(surface)
    else dressApartmentFurniture(surface)
  }
  return into.finish('tubeppa-workstation-details')
}
