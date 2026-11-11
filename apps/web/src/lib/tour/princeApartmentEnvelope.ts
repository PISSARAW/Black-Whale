import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { floorOf, type TierPlan } from './blueprint'
import { dressApartmentArchitecture } from './apartmentArchitecture'
import { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentFurniture } from './apartmentFurniture'
import { dressApartmentUtilities } from './apartmentUtilities'
import { isPrinceApartmentSpace } from './princeApartmentAppearance'
import type { Structure } from './types'

const COMMON_SUFFIX = new RegExp(
  '-(bedroom-bed-01|bedroom-cabinet-02|bedroom-cabinet-03|living-cabinet-06|' +
    'living-seat-04|living-table-05|dining-table-07|kitchen-counter-08|' +
    'kitchen-counter-09|servants-bed-10|servants-bed-11|servants-cabinet-12|' +
    'servants-wc-pan|bathroom-basin-13|bathroom-basin-14|bathroom-wc-pan)$',
)

const COMMON_APARTMENT_TIER = /^interior-room-10(0[5-9]|1[0-4])$/

export const isCommonApartmentFixture = (structure: Structure): boolean =>
  COMMON_SUFFIX.test(structure.id)

/** Hide only programme-type blocks; named manga props remain in the source mesh. */
export function princeApartmentSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !COMMON_APARTMENT_TIER.test(plan.tier.id)) return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !isCommonApartmentFixture(structure)),
  }
}

/** Architectural fallback for every princely room not handled by a panel-specific model. */
export function buildPrinceApartmentEnvelope(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  if (options.reveal) return null
  const space = options.plan.spaces.find(({ id }) => id === options.spaceId)
  if (!space || !isPrinceApartmentSpace(space)) return null

  const into = new BanquetDetailBuilder(options.THREE)
  dressApartmentArchitecture({ into, plan: options.plan, space })
  for (const structure of options.plan.structures.filter(
    (item) => item.spaceId === space.id && isCommonApartmentFixture(item),
  )) {
    const surface = new ApartmentSurface(into, structure, floorOf(space, options.plan.tier))
    dressApartmentFurniture(surface)
    dressApartmentUtilities(surface)
  }
  return into.finish(`prince-apartment-envelope-${space.id}`)
}
