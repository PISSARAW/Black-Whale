import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import type { Structure } from './types'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { PrisonFixture } from './prisonFixture'
import {
  buildPrisonBed,
  buildPrisonTable,
  buildPrisonBench,
  buildPrisonShelves,
  buildPrisonUrinal,
  buildPrisonIntercom,
} from './prisonFurniture'
import { buildPrisonGrille, buildPrisonManacle } from './prisonRestraints'

export const BEYOND_CELL = 'tier-1-vvip-prison-beyond-cell'
export const BEYOND_WATCH = 'tier-1-vvip-prison-beyond-watch'
export const BEYOND_SPACES = [BEYOND_CELL, BEYOND_WATCH]

const furnishings: Partial<Record<Structure['kind'], (fixture: PrisonFixture) => void>> = {
  bed: buildPrisonBed,
  table: buildPrisonTable,
  seat: buildPrisonBench,
  cabinet: buildPrisonShelves,
  basin: buildPrisonUrinal,
  telephone: buildPrisonIntercom,
  manacle: buildPrisonManacle,
}

export function hasPrisonModel(structure: Structure): boolean {
  return BEYOND_SPACES.includes(structure.spaceId) && !!furnishings[structure.kind]
}

/** The walked plan keeps collision and provenance; only its drawing changes. */
export function prisonSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal) return plan
  return { ...plan, structures: plan.structures.filter((structure) => !hasPrisonModel(structure)) }
}

/** Chapter 359, reading page 5. No scans or independent fixture positions. */
export function buildPrisonDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || !BEYOND_SPACES.includes(spaceId)) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  for (const structure of plan.structures.filter((item) => item.spaceId === spaceId)) {
    const model = structure.kind === 'bars' ? buildPrisonGrille : furnishings[structure.kind]
    model?.(new PrisonFixture(into, THREE, { structure, floor: floorOf(space, plan.tier) }))
  }
  const root = into.finish()
  root.name = 'beyond-prison-manga-details'
  return root
}
