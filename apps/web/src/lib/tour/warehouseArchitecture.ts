import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  WAREHOUSE_CRANE_YELLOW,
  WAREHOUSE_HAZARD_BLACK,
  WAREHOUSE_HAZARD_YELLOW,
  WAREHOUSE_NEON_COOL,
  WAREHOUSE_SODIUM_WARM,
  WAREHOUSE_STEEL_DARK,
  WAREHOUSE_STEEL_LIGHT,
  WAREHOUSE_STEEL_PANEL,
} from './warehouseDetailSurface'

export interface WarehouseArchitectureOptions {
  THREE: typeof Three
  into: BanquetDetailBuilder
  floor: number
}

const TRUSS_XS = [-25.0, -10.0, 5.0, 20.0, 35.0, 50.0, 65.0]
const CRANE_ZS = [-33.0, -9.0]
const CRANE_X_MIN = -32.0
const CRANE_X_MAX = 74.0

/** Colossal transverse steel Warren trusses spanning across the 49m width */
function dressRoofTrusses(into: BanquetDetailBuilder, floor: number): void {
  const topY = floor + 11.75
  const bottomY = floor + 10.95
  const midZ = -21.0
  const span = 47.0

  for (const x of TRUSS_XS) {
    // Top and bottom chords spanning the full width
    into.box([0.35, 0.22, span], { at: [x, topY, midZ], colour: WAREHOUSE_STEEL_DARK })
    into.box([0.35, 0.22, span], { at: [x, bottomY, midZ], colour: WAREHOUSE_STEEL_DARK })

    // Diagonal and vertical truss web members
    const steps = 10
    const stepZ = span / steps
    for (let i = 0; i < steps; i++) {
      const zPos = midZ - span / 2 + (i + 0.5) * stepZ
      into.box([0.22, 0.75, 0.22], {
        at: [x, (topY + bottomY) / 2, zPos],
        colour: WAREHOUSE_STEEL_PANEL,
      })
    }
  }

  // Longitudinal purlins connecting the trusses
  const purlinZs = [-42.0, -31.0, -21.0, -11.0, 0.0]
  for (const z of purlinZs) {
    into.box([102.0, 0.18, 0.25], { at: [20.0, topY + 0.12, z], colour: WAREHOUSE_STEEL_PANEL })
  }
}

/** Dual longitudinal overhead gantry crane runways with motorized hoist trolleys */
function dressCraneRunways(into: BanquetDetailBuilder, floor: number): void {
  const railY = floor + 10.35
  const length = CRANE_X_MAX - CRANE_X_MIN
  const midX = (CRANE_X_MIN + CRANE_X_MAX) / 2

  for (const z of CRANE_ZS) {
    // Runway I-beam in high-visibility safety yellow
    into.box([length, 0.35, 0.45], { at: [midX, railY, z], colour: WAREHOUSE_CRANE_YELLOW })
    into.box([length, 0.08, 0.65], { at: [midX, railY - 0.2, z], colour: WAREHOUSE_STEEL_DARK })

    // Runway support brackets bolted under trusses
    for (const x of TRUSS_XS) {
      into.box([0.5, 0.6, 0.5], { at: [x, railY + 0.45, z], colour: WAREHOUSE_STEEL_DARK })
    }
  }

  // Stationed hoist trolleys
  const trolleyXs = [-5.0, 42.0]
  for (let i = 0; i < trolleyXs.length; i++) {
    const tx = trolleyXs[i]
    const tz = CRANE_ZS[i % CRANE_ZS.length]

    // Trolley body
    into.box([2.4, 0.65, 1.4], { at: [tx, railY - 0.4, tz], colour: WAREHOUSE_CRANE_YELLOW })
    into.box([2.45, 0.12, 1.45], { at: [tx, railY - 0.15, tz], colour: WAREHOUSE_HAZARD_BLACK })

    // Wire rope hoist drum and cable
    into.cylinder(
      { radius: 0.3, height: 1.1 },
      { at: [tx, railY - 0.85, tz], colour: WAREHOUSE_STEEL_DARK },
    )
    into.cylinder(
      { radius: 0.035, height: 2.4 },
      { at: [tx, railY - 2.1, tz], colour: WAREHOUSE_STEEL_LIGHT },
    )

    // Forged steel crane hook block
    into.box([0.5, 0.65, 0.4], { at: [tx, railY - 3.4, tz], colour: WAREHOUSE_HAZARD_YELLOW })
    into.cylinder(
      { radius: 0.12, height: 0.4 },
      { at: [tx, railY - 3.8, tz], colour: WAREHOUSE_STEEL_DARK },
    )
  }
}

/** Heavy riveted steel structural columns and corner reinforcements */
function dressStructuralColumns(into: BanquetDetailBuilder, floor: number): void {
  const colY = floor + 6.0
  const colH = 12.0
  const columnPositions: [number, number][] = [
    [-34.0, -44.0],
    [-34.0, 2.0],
    [76.0, -44.0],
    [76.0, 2.0],
    [-10.0, -44.0],
    [20.0, -44.0],
    [50.0, -44.0],
    [-10.0, 2.0],
    [46.0, 2.0],
  ]

  for (const [cx, cz] of columnPositions) {
    // Heavy steel column shaft
    into.box([0.9, colH, 0.9], { at: [cx, colY, cz], colour: WAREHOUSE_STEEL_DARK })

    // Protective reinforced base sleeve (+1.8m) against forklift collision
    into.box([1.15, 1.8, 1.15], { at: [cx, floor + 0.9, cz], colour: WAREHOUSE_STEEL_PANEL })

    // Safety yellow and black chevron band
    into.box([1.18, 0.25, 1.18], { at: [cx, floor + 1.7, cz], colour: WAREHOUSE_HAZARD_YELLOW })
    into.box([1.18, 0.25, 1.18], { at: [cx, floor + 1.45, cz], colour: WAREHOUSE_HAZARD_BLACK })
  }
}

/** High-bay industrial sodium vapor lamps and LED fixtures */
function dressHighBayLighting(into: BanquetDetailBuilder, floor: number): void {
  const lightY = floor + 10.6
  const lightRows = [-36.0, -24.0, -12.0, -1.0]

  for (const x of TRUSS_XS) {
    for (const z of lightRows) {
      // Bell-shaped high-bay fixture reflector
      into.cylinder(
        { radius: 0.45, height: 0.35 },
        { at: [x, lightY, z], colour: WAREHOUSE_STEEL_LIGHT },
      )

      // Sodium vapor bulb lens with warm glow
      into.sphere([0.22, 0.22, 0.22], {
        at: [x, lightY - 0.2, z],
        colour: WAREHOUSE_SODIUM_WARM,
        glow: true,
      })
    }
  }

  // Neon strip lights along main aisles
  for (const x of [-20.0, 10.0, 40.0, 65.0]) {
    into.box([0.15, 0.08, 12.0], { at: [x, lightY + 0.1, -21.0], colour: WAREHOUSE_NEON_COOL })
  }
}

/** Industrial ventilation ducts, high-voltage conduit trays and fire sprinkler piping */
function dressTechnicalConduits(into: BanquetDetailBuilder, floor: number): void {
  const ductY = floor + 11.2

  // Giant galvanised spiral HVAC trunk along south wall
  into.cylinder(
    { radius: 0.65, height: 104.0 },
    { at: [21.0, ductY, -43.5], colour: WAREHOUSE_STEEL_LIGHT },
  )

  // Fire-suppression red sprinkler main line along the central axis
  into.cylinder(
    { radius: 0.12, height: 104.0 },
    { at: [21.0, floor + 10.8, -21.0], colour: 0x9b1b1b },
  )

  // Cable trays suspended below trusses
  into.box([104.0, 0.12, 0.6], { at: [21.0, floor + 10.6, -30.0], colour: WAREHOUSE_STEEL_PANEL })
}

/** Complete ensemble of high-bay warehouse architecture */
export function dressWarehouseArchitecture(options: WarehouseArchitectureOptions): void {
  const { into, floor } = options
  dressRoofTrusses(into, floor)
  dressCraneRunways(into, floor)
  dressStructuralColumns(into, floor)
  dressHighBayLighting(into, floor)
  dressTechnicalConduits(into, floor)
}
