import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import { dressHeillyCommunalArchitecture } from './heillyCommunalArchitecture'
import { dressHeillyCorridorArchitecture } from './heillyCorridorArchitecture'
import { dressHeillyLaundryArchitecture } from './heillyLaundryArchitecture'
import { dressHeillyOffice } from './heillyOfficeFurniture'
import { dressHeillyProcessingArchitecture } from './heillyProcessingArchitecture'
import type { Structure } from './types'

export const HEILLY_PROCESSING = 'tier-2-heilly-secret-hideout-processing'
export const HEILLY_LAUNDRY = 'tier-2-heilly-secret-hideout-laundry'
export const HEILLY_COMMUNAL = 'tier-2-heilly-secret-hideout-communal'
export const HEILLY_OFFICE = 'tier-2-heilly-secret-hideout-office'
export const HEILLY_CORRIDOR = 'tier-2-heilly-secret-hideout-corridor'

export const HEILLY_SPACES = new Set<string>([
  HEILLY_PROCESSING,
  HEILLY_LAUNDRY,
  HEILLY_COMMUNAL,
  HEILLY_OFFICE,
  HEILLY_CORRIDOR,
])

export function hasHeillyHideoutModel(structure: Structure): boolean {
  return HEILLY_SPACES.has(structure.spaceId)
}

/** Omit duplicate coarse blueprint boxes in walking mode while retaining full collision. */
export function heillySurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => HEILLY_SPACES.has(id))) return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !hasHeillyHideoutModel(structure)),
  }
}

/**
 * Reconstructed Heil-Ly Secret Hideout from chapters 398, 399, and 407.
 *
 * Implements the white-tiled Nen-barrier processing room with seven doors and shower hoses,
 * the industrial laundry and disposal banks, the communal meeting room with surveillance screens,
 * and Morena Prudo's office with the negotiation card game, TV console and vintage consoles.
 */
export function buildHeillyHideoutDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || !HEILLY_SPACES.has(spaceId)) return null

  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const ceilingHeight = ceilingOf(space, plan.tier)
  const structures = plan.structures.filter((s) => s.spaceId === spaceId)

  if (spaceId === HEILLY_PROCESSING) {
    dressHeillyProcessingArchitecture({ into, floor, ceilingHeight, space, structures })
  } else if (spaceId === HEILLY_LAUNDRY) {
    dressHeillyLaundryArchitecture({ into, floor, ceilingHeight, space, structures })
  } else if (spaceId === HEILLY_COMMUNAL) {
    dressHeillyCommunalArchitecture({ into, floor, ceilingHeight, space, structures })
  } else if (spaceId === HEILLY_OFFICE) {
    dressHeillyOffice({ into, floor, ceilingHeight, space, structures })
  } else if (spaceId === HEILLY_CORRIDOR) {
    dressHeillyCorridorArchitecture({ into, floor, ceilingHeight, space })
  }

  return into.finish(`heilly-hideout-${spaceId}-details`)
}
