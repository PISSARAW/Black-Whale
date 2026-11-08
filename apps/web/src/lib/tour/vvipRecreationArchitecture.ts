import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { TierPlan } from './blueprint'
import type { Space } from './types'
import {
  PALETTE,
  drawFlutedColumn,
  drawMonumentalChandelier,
  drawTurnedBaluster,
} from './vvipRecreationDetailSurface'

export interface ArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

interface RailOptions {
  into: BanquetDetailBuilder
  start: [number, number, number]
  end: [number, number, number]
  height?: number
  stepCount?: number
}

function drawStraightRail(options: RailOptions): void {
  const { into, start, end, height = 0.95 } = options
  const [x1, y1, z1] = start
  const [x2, _y2, z2] = end
  const length = Math.hypot(x2 - x1, z2 - z1)
  const mx = (x1 + x2) / 2
  const mz = (z1 + z2) / 2
  const angle = Math.atan2(x2 - x1, z2 - z1)

  // Bottom plinth and handrail
  const rot: [number, number, number] = [0, angle, 0]
  into.box([0.14, 0.08, length], {
    at: [mx, y1 + 0.04, mz],
    rotation: rot,
    colour: PALETTE.darkWood,
  })
  into.box([0.16, 0.08, length], {
    at: [mx, y1 + height, mz],
    rotation: rot,
    colour: PALETTE.mahogany,
  })
  into.box([0.06, 0.02, length], {
    at: [mx, y1 + height + 0.04, mz],
    rotation: rot,
    colour: PALETTE.gold,
  })

  const balusterCount = options.stepCount ?? Math.max(2, Math.floor(length / 0.38))
  for (let i = 0; i <= balusterCount; i++) {
    const frac = i / balusterCount
    const bx = x1 + (x2 - x1) * frac
    const bz = z1 + (z2 - z1) * frac
    drawTurnedBaluster({ into, at: [bx, y1 + 0.08, bz], height: height - 0.08 })
  }
}

function dressMezzanineRails(into: BanquetDetailBuilder, floor: number): void {
  const my = floor + 2.8 // Mezzanine floor level

  // Rear gallery front rail (facing south into the open hall)
  drawStraightRail({
    into,
    start: [29.1, my, -47.0],
    end: [52.9, my, -47.0],
  })

  // Left gallery inner rail (facing east into hall)
  drawStraightRail({
    into,
    start: [29.0, my, -47.0],
    end: [29.0, my, -33.4],
  })
  drawStraightRail({
    into,
    start: [29.0, my, -28.0],
    end: [29.0, my, -25.2],
  })

  // Right gallery inner rail (facing west into hall)
  drawStraightRail({
    into,
    start: [53.0, my, -47.0],
    end: [53.0, my, -33.4],
  })
  drawStraightRail({
    into,
    start: [53.0, my, -28.0],
    end: [53.0, my, -25.2],
  })

  // Gallery edge molding and gold fascia under the slab (y = floor + 2.3)
  const slabY = floor + 2.55
  into.box([24.0, 0.5, 0.12], { at: [41.0, slabY, -47.0], colour: PALETTE.darkWood })
  into.box([24.0, 0.06, 0.16], { at: [41.0, slabY + 0.22, -47.0], colour: PALETTE.gold })
  into.box([0.12, 0.5, 22.0], { at: [29.0, slabY, -36.0], colour: PALETTE.darkWood })
  into.box([0.16, 0.06, 22.0], { at: [29.0, slabY + 0.22, -36.0], colour: PALETTE.gold })
  into.box([0.12, 0.5, 22.0], { at: [53.0, slabY, -36.0], colour: PALETTE.darkWood })
  into.box([0.16, 0.06, 22.0], { at: [53.0, slabY + 0.22, -36.0], colour: PALETTE.gold })
}

interface StairRailingOptions {
  into: BanquetDetailBuilder
  floor: number
  stairX: number
  isLeft: boolean
}

function dressStairRailing(options: StairRailingOptions): void {
  const { into, floor, stairX, isLeft } = options
  // Sloping railing on the open side of the stairs
  const railX = isLeft ? stairX + 1.05 : stairX - 1.05
  const startY = floor + 0.2
  const endY = floor + 2.8
  const startZ = -28.0
  const endZ = -33.2
  const lengthZ = Math.abs(endZ - startZ)
  const count = 14

  // Newel posts with decorative ball finials
  into.box([0.16, 1.1, 0.16], { at: [railX, startY + 0.55, startZ], colour: PALETTE.darkWood })
  into.sphere([0.08, 0.1, 0.08], { at: [railX, startY + 1.15, startZ], colour: PALETTE.gold })
  into.box([0.16, 1.1, 0.16], { at: [railX, endY + 0.55, endZ], colour: PALETTE.darkWood })
  into.sphere([0.08, 0.1, 0.08], { at: [railX, endY + 1.15, endZ], colour: PALETTE.gold })

  for (let i = 0; i < count; i++) {
    const stepZ = startZ - i * 0.4 - 0.2
    const stepY = floor + (i + 1) * 0.2
    drawTurnedBaluster({ into, at: [railX, stepY, stepZ], height: 0.85 })
  }

  // Sloping handrail beam
  const rotX = Math.atan2(endY - startY, lengthZ)
  into.box([0.12, 0.08, Math.hypot(endY - startY, lengthZ)], {
    at: [railX, (startY + endY) / 2 + 0.85, (startZ + endZ) / 2],
    rotation: [-rotX, 0, 0],
    colour: PALETTE.mahogany,
  })
}

function dressColonnade(into: BanquetDetailBuilder, floor: number): void {
  // Classical fluted columns supporting the mezzanine at x = 29 and x = 53
  const zPositions = [-28.0, -34.5, -41.0, -47.0]
  for (const z of zPositions) {
    drawFlutedColumn({ into, at: [29.0, floor, z], height: 2.8, radius: 0.28 })
    drawFlutedColumn({ into, at: [53.0, floor, z], height: 2.8, radius: 0.28 })
  }
}

function dressCofferedCeiling(
  into: BanquetDetailBuilder,
  floor: number,
  ceilingHeight: number,
): void {
  const topY = floor + ceilingHeight
  const beamY = topY - 0.15

  // Longitudinal primary beams across central hall
  for (const bx of [29.0, 35.0, 41.0, 47.0, 53.0]) {
    into.box([0.35, 0.3, 25.0], { at: [bx, beamY, -37.5], colour: PALETTE.darkWood })
    into.box([0.1, 0.04, 25.0], { at: [bx, topY - 0.32, -37.5], colour: PALETTE.gold })
  }

  // Transverse cross-beams
  for (const bz of [-25.0, -30.5, -36.0, -41.5, -47.0, -50.0]) {
    into.box([30.0, 0.3, 0.35], { at: [41.0, beamY, bz], colour: PALETTE.darkWood })
    into.box([30.0, 0.04, 0.1], { at: [41.0, topY - 0.32, bz], colour: PALETTE.gold })
  }

  // Coffer ceiling rosettes
  for (const rx of [32.0, 38.0, 44.0, 50.0]) {
    for (const rz of [-27.75, -33.25, -38.75, -44.25]) {
      into.cylinder(
        { radius: 0.45, height: 0.04, sides: 12 },
        { at: [rx, topY - 0.02, rz], colour: PALETTE.gold },
      )
      into.box([4.8, 0.06, 4.4], { at: [rx, topY - 0.05, rz], colour: PALETTE.alabaster })
    }
  }
}

/** Dresses the monumental architecture, colonnades, railings, ceiling and lighting. */
export function dressVvipRecreationArchitecture(context: ArchitectureContext): void {
  const { THREE, into, plan, space } = context
  const floor = plan.tier.elevation + (space.floor ?? 0)
  const ceilingHeight = space.ceiling ?? 8.0

  // 1. Colonnade under the mezzanine
  dressColonnade(into, floor)

  // 2. Mezzanine gallery railings and edge fascia
  dressMezzanineRails(into, floor)

  // 3. Double symmetric stair railings
  dressStairRailing({ into, floor, stairX: 30.0, isLeft: true })
  dressStairRailing({ into, floor, stairX: 52.0, isLeft: false })

  // 4. Coffered ceiling beams and rosettes
  dressCofferedCeiling(into, floor, ceilingHeight)

  // 6. Four grand crystal chandeliers suspended from the 8m ceiling
  const chandelierY = floor + ceilingHeight
  drawMonumentalChandelier({ THREE, into, at: [35.5, chandelierY, -33.5] })
  drawMonumentalChandelier({ THREE, into, at: [46.5, chandelierY, -33.5] })
  drawMonumentalChandelier({ THREE, into, at: [35.5, chandelierY, -43.0] })
  drawMonumentalChandelier({ THREE, into, at: [46.5, chandelierY, -43.0] })
}
