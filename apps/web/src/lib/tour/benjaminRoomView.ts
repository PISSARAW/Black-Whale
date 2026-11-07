import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { BenjaminRoomSurface } from './benjaminRoomDetailSurface'
import { dressBenjaminRoomArchitecture } from './benjaminRoomArchitecture'
import { dressBenjaminRoomPicture } from './benjaminRoomPictures'
import { dressBenjaminRoomFurniture } from './benjaminRoomFurniture'
import { dressBenjaminRoomSoldiers } from './benjaminRoomSoldiers'
import type { Structure } from './types'

export const BENJAMIN_ROOM_SPACE = 'tier-1-royal-residential-sector-room-1001-living'

export function hasBenjaminCoarseModel(structure: Structure): boolean {
  return (
    structure.spaceId === BENJAMIN_ROOM_SPACE &&
    (structure.id.endsWith('-seat-04') ||
      structure.id.endsWith('-table-05') ||
      structure.id.endsWith('-cabinet-06'))
  )
}

/** Omit generic civil furniture from walked plan, retaining full collision and canonical fixtures. */
export function benjaminSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => id === BENJAMIN_ROOM_SPACE)) return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !hasBenjaminCoarseModel(structure)),
  }
}

/** Chapter 362, 363 and 366; austere military reception room of 1st Prince Benjamin. */
export function buildBenjaminRoomDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || spaceId !== BENJAMIN_ROOM_SPACE) return null
  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const structures = plan.structures.filter((structure) => structure.spaceId === spaceId)

  dressBenjaminRoomArchitecture({ THREE, into, plan, space })

  structures.forEach((structure, index) => {
    const surface = new BenjaminRoomSurface(into, structure, floor)
    if (structure.kind === 'painting') {
      dressBenjaminRoomPicture(THREE, surface, index)
    } else {
      dressBenjaminRoomFurniture(surface)
    }
  })

  dressBenjaminRoomSoldiers(into, floor)

  return into.finish('benjamin-room-manga-details')
}
