import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { floorOf, type TierPlan } from './blueprint'
import { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentArchitecture } from './apartmentArchitecture'
import { dressApartmentFurniture } from './apartmentFurniture'
import { dressApartmentUtilities } from './apartmentUtilities'
import { dressPrinceBedroomDecor } from './princeBedroomDecor'
import { dressPrinceBedroomMangaProp, isPrinceBedroomMangaFixture } from './princeBedroomMangaProps'

/** Furniture from a programme-type plan; room-specific panel models take precedence. */
export function buildApartmentReconstruction(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
  name: string
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  dressApartmentArchitecture({ into, plan, space })
  for (const structure of plan.structures.filter((item) => item.spaceId === spaceId)) {
    const surface = new ApartmentSurface(into, structure, floorOf(space, plan.tier))
    if (isPrinceBedroomMangaFixture(structure)) dressPrinceBedroomMangaProp(surface)
    else {
      dressApartmentFurniture(surface)
      dressApartmentUtilities(surface)
    }
  }
  dressPrinceBedroomDecor({ into, plan, space })
  return into.finish(options.name)
}
