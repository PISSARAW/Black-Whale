import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { TserriednichRoomSurface } from './tserriednichRoomDetailSurface'
import { dressTserriednichRoomArchitecture } from './tserriednichRoomArchitecture'
import { dressTserriednichRoomPicture } from './tserriednichRoomPictures'
import { dressTserriednichLivingFurniture } from './tserriednichRoomFurniture'
import {
  buildTserriednichApartmentDetails,
  TSERRIEDNICH_PRIVATE_SPACES,
} from './tserriednichApartmentView'
import type { Structure } from './types'
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

export function hasTserriednichModel(structure: Structure): boolean {
  return (
    structure.spaceId === TSERRIEDNICH_LIVING ||
    (TSERRIEDNICH_PRIVATE_SPACES.includes(structure.spaceId) &&
      ['bed', 'seat', 'table', 'cabinet', 'counter', 'basin'].includes(structure.kind))
  )
}

export function tserriednichSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || plan.tier.id !== 'interior-room-1004') return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !hasTserriednichModel(structure)),
  }
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
  return buildTserriednichApartmentDetails(options)
}
