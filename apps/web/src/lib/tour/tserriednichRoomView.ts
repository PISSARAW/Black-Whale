import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { TserriednichRoomSurface } from './tserriednichRoomDetailSurface'
import { dressTserriednichRoomArchitecture } from './tserriednichRoomArchitecture'
import { dressTserriednichRoomPicture } from './tserriednichRoomPictures'
import {
  dressTserriednichKitchenFurniture,
  dressTserriednichLivingFurniture,
} from './tserriednichRoomFurniture'
import type { Space } from './types'

export const TSERRIEDNICH_ROOM_1004 = 'tier-1-royal-residential-sector-room-1004'
export const TSERRIEDNICH_LIVING = 'tier-1-royal-residential-sector-room-1004-living'
export const TSERRIEDNICH_KITCHEN = 'tier-1-royal-residential-sector-room-1004-kitchen'

function buildLiving(options: { THREE: typeof Three; plan: TierPlan; space: Space }): Three.Group {
  const { THREE, plan, space } = options
  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const structures = plan.structures.filter((structure) => structure.spaceId === space.id)

  dressTserriednichRoomArchitecture({ THREE, into, plan, space })

  for (const structure of structures) {
    const surface = new TserriednichRoomSurface(into, structure, floor)
    if (structure.kind === 'painting') dressTserriednichRoomPicture(surface)
    else dressTserriednichLivingFurniture(surface)
  }

  return into.finish('tserriednich-living-details')
}

function buildKitchen(options: { THREE: typeof Three; plan: TierPlan; space: Space }): Three.Group {
  const { THREE, plan, space } = options
  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const structures = plan.structures.filter((structure) => structure.spaceId === space.id)

  for (const structure of structures) {
    dressTserriednichKitchenFurniture(new TserriednichRoomSurface(into, structure, floor))
  }

  return into.finish('tserriednich-kitchen-details')
}

/** Reconstructed suite 1004 for Prince Tserriednich, chs. 362-363 and 384-387. */
export function buildTserriednichRoomDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || !spaceId.startsWith(TSERRIEDNICH_ROOM_1004)) return null

  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  if (spaceId === TSERRIEDNICH_LIVING) return buildLiving({ THREE, plan, space })
  if (spaceId === TSERRIEDNICH_KITCHEN) return buildKitchen({ THREE, plan, space })
  return null
}
