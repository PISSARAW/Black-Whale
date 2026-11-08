import type { TierPlan } from './blueprint'
import { floorOf } from './blueprint'
import { pointInPolygon } from './geometry'
import { openingHeights } from './openingHeights'
import type { Doorway, Space, Vec2 } from './types'
import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'

export interface DoorPlacement {
  center: Vec2
  floor: number
  height: number
  width: number
  angle: number
  tangent: Vec2
  normal: Vec2
  openSign: 1 | -1
}

export interface DoorDressContext {
  into: BanquetDetailBuilder
  door: Doorway
  placement: DoorPlacement
}

export interface DoorBoxOptions {
  into: BanquetDetailBuilder
  placement: DoorPlacement
  size: Point3
  offset: Point3
  colour: number
  extraYaw?: number
}

export const TIER_1_PALETTE = {
  mahogany: 0x341e14,
  darkWood: 0x271913,
  gold: 0xc8a45a,
  brass: 0x8a724d,
  ivory: 0xf5f0e6,
}

export const TIER_2_PALETTE = {
  steel: 0x2f343a,
  darkMetal: 0x272a2e,
  stainless: 0x9aa0a6,
  ledGreen: 0x2ecc71,
  ledRed: 0xcc2929,
  glass: 0x78909c,
}

export const TIER_3_PALETTE = {
  frame: 0x3e4348,
  laminate: 0x51585d,
  aluminum: 0xc2c8d0,
  ledGreen: 0x52b788,
  basePlate: 0x2b2420,
}

export const TIER_4_PALETTE = {
  heavySteel: 0x393f45,
  darkSteel: 0x2c3136,
  hazardYellow: 0xd9b329,
  hazardBlack: 0x1b1c1e,
  portholeGlass: 0x5c7280,
}

export const TIER_5_PALETTE = {
  rawSteel: 0x25282e,
  darkIron: 0x181a1d,
  castPlate: 0x343a40,
  rivet: 0x424952,
}

const CORRIDOR_KEYWORDS = [
  'corridor',
  'promenade',
  'walkway',
  'passage',
  'spine',
  'hallway',
  'cross-corridor',
  'approach',
]

function isCorridor(spaceId: string, category?: string): boolean {
  if (category === 'corridor') return true
  return CORRIDOR_KEYWORDS.some((kw) => spaceId.includes(kw))
}

interface SwingSignOptions {
  spaceA: Space
  spaceB: Space
  normal: Vec2
  center: Vec2
}

function resolveSwingSign(options: SwingSignOptions): 1 | -1 {
  const { spaceA, spaceB, normal, center } = options
  const aIsCorridor = isCorridor(spaceA.id, spaceA.category)
  const bIsCorridor = isCorridor(spaceB.id, spaceB.category)
  const targetSpace = aIsCorridor && !bIsCorridor ? spaceB : spaceA
  const testPt: Vec2 = [center[0] + normal[0] * 0.1, center[1] + normal[1] * 0.1]
  const insideTarget = pointInPolygon(testPt, targetSpace.footprint)
  return insideTarget ? 1 : -1
}

/** Computes exact metric geometry and orientation for a doorway. */
export function computeDoorPlacement(plan: TierPlan, door: Doorway): DoorPlacement {
  const spaceA = plan.spaces.find((s) => s.id === door.a)
  const spaceB = plan.spaces.find((s) => s.id === door.b)
  const baseSpace = spaceA ?? spaceB!
  const otherSpace = spaceB ?? spaceA!

  const cx = (door.start[0] + door.end[0]) / 2
  const cz = (door.start[1] + door.end[1]) / 2
  const dx = door.end[0] - door.start[0]
  const dz = door.end[1] - door.start[1]
  const width = Math.hypot(dx, dz)
  const tangent: Vec2 = [dx / width, dz / width]
  const normal: Vec2 = [-dz / width, dx / width]
  const angle = Math.atan2(dz, dx)

  const floor = floorOf(baseSpace, plan.tier)
  const height =
    openingHeights({
      space: baseSpace,
      other: otherSpace,
      tier: plan.tier,
    }).bottom - floor

  const openSign = resolveSwingSign({
    spaceA: baseSpace,
    spaceB: otherSpace,
    normal,
    center: [cx, cz],
  })

  return {
    center: [cx, cz],
    floor,
    height: Math.max(2.1, height),
    width,
    angle,
    tangent,
    normal,
    openSign,
  }
}

/** Places a box oriented relative to the door opening. */
export function doorBox(options: DoorBoxOptions): void {
  const { into, placement, size, offset, colour, extraYaw = 0 } = options
  const [ox, oy, oz] = offset
  const cos = Math.cos(placement.angle)
  const sin = Math.sin(placement.angle)

  const worldX = placement.center[0] + ox * cos - oz * sin
  const worldY = placement.floor + oy
  const worldZ = placement.center[1] + ox * sin + oz * cos

  into.box(size, {
    at: [worldX, worldY, worldZ],
    rotation: [0, -placement.angle + extraYaw, 0],
    colour,
  })
}
