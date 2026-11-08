import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { SupremeCourtSurface } from './supremeCourtDetailSurface'
import { dressSupremeCourtArchitecture } from './supremeCourtArchitecture'
import { dressSupremeCourtFloor } from './supremeCourtFloor'
import { dressSupremeCourtSeal } from './supremeCourtSeal'
import {
  dressClerkDesk,
  dressCounselTable,
  dressCourtBarRailing,
  dressGalleryBenches,
  dressMagistrateBench,
  dressSpeakerPodium,
} from './supremeCourtFurniture'
import type { Structure } from './types'

export const SUPREME_COURT_SPACE = 'tier-1-supreme-court'

export function isSupremeCourtSpace(spaceId: string): boolean {
  return spaceId === SUPREME_COURT_SPACE
}

export function hasSupremeCourtModel(structure: Structure): boolean {
  return (
    structure.id.startsWith('tier-1-supreme-court-') || structure.spaceId === SUPREME_COURT_SPACE
  )
}

/** Omit coarse blueprint boxes from walked plan while retaining full collision physics */
export function supremeCourtSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => id === SUPREME_COURT_SPACE)) return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !hasSupremeCourtModel(structure)),
  }
}

function dressCourtStructure(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  const surface = new SupremeCourtSurface(into, structure, floor)
  const id = structure.id

  if (id.endsWith('-bench')) {
    dressMagistrateBench(surface)
  } else if (id.includes('-clerk-')) {
    dressClerkDesk(surface)
  } else if (id.endsWith('-podium')) {
    dressSpeakerPodium(surface)
  } else if (id.endsWith('-prosecution') || id.endsWith('-defence')) {
    dressCounselTable(surface)
  } else if (id.includes('-benches-')) {
    dressGalleryBenches(surface)
  }
}

/** Chapter 349, 371, 376, 379: High-detail monumental Supreme Court on Tier 1-B */
export function buildSupremeCourtDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || spaceId !== SUPREME_COURT_SPACE) return null

  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)

  // 1. Architecture, coffered ceiling, chandeliers and entrance portal
  dressSupremeCourtArchitecture({ THREE, into, plan, space })

  // 2. Ceremonial parquet, red carpet runner and stepped dais
  dressSupremeCourtFloor({ into, floor })

  // 3. 3D sculpted judicial seal above magistrate's bench
  dressSupremeCourtSeal({ into, floor })

  // 4. Dress each canonical courtroom fixture from the blueprint
  const structures = plan.structures.filter((s) => s.spaceId === spaceId)
  for (const structure of structures) {
    dressCourtStructure(into, structure, floor)
  }

  // 5. Wooden court bar railing separating well from spectator gallery
  dressCourtBarRailing(into, floor)

  return into.finish('supreme-court-manga-details')
}
