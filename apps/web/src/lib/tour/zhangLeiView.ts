import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { floorOf, type TierPlan } from './blueprint'
import { dressZhangLeiArchitecture } from './zhangLeiArchitecture'
import { ZhangLeiSurface } from './zhangLeiDetailSurface'
import { dressZhangLeiFurniture } from './zhangLeiFurniture'
import { dressZhangLeiPicture } from './zhangLeiPictures'

export const ZHANG_LEI_DINING = 'tier-1-royal-residential-sector-room-1003-dining'

/** Chapters 365 and 366; measurements, finishes and simplified profiles are interpretations. */
export function buildZhangLeiDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || spaceId !== ZHANG_LEI_DINING) return null
  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const structures = plan.structures.filter((structure) => structure.spaceId === spaceId)

  structures.forEach((structure, index) => {
    const surface = new ZhangLeiSurface(into, structure, floor)
    if (structure.kind === 'painting') {
      dressZhangLeiPicture(THREE, surface, index)
    } else {
      dressZhangLeiFurniture(surface)
    }
  })

  dressZhangLeiArchitecture({ THREE, into, plan, space })
  return into.finish('zhang-lei-dining-manga-details')
}
