import type * as Three from 'three'
import { floorOf, ceilingOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { dressPrincesGateArchitecture } from './princesGateArchitecture'
import { dressGateDesk, dressWeaponRack } from './princesGateFurniture'
import { dressApartmentEntrance } from './princesApartmentEntrances'
import { dressCorridorArchitecture } from './princesCorridorArchitecture'
import type { Structure } from './types'

export const PRINCES_GATE_SPACE = 'tier-1-princes-quarters-gate'

export function isPrincesApproach(spaceId: string): boolean {
  return /^tier-1-royal-residential-approach-10(0[1-9]|1[0-4])$/.test(spaceId)
}

export function isPrincesCorridor(spaceId: string): boolean {
  return (
    spaceId === 'tier-1-princes-front-corridor-port' ||
    spaceId === 'tier-1-princes-front-corridor-starboard' ||
    spaceId === 'tier-1-royal-residential-corridor-port' ||
    spaceId === 'tier-1-royal-residential-corridor-starboard' ||
    spaceId === 'tier-1-royal-residential-corridor-aft' ||
    /^tier-1-royal-residential-(cross-gap-[1-8]|back-passage-[1-7])$/.test(spaceId)
  )
}

export function hasPrincesGateModel(structure: Structure): boolean {
  return (
    structure.spaceId === PRINCES_GATE_SPACE && structure.id === 'tier-1-princes-quarters-gate-desk'
  )
}

/** Omit coarse blueprint desk from walked plan while retaining full collision. */
export function princesSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => id === PRINCES_GATE_SPACE)) return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !hasPrincesGateModel(structure)),
  }
}

function buildGateDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
}): Three.Group | null {
  const { THREE, plan, spaceId } = options
  const space = plan.spaces.find((s) => s.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const ceilingHeight = ceilingOf(space, plan.tier)

  dressPrincesGateArchitecture({ into, space, floor, ceilingHeight })
  dressWeaponRack(into, floor)

  const desk = plan.structures.find(hasPrincesGateModel)
  if (desk) {
    dressGateDesk({ into, structure: desk, floor })
  }

  return into.finish('princes-gate-manga-details')
}

function buildApproachDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
}): Three.Group | null {
  const { THREE, plan, spaceId } = options
  const space = plan.spaces.find((s) => s.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)

  dressApartmentEntrance({ into, space, floor })
  return into.finish(`princes-entrance-${spaceId}-details`)
}

function buildCorridorDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
}): Three.Group | null {
  const { THREE, plan, spaceId } = options
  const space = plan.spaces.find((s) => s.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const ceilingHeight = ceilingOf(space, plan.tier)

  dressCorridorArchitecture({ into, space, floor, ceilingHeight })
  return into.finish(`princes-corridor-${spaceId}-details`)
}

/** Reconstructed princes' residential sector from chapters 363 and 382. */
export function buildPrincesQuartersDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { reveal, spaceId } = options
  if (reveal) return null

  if (spaceId === PRINCES_GATE_SPACE) {
    return buildGateDetails(options)
  }
  if (isPrincesApproach(spaceId)) {
    return buildApproachDetails(options)
  }
  if (isPrincesCorridor(spaceId)) {
    return buildCorridorDetails(options)
  }
  return null
}
