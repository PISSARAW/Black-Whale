import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { floorOf, type TierPlan } from './blueprint'
import { dressQueenUnmaArchitecture } from './queenUnmaArchitecture'
import { QueenUnmaSurface } from './queenUnmaDetailSurface'
import { dressQueenUnmaFurniture } from './queenUnmaFurniture'
import { dressQueenUnmaPicture } from './queenUnmaPictures'

export const QUEEN_UNMA_ROOM = 'tier-1-queens-living-quarters-room-01'

/** The original plan continues to supply collisions; detailed meshes replace only its visual blocks. */
export function queenUnmaSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal) return plan
  return { ...plan, structures: plan.structures.filter((s) => s.spaceId !== QUEEN_UNMA_ROOM) }
}

/** Chapter 403; measurements, finishes and simplified profiles are interpretations. */
export function buildQueenUnmaDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || spaceId !== QUEEN_UNMA_ROOM) return null
  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const structures = plan.structures.filter((structure) => structure.spaceId === spaceId)

  structures.forEach((structure, index) => {
    const surface = new QueenUnmaSurface(into, structure, floor)
    if (structure.kind === 'painting') {
      dressQueenUnmaPicture(THREE, surface, index)
    } else {
      dressQueenUnmaFurniture(surface)
    }
  })

  dressQueenUnmaArchitecture({ THREE, into, plan, space })
  return into.finish('queen-unma-room-manga-details')
}
