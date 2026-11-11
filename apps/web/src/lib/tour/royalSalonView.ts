import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { SalonSurface } from './royalSalonDetailSurface'
import { dressRoyalSalonArchitecture } from './royalSalonArchitecture'
import { dressRoyalSalonFurniture } from './royalSalonFurniture'
import { dressRoyalSalonPicture } from './royalSalonPictures'
import { buildApartmentReconstruction } from './apartmentReconstruction'

export const ROYAL_SALON = 'tier-1-king-living-quarters-living'
export const ROYAL_VESTIBULE = 'tier-1-king-living-quarters-vestibule'

/** Detailed furniture replaces visual blocks; the original plan still supplies collisions. */
export function royalSalonSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || plan.tier.id !== 'interior-king-quarters') return plan
  return { ...plan, structures: plan.structures.filter((s) => s.spaceId !== ROYAL_SALON) }
}

/** Chapter 382; measurements, finishes and simplified profiles are interpretations. */
export function buildRoyalSalonDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (!reveal && spaceId === ROYAL_VESTIBULE)
    return buildApartmentReconstruction({ ...options, name: 'nasubi-vestibule-reconstruction' })
  if (reveal || spaceId !== ROYAL_SALON) return null
  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const structures = plan.structures.filter((structure) => structure.spaceId === spaceId)
  structures.forEach((structure, index) => {
    const surface = new SalonSurface(into, structure, floor)
    if (structure.kind === 'painting') dressRoyalSalonPicture(THREE, surface, index)
    else dressRoyalSalonFurniture(surface)
  })
  dressRoyalSalonArchitecture({ THREE, into, plan, space })
  return into.finish('nasubi-salon-manga-details')
}
