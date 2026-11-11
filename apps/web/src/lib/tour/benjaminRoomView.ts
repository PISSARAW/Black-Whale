import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { BenjaminRoomSurface } from './benjaminRoomDetailSurface'
import { dressBenjaminRoomArchitecture } from './benjaminRoomArchitecture'
import { dressBenjaminRoomPicture } from './benjaminRoomPictures'
import { dressBenjaminRoomFurniture } from './benjaminRoomFurniture'
import {
  buildBenjaminApartmentDetails,
  benjaminApartmentSurfacePlan,
} from './benjaminApartmentView'
import type { Structure } from './types'

export const BENJAMIN_ROOM_SPACE = 'tier-1-royal-residential-sector-room-1001-living'

export function hasBenjaminCoarseModel(structure: Structure): boolean {
  return (
    structure.spaceId === BENJAMIN_ROOM_SPACE &&
    ['table', 'seat', 'telephone', 'painting'].includes(structure.kind)
  )
}

/** Detailed furniture replaces the opaque blocks; walked collisions remain in plan.walls. */
export function benjaminSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => id === BENJAMIN_ROOM_SPACE)) return plan
  const apartment = benjaminApartmentSurfacePlan(plan, reveal)
  return {
    ...apartment,
    structures: apartment.structures.filter((structure) => !hasBenjaminCoarseModel(structure)),
  }
}

/** Chapters 363 and 366: Benjamin's furnished reception and briefing room. */
export function buildBenjaminRoomDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null
  if (spaceId !== BENJAMIN_ROOM_SPACE) return buildBenjaminApartmentDetails(options)
  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const structures = plan.structures.filter((structure) => structure.spaceId === spaceId)

  dressBenjaminRoomArchitecture({ THREE, into, plan, space })

  structures.forEach((structure) => {
    const surface = new BenjaminRoomSurface(into, structure, floor)
    if (structure.kind === 'painting') {
      dressBenjaminRoomPicture(THREE, surface)
    } else {
      dressBenjaminRoomFurniture(surface)
    }
  })

  return into.finish('benjamin-room-manga-details')
}
