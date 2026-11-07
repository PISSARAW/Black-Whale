import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder, disposeBanquetDetails } from './banquetDetailBuilder'
import { BURIAL_SPACE, dressBurialArchitecture } from './burialChamberArchitecture'
import { dressBurialCoffin } from './burialChamberFurniture'

export { disposeBanquetDetails, BURIAL_SPACE }

/**
 * Reconstructed Princes' Burial Chamber from chapters 358 and 371.
 *
 * Measurements, radial casket layout, sacrificial machine and ritual circuit
 * interpret Togashi's black-and-white artwork. See data/ship/princes-burial-chamber-audit.md.
 */
export function buildBurialChamberDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || spaceId !== BURIAL_SPACE) return null

  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)

  // 1. Architecture: dome, wall pilasters, ritual labyrinth floor, central apparatus & cables
  dressBurialArchitecture({ THREE, into, plan, space })

  // 2. The 14 caskets
  const coffins = plan.structures.filter(
    (structure) => structure.spaceId === spaceId && structure.id.includes('coffin'),
  )
  for (const structure of coffins) {
    dressBurialCoffin({ into, structure, floor })
  }

  return into.finish('princes-burial-chamber-manga-details')
}
