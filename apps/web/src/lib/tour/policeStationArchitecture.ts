import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import {
  POLICE_BRASS,
  POLICE_GLASS,
  POLICE_GOLD,
  POLICE_GRANITE,
  POLICE_GRANITE_DARK,
  POLICE_LIGHT_DIFFUSER,
  POLICE_METAL,
  POLICE_NAVY,
  POLICE_OAK,
  POLICE_STONE,
} from './policeStationDetailSurface'
import type { Space } from './types'

export interface PoliceArchitectureOptions {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

interface ColonnadeOptions {
  into: BanquetDetailBuilder
  floor: number
  ceiling: number
}

interface GalleryOptions {
  into: BanquetDetailBuilder
  floor: number
}

const PORT_COLUMN_Y = [-7.84, -4.74, -1.63, 1.47] as const
const STARBOARD_COLUMN_Y = [-5.5, -3.0, -0.5, 2.0] as const
const GALLERY_LEVELS = [3.4, 6.8, 10.2, 13.6] as const

/** Colonnade of 8 monumental 16m pillars with classical sconces supporting architrave */
function dressPoliceColonnade(options: ColonnadeOptions): void {
  const { into, floor, ceiling } = options
  const columnPositions: [number, number][] = [
    ...PORT_COLUMN_Y.map((y): [number, number] => [-5.4, y]),
    ...STARBOARD_COLUMN_Y.map((y): [number, number] => [5.4, y]),
  ]

  for (const [cx, cy] of columnPositions) {
    // Stepped plinth at base
    into.box([2.0, 0.4, 2.0], { at: [cx, floor + 0.2, cy], colour: POLICE_GRANITE_DARK })
    into.box([1.8, 0.4, 1.8], { at: [cx, floor + 0.6, cy], colour: POLICE_STONE })

    // Column shaft with corner recesses
    const shaftH = ceiling - 1.8
    into.box([1.5, shaftH, 1.5], { at: [cx, floor + 0.8 + shaftH / 2, cy], colour: POLICE_GRANITE })

    // Capital and entablature block
    into.box([1.8, 0.5, 1.8], { at: [cx, floor + ceiling - 0.75, cy], colour: POLICE_STONE })
    into.box([2.1, 0.5, 2.1], { at: [cx, floor + ceiling - 0.25, cy], colour: POLICE_GRANITE_DARK })

    // Twin-branch brass wall sconces on column face pointing toward atrium center
    const inward = cx > 0 ? -1 : 1
    const sconceX = cx + inward * 0.8
    const sconceY = floor + 3.4
    into.box([0.04, 0.38, 0.18], { at: [sconceX, sconceY, cy], colour: POLICE_BRASS })
    for (const side of [-0.14, 0.14]) {
      into.cylinder({ radius: 0.015, height: 0.18 }, { at: [sconceX + inward * 0.1, sconceY + 0.05, cy + side], colour: POLICE_BRASS })
      into.sphere([0.06, 0.1, 0.06], { at: [sconceX + inward * 0.1, sconceY + 0.16, cy + side], colour: POLICE_LIGHT_DIFFUSER, glow: true })
    }
  }

  // Longitudinal architrave beam connecting column tops
  const beamY = floor + ceiling - 0.2
  into.box([0.9, 0.4, 12.0], { at: [-5.4, beamY, -3.1], colour: POLICE_STONE })
  into.box([0.9, 0.4, 10.5], { at: [5.4, beamY, -1.75], colour: POLICE_STONE })
}

/** Open gallery walkways across 4 levels with railings and office portals */
function dressPoliceGalleries(options: GalleryOptions): void {
  const { into, floor } = options

  for (const baseH of GALLERY_LEVELS) {
    const slabY = floor + baseH

    // Port and starboard gallery slabs
    into.box([3.8, 0.3, 14.6], { at: [-9.0, slabY - 0.15, -2.4], colour: POLICE_GRANITE })
    into.box([3.8, 0.3, 14.6], { at: [9.0, slabY - 0.15, -2.4], colour: POLICE_GRANITE })

    // Cantilever corbels underneath each gallery
    for (let y = -9.0; y <= 4.0; y += 3.25) {
      into.box([0.4, 0.6, 0.5], { at: [-7.3, slabY - 0.45, y], colour: POLICE_STONE })
      into.box([0.4, 0.6, 0.5], { at: [7.3, slabY - 0.45, y], colour: POLICE_STONE })
    }

    // Security balustrades along open edges (x = -7.1 and x = 7.1)
    dressGalleryBalustrade(into, -7.1, slabY)
    dressGalleryBalustrade(into, 7.1, slabY)

    // Office doors along perimeter walls
    dressGalleryOfficeDoors(into, slabY)
  }
}

/** Continuous balustrade with brass handrail and vertical security balusters */
function dressGalleryBalustrade(into: BanquetDetailBuilder, edgeX: number, slabY: number): void {
  into.box([0.08, 0.08, 14.6], { at: [edgeX, slabY + 1.05, -2.4], colour: POLICE_BRASS })
  into.box([0.1, 0.08, 14.6], { at: [edgeX, slabY + 0.04, -2.4], colour: POLICE_METAL })
  into.box([0.04, 0.04, 14.6], { at: [edgeX, slabY + 0.55, -2.4], colour: POLICE_METAL })

  for (let y = -9.5; y <= 4.7; y += 0.48) {
    into.box([0.03, 0.95, 0.03], { at: [edgeX, slabY + 0.55, y], colour: POLICE_METAL })
  }
}

/** Office portals and lighted transom windows lining the galleries */
function dressGalleryOfficeDoors(into: BanquetDetailBuilder, slabY: number): void {
  for (let y = -8.0; y <= 3.0; y += 3.6) {
    for (const sideX of [-10.9, 10.9]) {
      into.box([0.12, 2.2, 1.1], { at: [sideX, slabY + 1.1, y], colour: POLICE_OAK })
      into.box([0.16, 0.1, 1.3], { at: [sideX, slabY + 2.25, y], colour: POLICE_STONE })
      into.box([0.08, 0.6, 1.1], { at: [sideX, slabY + 2.6, y], colour: POLICE_GLASS })
      into.box([0.02, 0.08, 0.02], { at: [sideX + (sideX > 0 ? -0.07 : 0.07), slabY + 1.1, y + 0.4], colour: POLICE_BRASS })
    }
  }
}

/** Monumental coffered ceiling grid spanning around the central lantern */
function dressPoliceCofferedCeiling(options: ColonnadeOptions): void {
  const { into, floor, ceiling } = options
  const ceilY = floor + ceiling - 0.2

  // Longitudinal primary coffer beams
  for (const bx of [-8.5, -4.5, 4.5, 8.5]) {
    into.box([0.5, 0.4, 14.6], { at: [bx, ceilY, -2.5], colour: POLICE_STONE })
  }

  // Transverse primary coffer beams outside the 12x8m lantern opening
  into.box([21.6, 0.4, 0.5], { at: [0, ceilY, -8.5], colour: POLICE_STONE })
  into.box([21.6, 0.4, 0.5], { at: [0, ceilY, 3.5], colour: POLICE_STONE })

  // High dentil cornice molding running below ceiling perimeter
  const corniceY = floor + ceiling - 0.35
  into.box([21.6, 0.24, 0.25], { at: [0, corniceY, -9.85], colour: POLICE_GRANITE_DARK })
  into.box([21.6, 0.24, 0.25], { at: [0, corniceY, 4.85], colour: POLICE_GRANITE_DARK })
}

/** Raised central roof lantern (12x8m, 2.5m rise) with trusses, mullions and pendant lamps */
function dressPoliceLantern(options: ColonnadeOptions): void {
  const { into, floor, ceiling } = options
  const lanternY = floor + ceiling

  // Outer framing coffer beams around the 12x8 opening
  into.box([13.0, 0.5, 0.8], { at: [0, lanternY + 0.25, -6.9], colour: POLICE_STONE })
  into.box([13.0, 0.5, 0.8], { at: [0, lanternY + 0.25, 1.9], colour: POLICE_STONE })
  into.box([0.8, 0.5, 8.8], { at: [-6.4, lanternY + 0.25, -2.5], colour: POLICE_STONE })
  into.box([0.8, 0.5, 8.8], { at: [6.4, lanternY + 0.25, -2.5], colour: POLICE_STONE })

  // Raised lantern clerestory walls and glass panels
  into.box([12.2, 2.3, 0.1], { at: [0, lanternY + 1.35, -6.45], colour: POLICE_GLASS })
  into.box([12.2, 2.3, 0.1], { at: [0, lanternY + 1.35, 1.45], colour: POLICE_GLASS })
  into.box([0.1, 2.3, 8.0], { at: [-6.05, lanternY + 1.35, -2.5], colour: POLICE_GLASS })
  into.box([0.1, 2.3, 8.0], { at: [6.05, lanternY + 1.35, -2.5], colour: POLICE_GLASS })

  // Vertical window mullions on clerestory glass
  for (let x = -4.5; x <= 4.5; x += 1.8) {
    into.box([0.06, 2.3, 0.14], { at: [x, lanternY + 1.35, -6.45], colour: POLICE_METAL })
    into.box([0.06, 2.3, 0.14], { at: [x, lanternY + 1.35, 1.45], colour: POLICE_METAL })
  }

  // Lantern ceiling cap and cross-trusses
  into.box([12.6, 0.3, 8.4], { at: [0, lanternY + 2.6, -2.5], colour: POLICE_GRANITE_DARK })
  into.box([0.2, 0.3, 8.0], { at: [-2.0, lanternY + 2.4, -2.5], colour: POLICE_METAL })
  into.box([0.2, 0.3, 8.0], { at: [2.0, lanternY + 2.4, -2.5], colour: POLICE_METAL })

  // 4 Industrial high-bay pendant chandeliers suspended by steel cables
  const pendantPositions: [number, number][] = [
    [-3.2, -4.8],
    [3.2, -4.8],
    [-3.2, -0.2],
    [3.2, -0.2],
  ]

  for (const [px, pz] of pendantPositions) {
    // Steel suspension cable
    into.cylinder({ radius: 0.015, height: 7.2 }, { at: [px, lanternY + 2.4 - 3.6, pz], colour: POLICE_METAL })
    // Industrial metal bell shade
    into.cylinder({ radius: 0.44, bottom: 0.18, height: 0.36 }, { at: [px, floor + 11.2, pz], colour: POLICE_METAL })
    into.cylinder({ radius: 0.16, height: 0.08 }, { at: [px, floor + 11.42, pz], colour: POLICE_BRASS })
    // Glowing diffuser lamp
    into.sphere([0.34, 0.12, 0.34], { at: [px, floor + 11.08, pz], colour: POLICE_LIGHT_DIFFUSER, glow: true })
  }
}

/** Classical wall moldings, dado rail and fluted pilasters on perimeter walls */
function dressPoliceWallMoldings(into: BanquetDetailBuilder, floor: number): void {
  // Baseboard plinths along north and south walls
  into.box([21.6, 0.35, 0.12], { at: [0, floor + 0.175, -9.9], colour: POLICE_GRANITE_DARK })
  into.box([21.6, 0.35, 0.12], { at: [0, floor + 0.175, 4.9], colour: POLICE_GRANITE_DARK })

  // Chair rail / dado molding along back wall
  into.box([21.6, 0.08, 0.1], { at: [0, floor + 1.1, -9.9], colour: POLICE_STONE })

  // Fluted pilasters on the north perimeter wall
  for (let px = -7.2; px <= 7.2; px += 3.6) {
    into.box([0.5, 3.2, 0.08], { at: [px, floor + 1.7, -9.92], colour: POLICE_STONE })
    into.box([0.62, 0.15, 0.12], { at: [px, floor + 0.075, -9.9], colour: POLICE_GRANITE_DARK })
    into.box([0.58, 0.12, 0.12], { at: [px, floor + 3.25, -9.9], colour: POLICE_STONE })
  }
}

/** Entrance marquee, hanging police signs and security doors */
function dressPoliceMarqueeAndSigns(into: BanquetDetailBuilder, floor: number): void {
  const marqueeY = floor + 4.0

  // Cantilever wrought-iron marquee canopy
  into.box([8.2, 0.12, 1.4], { at: [0, marqueeY + 0.3, 4.3], colour: POLICE_METAL })
  into.box([7.8, 0.05, 1.2], { at: [0, marqueeY + 0.38, 4.3], colour: POLICE_GLASS })

  // Decorative iron support brackets
  into.box([0.08, 0.9, 1.3], { at: [-3.8, marqueeY - 0.2, 4.4], colour: POLICE_METAL })
  into.box([0.08, 0.9, 1.3], { at: [3.8, marqueeY - 0.2, 4.4], colour: POLICE_METAL })

  for (const lx of [-2.4, 0, 2.4]) {
    into.cylinder({ radius: 0.02, height: 0.35 }, { at: [lx, marqueeY + 0.12, 4.2], colour: POLICE_METAL })
    into.box([0.22, 0.28, 0.22], { at: [lx, marqueeY - 0.1, 4.2], colour: POLICE_GOLD })
  }

  // Official hanging signs flanking marquee (sign-port and sign-starboard)
  for (const sx of [-4.6, 4.6]) {
    into.box([1.1, 4.4, 0.12], { at: [sx, floor + 5.2, 4.8], colour: POLICE_NAVY })
    into.box([1.18, 4.48, 0.14], { at: [sx, floor + 5.2, 4.8], colour: POLICE_GOLD })
    into.box([0.8, 0.8, 0.16], { at: [sx, floor + 6.4, 4.8], colour: POLICE_BRASS })
    into.box([0.6, 2.2, 0.15], { at: [sx, floor + 4.6, 4.8], colour: POLICE_GOLD })
  }

  // Double entrance doors with brass handles
  into.box([3.6, 3.4, 0.1], { at: [0, floor + 1.7, 4.95], colour: POLICE_OAK })
  into.box([1.4, 2.2, 0.12], { at: [-0.85, floor + 1.8, 4.95], colour: POLICE_GLASS })
  into.box([1.4, 2.2, 0.12], { at: [0.85, floor + 1.8, 4.95], colour: POLICE_GLASS })
  into.box([0.06, 0.5, 0.15], { at: [-0.15, floor + 1.5, 4.9], colour: POLICE_BRASS })
  into.box([0.06, 0.5, 0.15], { at: [0.15, floor + 1.5, 4.9], colour: POLICE_BRASS })
}

/** Complete architecture of the monumental central police atrium */
export function dressPoliceAtriumArchitecture(options: PoliceArchitectureOptions): void {
  const { into, plan, space } = options
  const floor = floorOf(space, plan.tier)
  const ceiling = ceilingOf(space, plan.tier)

  dressPoliceColonnade({ into, floor, ceiling })
  dressPoliceGalleries({ into, floor })
  dressPoliceCofferedCeiling({ into, floor, ceiling })
  dressPoliceLantern({ into, floor, ceiling })
  dressPoliceWallMoldings(into, floor)
  dressPoliceMarqueeAndSigns(into, floor)
}
