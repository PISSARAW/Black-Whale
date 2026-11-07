import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { floorOf, type TierPlan } from './blueprint'
import { dressVvipRecreationArchitecture } from './vvipRecreationArchitecture'
import { VvipRecreationSurface } from './vvipRecreationDetailSurface'
import { dressVvipRecreationFurniture } from './vvipRecreationFurniture'

export const VVIP_RECREATION_HALL = 'tier-1-vvip-recreation-hall'

/** Chapters 419 and 420; grand recreation hall with double stairs and upper gallery. */
export function buildVvipRecreationDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || spaceId !== VVIP_RECREATION_HALL) return null
  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const structures = plan.structures.filter((structure) => structure.spaceId === spaceId)

  structures.forEach((structure) => {
    if (structure.kind !== 'platform') {
      const surface = new VvipRecreationSurface(into, structure, floor)
      dressVvipRecreationFurniture(surface)
    }
  })

  dressVvipRecreationArchitecture({ THREE, into, plan, space })
  return into.finish('vvip-recreation-hall-manga-details')
}
