import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  HANGAR_BEACON_AMBER,
  HANGAR_CRANE_YELLOW,
  HANGAR_DIFFUSER_WARM,
  HANGAR_HAZARD_BLACK,
  HANGAR_HAZARD_YELLOW,
  HANGAR_RUST_ORANGE,
  HANGAR_STEEL_DARK,
  HANGAR_STEEL_LIGHT,
  HANGAR_STEEL_PANEL,
} from './hangarEntranceDetailSurface'

export interface HangarArchitectureOptions {
  THREE: typeof Three
  into: BanquetDetailBuilder
  floor: number
}

/** Transverse heavy structural I-beams and gusset stiffeners under the 4.5m ceiling */
function dressCeilingBeams(into: BanquetDetailBuilder, floor: number): void {
  const beamY = floor + 4.35
  const xs = [-12.0, -6.0, 0.0, 6.0, 12.0]

  for (const x of xs) {
    // Main transverse I-beam web and flanges across the 6.5m depth
    into.box([0.22, 0.3, 6.2], { at: [x, beamY, 0.25], colour: HANGAR_STEEL_DARK })
    into.box([0.42, 0.05, 6.2], { at: [x, beamY - 0.15, 0.25], colour: HANGAR_STEEL_PANEL })
    into.box([0.42, 0.05, 6.2], { at: [x, beamY + 0.15, 0.25], colour: HANGAR_STEEL_PANEL })

    // Corner gusset brackets connecting to north and south walls
    into.box([0.24, 0.45, 0.45], { at: [x, beamY - 0.25, -2.75], colour: HANGAR_STEEL_DARK })
    into.box([0.24, 0.45, 0.45], { at: [x, beamY - 0.25, 3.25], colour: HANGAR_STEEL_DARK })
  }
}

/** 24m overhead crane gantry rail with motorized hoist trolley and forged hook */
function dressCraneGantry(into: BanquetDetailBuilder, floor: number): void {
  const railY = floor + 4.05
  const railZ = -1.5

  // Longitudinal crane runway rail in high-visibility safety yellow
  into.box([24.0, 0.25, 0.35], { at: [0.0, railY, railZ], colour: HANGAR_CRANE_YELLOW })
  into.box([24.0, 0.04, 0.5], { at: [0.0, railY - 0.13, railZ], colour: HANGAR_STEEL_DARK })

  // Support hanger brackets bolted to ceiling beams
  for (const x of [-12.0, -6.0, 0.0, 6.0, 12.0]) {
    into.box([0.3, 0.25, 0.4], { at: [x, railY + 0.2, railZ], colour: HANGAR_STEEL_PANEL })
  }

  // Motorized crane hoist trolley stationed at x = -1.5
  const tx = -1.5
  into.box([1.4, 0.4, 0.9], { at: [tx, railY - 0.3, railZ], colour: HANGAR_CRANE_YELLOW })
  into.box([1.45, 0.08, 0.92], { at: [tx, railY - 0.15, railZ], colour: HANGAR_HAZARD_BLACK })
  // Hoist drum and cable
  into.cylinder(
    { radius: 0.18, height: 0.6 },
    { at: [tx, railY - 0.55, railZ], colour: HANGAR_STEEL_DARK },
  )
  into.cylinder(
    { radius: 0.02, height: 1.2 },
    { at: [tx, railY - 1.2, railZ], colour: HANGAR_STEEL_LIGHT },
  )
  // Heavy forged crane hook block
  into.box([0.3, 0.4, 0.25], { at: [tx, railY - 1.9, railZ], colour: HANGAR_HAZARD_YELLOW })
  into.cylinder(
    { radius: 0.08, height: 0.25 },
    { at: [tx, railY - 2.15, railZ], colour: HANGAR_STEEL_DARK },
  )
}

/** Massive structural columns and corner reinforcements */
function dressStructuralColumns(into: BanquetDetailBuilder, floor: number): void {
  const colY = floor + 2.25
  const colH = 4.5
  const corners: [number, number][] = [
    [-13.6, -2.6],
    [-13.6, 3.1],
    [13.6, -2.6],
    [13.6, 3.1],
  ]

  for (const [cx, cz] of corners) {
    // Heavy steel column shaft
    into.box([0.7, colH, 0.7], { at: [cx, colY, cz], colour: HANGAR_STEEL_DARK })
    // Diamond-plate protective base sleeve (+1.2m)
    into.box([0.85, 1.2, 0.85], { at: [cx, floor + 0.6, cz], colour: HANGAR_STEEL_PANEL })
    // Yellow hazard warning band on base
    into.box([0.87, 0.15, 0.87], { at: [cx, floor + 1.15, cz], colour: HANGAR_HAZARD_YELLOW })
  }
}

/** Industrial ventilation ducts, high-voltage cable trays and piping manifolds */
function dressIndustrialConduits(into: BanquetDetailBuilder, floor: number): void {
  const ductY = floor + 4.1
  const ductZ = 3.0

  // Giant galvanised ventilation trunk along south perimeter
  into.box([26.0, 0.5, 0.6], { at: [0.0, ductY, ductZ], colour: HANGAR_STEEL_LIGHT })
  // Flange bands on duct
  for (let x = -12.0; x <= 12.0; x += 3.0) {
    into.box([0.08, 0.56, 0.66], { at: [x, ductY, ductZ], colour: HANGAR_STEEL_PANEL })
  }

  // Cable tray suspension rack along east wall
  into.box([0.25, 0.1, 5.8], { at: [13.7, floor + 3.6, 0.25], colour: HANGAR_STEEL_DARK })
  // High-pressure red and yellow pipeline runs along west wall
  into.cylinder(
    { radius: 0.06, height: 5.6 },
    {
      at: [-13.7, floor + 2.8, 0.25],
      colour: HANGAR_RUST_ORANGE,
      rotation: [Math.PI / 2, 0, 0],
    },
  )
  into.cylinder(
    { radius: 0.04, height: 5.6 },
    {
      at: [-13.7, floor + 3.0, 0.25],
      colour: HANGAR_HAZARD_YELLOW,
      rotation: [Math.PI / 2, 0, 0],
    },
  )
}

/** Heavy-duty vapor-tight industrial cage lighting across the bay */
function dressHangarLighting(into: BanquetDetailBuilder, floor: number): void {
  const lightY = floor + 4.15
  const positions: [number, number][] = [
    [-9.0, 0.5],
    [-3.0, 0.5],
    [3.0, 0.5],
    [9.0, 0.5],
    [-6.0, -1.8],
    [6.0, -1.8],
  ]

  for (const [lx, lz] of positions) {
    // Mounting base and conduit junction box
    into.box([0.25, 0.1, 0.25], { at: [lx, lightY + 0.1, lz], colour: HANGAR_STEEL_DARK })
    // Vapor-tight fixture cage
    into.cylinder(
      { radius: 0.14, height: 0.22 },
      { at: [lx, lightY - 0.06, lz], colour: HANGAR_STEEL_LIGHT },
    )
    // High-output incandescent diffuser
    into.sphere([0.1, 0.12, 0.1], {
      at: [lx, lightY - 0.07, lz],
      colour: HANGAR_DIFFUSER_WARM,
      glow: true,
    })
  }

  // Emergency exit indicator beacon over south doorway
  into.box([0.8, 0.3, 0.08], { at: [0.0, floor + 3.8, 3.4], colour: HANGAR_STEEL_DARK })
  into.sphere([0.08, 0.08, 0.04], {
    at: [0.0, floor + 3.8, 3.45],
    colour: HANGAR_BEACON_AMBER,
    glow: true,
  })
}

/** Complete industrial architectural envelope of Tier 5 Hangar Entrance */
export function dressHangarEntranceArchitecture(options: HangarArchitectureOptions): void {
  const { into, floor } = options
  dressCeilingBeams(into, floor)
  dressCraneGantry(into, floor)
  dressStructuralColumns(into, floor)
  dressIndustrialConduits(into, floor)
  dressHangarLighting(into, floor)
}
