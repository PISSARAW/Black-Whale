import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import { dressDomeCeiling, dressRadialDeck, dressRibbedShell } from './podCabinArchitecture'
import {
  dressCentralPostAndBase,
  dressHatchCabinet,
  dressHatchConsole,
  dressRoundHatch,
} from './podCabinEquipment'
import type { Structure } from './types'

export const POD_CABIN_SPACE = 'tier-1-lifeboats-port-pod-cabin'

export const POD_CABIN_SPACES = new Set<string>([POD_CABIN_SPACE])

export function isPodCabinSpace(spaceId: string): boolean {
  return POD_CABIN_SPACES.has(spaceId)
}

export function hasPodCabinModel(structure: Structure): boolean {
  return POD_CABIN_SPACES.has(structure.spaceId)
}

/** Omit duplicate coarse blueprint boxes in walking mode while retaining full collision. */
export function podCabinSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => POD_CABIN_SPACES.has(id))) return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !hasPodCabinModel(structure)),
  }
}

/**
 * Reconstructed Tier 1 Lifeboat Escape Pod Cabin from chapter 383 (pp. 55-65).
 *
 * Implements the ribbed circular shell, segmented radial deck, dome ceiling with
 * central bulkhead lamp, the central structural post and stepped circular base,
 * the round pressure hatch with turning wheel, the hatch control console with
 * dual telemetry screens, and the emergency equipment cabinet.
 */
export function buildPodCabinDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || !POD_CABIN_SPACES.has(spaceId)) return null

  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const ceilingHeight = ceilingOf(space, plan.tier)

  // Architectural envelope: shell, segmented deck and ceiling dome
  dressRibbedShell({ into, floor, ceilingHeight })
  dressRadialDeck({ into, floor })
  dressDomeCeiling({ into, floor, ceilingHeight })

  // Equipment & furnishings: post & base, hatch, console and emergency cabinet
  dressCentralPostAndBase({ into, floor, ceilingHeight })
  dressRoundHatch({ into, floor, at: [0, -2.48] })
  dressHatchConsole({ into, floor, at: [0, -1.75] })
  dressHatchCabinet({ into, floor, at: [1.45, -1.45] })

  return into.finish(`pod-cabin-${spaceId}-details`)
}
