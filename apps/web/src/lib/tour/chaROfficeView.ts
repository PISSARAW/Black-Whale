import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import {
  dressIndustrialCeiling,
  dressRobotFacedDoor,
  dressSmartLockEntrance,
  dressTreasureChestDoor,
  dressWhiteDoor,
  dressWoodenDoor,
} from './chaROfficeArchitecture'
import {
  dressBunkBed,
  dressChaREmblem,
  dressCommandDesk,
  dressCCTVMonitorBank,
  dressStorageShelves,
  dressWatchDesk,
} from './chaROfficeFurniture'
import type { Structure } from './types'

export const CHA_R_MAIN_OFFICE = 'tier-5-cha-r-family-office-main-office'
export const CHA_R_BEDROOM = 'tier-5-cha-r-family-office-bedroom'
export const CHA_R_MONITOR_ROOM = 'tier-5-cha-r-family-office-monitor-room'
export const CHA_R_HALL = 'tier-5-cha-r-family-office-hall'

export const CHA_R_SPACES = new Set<string>([
  CHA_R_MAIN_OFFICE,
  CHA_R_BEDROOM,
  CHA_R_MONITOR_ROOM,
  CHA_R_HALL,
])

export function isChaROfficeSpace(spaceId: string): boolean {
  return CHA_R_SPACES.has(spaceId)
}

export function hasChaROfficeModel(structure: Structure): boolean {
  return CHA_R_SPACES.has(structure.spaceId)
}

/** Omit duplicate coarse blueprint boxes in walking mode while retaining full collision. */
export function chaRSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => CHA_R_SPACES.has(id))) return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !hasChaROfficeModel(structure)),
  }
}

interface RoomDressing {
  into: BanquetDetailBuilder
  floor: number
  ceilingHeight: number
}

function dressMainOffice(context: RoomDressing): void {
  const { into, floor, ceilingHeight } = context
  dressChaREmblem({ into, floor, at: [-11.25, 3.13] })
  dressCommandDesk({ into, floor, at: [-11, -6] })
  dressTreasureChestDoor({ into, floor, at: [-19.4, -6] })
  dressRobotFacedDoor({ into, floor, at: [-19.4, -2.5] })
  dressWoodenDoor({ into, floor, at: [-19.4, 0.65] })
  dressIndustrialCeiling({
    into,
    floor,
    ceilingHeight,
    center: [-11.25, floor + ceilingHeight, -4.25],
    length: 16,
  })
}

function dressBedroom(context: RoomDressing): void {
  const { into, floor, ceilingHeight } = context
  dressBunkBed({ into, floor, at: [-18, 8.5] })
  dressBunkBed({ into, floor, at: [-14.5, 8.5] })
  dressStorageShelves({ into, floor, at: [-3, 8.25] })
  dressIndustrialCeiling({
    into,
    floor,
    ceilingHeight,
    center: [-11.25, floor + ceilingHeight, 8.25],
    length: 16,
  })
}

function dressMonitorRoom(context: RoomDressing): void {
  const { into, floor, ceilingHeight } = context
  dressCCTVMonitorBank({ into, floor, at: [9.75, -10] })
  dressWatchDesk({ into, floor, at: [9.75, -7.5] })
  dressWhiteDoor({ into, floor, at: [-0.75, -2] })
  dressIndustrialCeiling({
    into,
    floor,
    ceilingHeight,
    center: [9.75, floor + ceilingHeight, 0],
    length: 18,
  })
}

function dressHall(context: RoomDressing): void {
  const { into, floor, ceilingHeight } = context
  dressSmartLockEntrance({ into, floor, at: [-1.5, -11.75] })
  dressWhiteDoor({ into, floor, at: [-0.75, -2] })
  dressIndustrialCeiling({
    into,
    floor,
    ceilingHeight,
    center: [-1.5, floor + ceilingHeight, 0],
    length: 22,
  })
}

/**
 * Reconstructed Cha-R Family Office on Tier 5 from chapters 379 and 380.
 *
 * Implements the main emblem room with the clan crest and three distinct doors
 * (treasure chest, robot face and wood), the adjoining bunk compartment where
 * Feitan and Phinks conduct interrogations, and the white-door CCTV surveillance room.
 */
export function buildChaROfficeDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || !CHA_R_SPACES.has(spaceId)) return null

  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const ceilingHeight = ceilingOf(space, plan.tier)
  const context = { into, floor, ceilingHeight }

  if (spaceId === CHA_R_MAIN_OFFICE) dressMainOffice(context)
  else if (spaceId === CHA_R_BEDROOM) dressBedroom(context)
  else if (spaceId === CHA_R_MONITOR_ROOM) dressMonitorRoom(context)
  else if (spaceId === CHA_R_HALL) dressHall(context)

  return into.finish(`cha-r-office-${spaceId}-details`)
}
