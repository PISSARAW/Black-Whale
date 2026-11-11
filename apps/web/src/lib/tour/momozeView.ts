import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ApartmentSurface } from './apartmentDetailSurface'
import { buildApartmentReconstruction } from './apartmentReconstruction'
import { dressMomozeArchitecture } from './momozeArchitecture'
import { dressMomozeFurniture } from './momozeFurniture'
import type { Structure } from './types'

export const MOMOZE_PREFIX = 'tier-1-royal-residential-sector-room-1012'
export const MOMOZE_BEDROOM = `${MOMOZE_PREFIX}-bedroom`
export const MOMOZE_LIVING = `${MOMOZE_PREFIX}-living`
export const MOMOZE_PRIVATE_SPACES = [
  'dining',
  'entrance',
  'kitchen',
  'servants',
  'servants-wc',
  'bathroom',
].map((suffix) => `${MOMOZE_PREFIX}-${suffix}`)

export const hasMomozeModel = (structure: Structure): boolean =>
  [MOMOZE_BEDROOM, MOMOZE_LIVING, ...MOMOZE_PRIVATE_SPACES].includes(structure.spaceId)

/** Keep the original collision plan, hiding only the blocks replaced by detailed meshes. */
export function momozeSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || plan.tier.id !== 'interior-room-1012') return plan
  return { ...plan, structures: plan.structures.filter((item) => !hasMomozeModel(item)) }
}

export function buildMomozeDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null
  if (MOMOZE_PRIVATE_SPACES.includes(spaceId))
    return buildApartmentReconstruction({ ...options, name: `momoze-apartment-${spaceId}` })
  if (![MOMOZE_BEDROOM, MOMOZE_LIVING].includes(spaceId)) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  const context = { into, plan, space }
  dressMomozeArchitecture(context)
  for (const structure of plan.structures.filter((item) => item.spaceId === spaceId)) {
    const surface = new ApartmentSurface(into, structure, floorOf(space, plan.tier))
    dressMomozeFurniture(THREE, surface)
  }
  return into.finish('momoze-apartment-details')
}
