import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { floorOf, type TierPlan } from './blueprint'
import { dressZhangLeiArchitecture } from './zhangLeiArchitecture'
import { ZhangLeiSurface } from './zhangLeiDetailSurface'
import { dressZhangLeiFurniture } from './zhangLeiFurniture'
import { dressZhangLeiPicture } from './zhangLeiPictures'
import { buildZhangLeiApartmentDetails, ZHANG_LEI_PRIVATE_SPACES } from './zhangLeiApartmentView'
import type { Structure } from './types'

export const ZHANG_LEI_DINING = 'tier-1-royal-residential-sector-room-1003-dining'

export function hasZhangLeiModel(structure: Structure): boolean {
  return (
    structure.spaceId === ZHANG_LEI_DINING ||
    (ZHANG_LEI_PRIVATE_SPACES.includes(structure.spaceId) &&
      ['bed', 'seat', 'table', 'cabinet', 'counter', 'basin'].includes(structure.kind))
  )
}

/** The walked solids remain in plan.walls; only their coarse drawing is replaced. */
export function zhangLeiSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || plan.tier.id !== 'interior-room-1003') return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !hasZhangLeiModel(structure)),
  }
}

/** Chapters 365 and 366; measurements, finishes and simplified profiles are interpretations. */
export function buildZhangLeiDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null
  if (spaceId !== ZHANG_LEI_DINING) return buildZhangLeiApartmentDetails(options)
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
