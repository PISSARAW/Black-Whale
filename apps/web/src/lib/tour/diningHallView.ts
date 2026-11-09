import type * as Three from 'three'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder, disposeBanquetDetails } from './banquetDetailBuilder'
import { dressDiningHallArchitecture } from './diningHallArchitecture'
import {
  dressCentralVIPPlatform,
  dressDiningBench,
  dressDiningTable,
  dressFranklinTable,
} from './diningHallFurniture'
import { dressMenuBoards, dressServiceCounter, dressVendingMachines } from './diningHallCounters'

import type { Structure } from './types'

export { disposeBanquetDetails }
export const DINING_HALL_SPACE = 'tier-5-central-dining-hall'
const CENTRAL_VIP_TABLE_IDS = new Set([
  `${DINING_HALL_SPACE}-platform-north`,
  `${DINING_HALL_SPACE}-platform-south`,
])

export const isCentralVIPTable = (structure: Structure): boolean =>
  structure.kind === 'table' && CENTRAL_VIP_TABLE_IDS.has(structure.id)

interface StructureContext {
  into: BanquetDetailBuilder
  structure: Structure
  floor: number
  ceiling: number
}

function dressServiceOrDispensers(context: StructureContext): boolean {
  const { structure } = context
  if (structure.id === `${DINING_HALL_SPACE}-service-counter`) {
    dressServiceCounter(context)
    return true
  }
  if (structure.id === `${DINING_HALL_SPACE}-menu-board`) {
    dressMenuBoards(context)
    return true
  }
  if (structure.id === `${DINING_HALL_SPACE}-dispensers`) {
    dressVendingMachines(context)
    return true
  }
  return false
}

function dressTableOrSeat(context: StructureContext): void {
  const { structure } = context
  if (structure.id === `${DINING_HALL_SPACE}-franklin-table`) {
    dressFranklinTable(context)
  } else if (isCentralVIPTable(structure)) {
    dressCentralVIPPlatform(context)
  } else if (structure.kind === 'seat') {
    dressDiningBench(context)
  } else if (structure.kind === 'table') {
    dressDiningTable(context)
  }
}

function dressDiningHallStructure(context: StructureContext): void {
  if (!dressServiceOrDispensers(context)) {
    dressTableOrSeat(context)
  }
}

/**
 * Reconstructed 9 m refectory from chapters 371, 377 and 379-380.
 *
 * Positions and collision bounding boxes come from the walked ship blueprint.
 * Finishes, roof trusses, catwalks, service counter and tableware interpret
 * Togashi's black-and-white artwork. See data/ship/central-dining-hall-audit.md.
 */
export function buildDiningHallDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || spaceId !== DINING_HALL_SPACE) return null

  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const ceiling = floor + ceilingOf(space, plan.tier)

  // 1. Industrial overhead architecture, trusses, catwalks, lamps, ducts and columns
  dressDiningHallArchitecture({ THREE, into, plan, space })

  // 2. Specific furniture, counters and tableware
  const structures = plan.structures.filter((structure) => structure.spaceId === spaceId)
  for (const structure of structures) {
    dressDiningHallStructure({ into, structure, floor, ceiling })
  }

  return into.finish('central-dining-hall-manga-details')
}
