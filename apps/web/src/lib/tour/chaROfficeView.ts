import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import {
  dressBedroomFloor,
  dressIndustrialCeiling,
  dressMainOfficeFloor,
  dressMonitorRoomFloor,
  dressOfficeWallRuns,
  dressTechnicalCeiling,
  type RoomBounds,
} from './chaROfficeArchitecture'
import {
  dressRobotFacedDoor,
  dressSmartLockEntrance,
  dressTreasureChestDoor,
  dressWhiteDoor,
  dressWoodenDoor,
} from './chaROfficeDoors'
import {
  dressBunkBed,
  dressChaREmblem,
  dressCommandDesk,
  dressLockers,
  dressStorageShelves,
} from './chaROfficeFurniture'
import {
  dressCCTVMonitorBank,
  dressCornerCamera,
  dressEntranceCameras,
  dressWatchDesk,
} from './chaROfficeSurveillance'
import type { Space, Structure } from './types'

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

const MAIN_OFFICE_BOUNDS: RoomBounds = { minX: -20.25, maxX: -2.25, minZ: -11.75, maxZ: 3.25 }
const BEDROOM_BOUNDS: RoomBounds = { minX: -20.25, maxX: -2.25, minZ: 4.75, maxZ: 11.75 }
const MONITOR_ROOM_BOUNDS: RoomBounds = { minX: -0.75, maxX: 20.25, minZ: -11.75, maxZ: 11.75 }
const HALL_BOUNDS: RoomBounds = { minX: -2.25, maxX: -0.75, minZ: -11.75, maxZ: 11.75 }

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
  plan: TierPlan
  space: Space
  floor: number
  ceilingHeight: number
}

function dressMainOffice(context: RoomDressing): void {
  const { into, plan, space, floor, ceilingHeight } = context
  dressMainOfficeFloor({ into, floor })
  dressOfficeWallRuns({ into, plan, space })
  dressIndustrialCeiling({ into, floor, ceilingHeight, bounds: MAIN_OFFICE_BOUNDS })
  dressChaREmblem({ into, floor, at: [-11.25, 3.13] })
  dressCommandDesk({ into, floor, at: [-11, -6] })
  dressTreasureChestDoor({ into, floor, at: [-19.4, -6] })
  dressRobotFacedDoor({ into, floor, at: [-19.4, -2.5] })
  dressWoodenDoor({ into, floor, at: [-19.4, 0.65] })
  dressCornerCamera({ into, floor, at: [-2.4, floor + ceilingHeight - 0.2, 3.0] })
}

function dressBedroom(context: RoomDressing): void {
  const { into, plan, space, floor, ceilingHeight } = context
  dressBedroomFloor({ into, floor })
  dressOfficeWallRuns({ into, plan, space })
  dressIndustrialCeiling({ into, floor, ceilingHeight, bounds: BEDROOM_BOUNDS })
  dressBunkBed({ into, floor, at: [-18, 8.5] })
  dressBunkBed({ into, floor, at: [-14.5, 8.5] })
  dressStorageShelves({ into, floor, at: [-3, 8.25] })
  dressLockers({ into, floor, at: [-10.5, 11.4] })
  dressCornerCamera({ into, floor, at: [-2.4, floor + ceilingHeight - 0.2, 11.4] })
}

function dressMonitorRoom(context: RoomDressing): void {
  const { into, plan, space, floor, ceilingHeight } = context
  dressMonitorRoomFloor({ into, floor })
  dressOfficeWallRuns({ into, plan, space })
  dressTechnicalCeiling({ into, floor, ceilingHeight, bounds: MONITOR_ROOM_BOUNDS })
  dressCCTVMonitorBank({ into, floor, at: [9.75, -10] })
  dressWatchDesk({ into, floor, at: [9.75, -7.5] })
  dressWhiteDoor({ into, floor, at: [-0.75, -2] })
  dressCornerCamera({ into, floor, at: [19.8, floor + ceilingHeight - 0.2, 11.2] })
  dressCornerCamera({ into, floor, at: [19.8, floor + ceilingHeight - 0.2, -11.2] })
}

function dressHall(context: RoomDressing): void {
  const { into, floor, ceilingHeight } = context
  dressSmartLockEntrance({ into, floor, at: [-1.5, -11.75] })
  dressEntranceCameras({ into, floor, at: [-1.5, -11.6] })
  dressWhiteDoor({ into, floor, at: [-0.75, -2] })
  dressIndustrialCeiling({ into, floor, ceilingHeight, bounds: HALL_BOUNDS })
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
  const context = { into, plan, space, floor, ceilingHeight }

  if (spaceId === CHA_R_MAIN_OFFICE) dressMainOffice(context)
  else if (spaceId === CHA_R_BEDROOM) dressBedroom(context)
  else if (spaceId === CHA_R_MONITOR_ROOM) dressMonitorRoom(context)
  else if (spaceId === CHA_R_HALL) dressHall(context)

  return into.finish(`cha-r-office-${spaceId}-details`)
}
