import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { HangarEntranceSurface } from './hangarEntranceDetailSurface'
import { dressHangarEntranceArchitecture } from './hangarEntranceArchitecture'
import { dressHangarEntranceFloor } from './hangarEntranceFloor'
import { dressColossalHangarGate } from './hangarEntranceGate'
import {
  dressCargoStagingWest,
  dressFluidDrumsEast,
  dressSecurityCheckpoint,
} from './hangarEntranceEquipment'
import type { Structure } from './types'

export const HANGAR_ENTRANCE_SPACE = 'tier-5-hangar-entrance'

export function isHangarEntranceSpace(spaceId: string): boolean {
  return spaceId === HANGAR_ENTRANCE_SPACE
}

export function hasHangarEntranceModel(structure: Structure): boolean {
  return structure.id.startsWith('tier-5-hangar-') || structure.spaceId === HANGAR_ENTRANCE_SPACE
}

/** Omit coarse blueprint boxes from walked plan while retaining full collision physics */
export function hangarEntranceSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => id === HANGAR_ENTRANCE_SPACE)) return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !hasHangarEntranceModel(structure)),
  }
}

function dressHangarStructure(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  const surface = new HangarEntranceSurface(into, structure, floor)
  const id = structure.id

  if (id.endsWith('-gate')) {
    dressColossalHangarGate(surface)
  } else if (id.endsWith('-guard-post')) {
    dressSecurityCheckpoint(surface)
  } else if (id.endsWith('-staging-west')) {
    dressCargoStagingWest(surface)
  } else if (id.endsWith('-staging-east')) {
    dressFluidDrumsEast(surface)
  }
}

/** Chapter 358, 377, 390, 400: High-detail industrial Tier 5 Hangar Entrance */
export function buildHangarEntranceDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || spaceId !== HANGAR_ENTRANCE_SPACE) return null

  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)

  // 1. Industrial architecture, ceiling beams, crane runway and lighting
  dressHangarEntranceArchitecture({ THREE, into, floor })

  // 2. Heavy steel deck plates, welded joints and safety hazard bands
  dressHangarEntranceFloor({ into, floor })

  // 3. Dress canonical fixtures from blueprint (gate, checkpoint, staging zones)
  const structures = plan.structures.filter((s) => s.spaceId === spaceId)
  for (const structure of structures) {
    dressHangarStructure(into, structure, floor)
  }

  return into.finish('hangar-entrance-manga-details')
}
