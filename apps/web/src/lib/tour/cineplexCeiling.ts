import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  CINE_WOOD,
  CINE_DARK_PANEL,
  CINE_DUCT_STEEL,
  CINE_POSTER_FRAME,
  CINE_NEON_AMBER,
  CINE_NEON_BLUE,
  CINE_SPEAKER_BLACK,
} from './cineplexDetailSurface'

export interface CeilingBounds {
  xMin: number
  xMax: number
  zMin: number
  zMax: number
}

interface DuctSegmentOptions {
  into: BanquetDetailBuilder
  fromX: number
  toX: number
  z: number
  y: number
}

function dressCeilingDuct(options: DuctSegmentOptions): void {
  const { into, fromX, toX, z, y } = options
  const length = Math.abs(toX - fromX)
  const midX = (fromX + toX) / 2
  // Main cylindrical HVAC supply duct
  into.cylinder(
    { radius: 0.28, height: length, sides: 12 },
    { at: [midX, y, z], rotation: [0, 0, Math.PI / 2], colour: CINE_DUCT_STEEL },
  )
  // Duct hanger rods and joint collars
  const step = 4.0
  for (let x = fromX + 1.5; x <= toX - 1.5; x += step) {
    into.cylinder(
      { radius: 0.31, height: 0.08, sides: 12 },
      { at: [x, y, z], rotation: [0, 0, Math.PI / 2], colour: 0x3d434a },
    )
    into.cylinder(
      { radius: 0.015, height: 0.6, sides: 6 },
      { at: [x, y + 0.3, z], colour: 0x3d434a },
    )
  }
}

/** Recessed coffered beam grid on concourse ceiling */
function dressCofferBeams(
  into: BanquetDetailBuilder,
  bounds: CeilingBounds,
  ceilingY: number,
): void {
  const { xMin, xMax, zMin, zMax } = bounds
  const width = xMax - xMin
  const depth = zMax - zMin
  const midX = (xMin + xMax) / 2
  const midZ = (zMin + zMax) / 2

  // Background ceiling slab
  into.box([width, 0.08, depth], {
    at: [midX, ceilingY - 0.04, midZ],
    colour: CINE_DARK_PANEL,
  })

  // Longitudinal beams (along Z)
  for (let x = xMin + 2.5; x <= xMax - 2.0; x += 5.0) {
    into.box([0.18, 0.22, depth], {
      at: [x, ceilingY - 0.15, midZ],
      colour: CINE_WOOD,
    })
  }

  // Transverse beams (along X)
  for (let z = zMin + 2.5; z <= zMax - 2.0; z += 5.0) {
    into.box([width, 0.22, 0.18], {
      at: [midX, ceilingY - 0.15, z],
      colour: CINE_WOOD,
    })
  }
}

/** Downlights and ceiling surround speakers installed in coffer bays */
function dressCeilingFixtures(
  into: BanquetDetailBuilder,
  bounds: CeilingBounds,
  ceilingY: number,
): void {
  const { xMin, xMax, zMin, zMax } = bounds
  for (let x = xMin + 5.0; x < xMax - 2.0; x += 5.0) {
    for (let z = zMin + 5.0; z < zMax - 2.0; z += 5.0) {
      // Recessed spotlight fixture
      into.cylinder(
        { radius: 0.14, height: 0.04, sides: 10 },
        { at: [x, ceilingY - 0.09, z], colour: 0x1f1f22 },
      )
      into.cylinder(
        { radius: 0.09, height: 0.02, sides: 10 },
        { at: [x, ceilingY - 0.08, z], colour: 0xfff2cc, glow: true },
      )
      // Dolby Atmos surround ceiling speaker pod
      into.box([0.34, 0.12, 0.34], {
        at: [x - 1.8, ceilingY - 0.1, z - 1.8],
        colour: CINE_SPEAKER_BLACK,
      })
    }
  }
}

/** Full concourse ceiling with coffered beams, HVAC ducting and luminaires */
export function dressConcourseCeiling(
  into: BanquetDetailBuilder,
  bounds: CeilingBounds,
  ceilingY: number,
): void {
  dressCofferBeams(into, bounds, ceilingY)
  dressCeilingFixtures(into, bounds, ceilingY)

  // Suspended longitudinal air ducts
  dressCeilingDuct({
    into,
    fromX: bounds.xMin + 1.0,
    toX: bounds.xMax - 1.0,
    z: bounds.zMin + 3.5,
    y: ceilingY - 0.55,
  })
  dressCeilingDuct({
    into,
    fromX: bounds.xMin + 1.0,
    toX: bounds.xMax - 1.0,
    z: bounds.zMax - 3.5,
    y: ceilingY - 0.55,
  })
}

/** Suspended illuminated directional box sign */
function dressDirectionalBoxSign(
  into: BanquetDetailBuilder,
  at: [number, number, number],
  accentColour: number,
): void {
  // Suspension rod
  into.cylinder(
    { radius: 0.02, height: 0.8, sides: 6 },
    { at: [at[0], at[1] + 0.45, at[2]], colour: 0x3d434a },
  )
  // Black casing
  into.box([2.8, 0.45, 0.16], { at, colour: CINE_POSTER_FRAME })
  // Backlit sign face
  into.box([2.65, 0.36, 0.18], { at, colour: accentColour, glow: true })
}

/** Suspended directional signage across concourse junctions */
export function dressSuspendedDirectionalSigns(into: BanquetDetailBuilder, ceilingY: number): void {
  const signY = ceilingY - 0.95
  // Over entrance to descending ramp: "SCREENS 1 - 8 ↓"
  dressDirectionalBoxSign(into, [0, signY, 0.5], CINE_NEON_AMBER)
  // Over concourse west: "← FOOD & DRINKS"
  dressDirectionalBoxSign(into, [-9.5, signY, -0.5], CINE_NEON_AMBER)
  // Over concourse east: "TICKETS →"
  dressDirectionalBoxSign(into, [9.5, signY, -0.5], CINE_NEON_BLUE)
}
