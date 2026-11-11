import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ApartmentSurface } from './apartmentDetailSurface'
import { buildApartmentReconstruction } from './apartmentReconstruction'
import { dressFugetsuArchitecture } from './fugetsuArchitecture'
import { dressFugetsuFurniture } from './fugetsuFurniture'
import type { Structure } from './types'

export const FUGETSU_PREFIX = 'tier-1-royal-residential-sector-room-1011'
export const FUGETSU_BEDROOM = `${FUGETSU_PREFIX}-bedroom`
export const FUGETSU_PRIVATE_SPACES = [
  'dining',
  'entrance',
  'living',
  'kitchen',
  'servants',
  'servants-wc',
  'bathroom',
].map((suffix) => `${FUGETSU_PREFIX}-${suffix}`)

export const hasFugetsuModel = (structure: Structure): boolean =>
  structure.spaceId === FUGETSU_BEDROOM || FUGETSU_PRIVATE_SPACES.includes(structure.spaceId)

/** Keep the original collision plan, hiding only the blocks replaced by detailed meshes. */
export function fugetsuSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || plan.tier.id !== 'interior-room-1011') return plan
  return { ...plan, structures: plan.structures.filter((item) => !hasFugetsuModel(item)) }
}

export function buildFugetsuDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null
  if (FUGETSU_PRIVATE_SPACES.includes(spaceId))
    return buildApartmentReconstruction({ ...options, name: `fugetsu-apartment-${spaceId}` })
  if (spaceId !== FUGETSU_BEDROOM) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  const context = { into, plan, space }
  dressFugetsuArchitecture(context)
  for (const structure of plan.structures.filter((item) => item.spaceId === spaceId)) {
    const surface = new ApartmentSurface(into, structure, floorOf(space, plan.tier))
    dressFugetsuFurniture(THREE, surface)
  }
  return into.finish('fugetsu-bedroom-details')
}
