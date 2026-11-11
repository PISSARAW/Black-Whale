import type * as Three from 'three'
import { ApartmentSurface } from './apartmentDetailSurface'
import { dressQueenApartmentFurniture } from './queenApartmentFurniture'
import { isQueenApartment } from './queenApartmentProgramme'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { floorOf, type TierPlan } from './blueprint'

export { QUEEN_DUAZUL_ROOM } from './queenApartmentProgramme'

/** Common programme extrapolated from Unma; original plan still supplies collisions. */
export function queenApartmentSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal) return plan
  return {
    ...plan,
    structures: plan.structures.filter((item) => !isQueenApartment(item.spaceId)),
  }
}

export function buildQueenApartmentDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || !isQueenApartment(spaceId)) return null
  const room = plan.spaces.find(({ id }) => id === spaceId)
  if (!room) return null
  const into = new BanquetDetailBuilder(THREE)
  for (const item of plan.structures.filter((s) => s.spaceId === spaceId)) {
    dressQueenApartmentFurniture(new ApartmentSurface(into, item, floorOf(room, plan.tier)))
  }
  return into.finish('queen-apartment-common-reconstruction')
}
