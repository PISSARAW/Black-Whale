import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  WAREHOUSE_BLOOD,
  WAREHOUSE_CONCRETE_DECK,
  WAREHOUSE_CONCRETE_LIGHT,
  WAREHOUSE_HAZARD_BLACK,
  WAREHOUSE_HAZARD_YELLOW,
  WAREHOUSE_PORTAL_CORE,
  WAREHOUSE_STEEL_DARK,
  WAREHOUSE_STEEL_PANEL,
} from './warehouseDetailSurface'

export interface WarehouseFloorOptions {
  into: BanquetDetailBuilder
  floor: number
}

/** Dressed concrete expansion joints dividing the 112m slab into manageable bays */
function dressExpansionJoints(into: BanquetDetailBuilder, floor: number): void {
  const jointY = floor + 0.015

  // Transverse expansion joint lines
  for (const x of [-20.0, -5.0, 10.0, 25.0, 40.0, 55.0, 70.0]) {
    into.box([0.08, 0.01, 47.0], { at: [x, jointY, -21.0], colour: WAREHOUSE_CONCRETE_LIGHT })
  }

  // Longitudinal expansion joint lines
  for (const z of [-36.0, -26.0, -16.0, -6.0]) {
    into.box([108.0, 0.01, 0.08], { at: [21.0, jointY, z], colour: WAREHOUSE_CONCRETE_LIGHT })
  }
}

/** High-durability diamond steel plates installed at heavy forklift turning nodes */
function dressSteelDeckPlates(into: BanquetDetailBuilder, floor: number): void {
  const plateY = floor + 0.02
  const nodes: [number, number][] = [
    [21.0, 1.5], // Freight entrance threshold
    [-17.5, -33.0],
    [4.5, -33.0],
    [26.5, -33.0],
    [48.5, -33.0],
    [-17.5, -9.0],
    [4.5, -9.0],
    [26.5, -9.0],
    [48.5, -9.0],
  ]

  for (const [nx, nz] of nodes) {
    into.box([4.2, 0.015, 3.2], { at: [nx, plateY, nz], colour: WAREHOUSE_STEEL_PANEL })
    into.box([4.4, 0.01, 0.12], {
      at: [nx, plateY + 0.005, nz - 1.6],
      colour: WAREHOUSE_STEEL_DARK,
    })
    into.box([4.4, 0.01, 0.12], {
      at: [nx, plateY + 0.005, nz + 1.6],
      colour: WAREHOUSE_STEEL_DARK,
    })
  }
}

/** High-visibility safety markings: traffic lanes, bay boundaries, chevron zones */
function dressTrafficMarkings(into: BanquetDetailBuilder, floor: number): void {
  const markY = floor + 0.025

  // Main east-west forklift corridor safety lane lines (z = -33 and z = -9)
  for (const z of [-33.0, -9.0]) {
    into.box([104.0, 0.008, 0.22], { at: [21.0, markY, z - 2.8], colour: WAREHOUSE_HAZARD_YELLOW })
    into.box([104.0, 0.008, 0.22], { at: [21.0, markY, z + 2.8], colour: WAREHOUSE_HAZARD_YELLOW })
  }

  // North-south central thoroughfare from freight entrance
  into.box([0.22, 0.008, 42.0], { at: [19.0, markY, -19.5], colour: WAREHOUSE_HAZARD_YELLOW })
  into.box([0.22, 0.008, 42.0], { at: [23.0, markY, -19.5], colour: WAREHOUSE_HAZARD_YELLOW })

  // Chevron hazard buffer around the freight entrance (x = 21, z = 1.5)
  const chevrons = 6
  for (let i = 0; i < chevrons; i++) {
    const cx = 17.5 + i * 1.4
    const cz = 2.4
    const colour = i % 2 === 0 ? WAREHOUSE_HAZARD_YELLOW : WAREHOUSE_HAZARD_BLACK
    into.box([1.1, 0.01, 1.8], { at: [cx, markY + 0.002, cz], colour })
  }

  // Storage bay boundary stencils along the 8 columns
  for (let col = 0; col < 8; col++) {
    const bx = -17.5 + col * 11.0
    // Front and rear yellow stop limits
    into.box([7.2, 0.008, 0.18], { at: [bx, markY, -42.0], colour: WAREHOUSE_HAZARD_YELLOW })
    into.box([7.2, 0.008, 0.18], { at: [bx, markY, -2.5], colour: WAREHOUSE_HAZARD_YELLOW })
    // Stenciled bay ID marker block
    into.box([1.8, 0.01, 0.6], { at: [bx, markY + 0.002, -2.2], colour: WAREHOUSE_CONCRETE_DECK })
    into.box([1.4, 0.012, 0.35], { at: [bx, markY + 0.004, -2.2], colour: WAREHOUSE_HAZARD_YELLOW })
  }
}

/** Chapter 378 & 380: The blood pool and survey cut markings from Luini's assault */
function dressLuiniIncidentTraces(into: BanquetDetailBuilder, floor: number): void {
  const traceY = floor + 0.028

  // Dark dried blood pool near guard post 2 (where the Cha-R escort was felled)
  into.box([1.6, 0.005, 1.2], { at: [23.5, traceY, 1.1], colour: WAREHOUSE_BLOOD })
  into.sphere([0.5, 0.008, 0.4], { at: [24.1, traceY + 0.002, 0.9], colour: WAREHOUSE_BLOOD })
  into.sphere([0.3, 0.008, 0.25], { at: [22.8, traceY + 0.002, 1.4], colour: WAREHOUSE_BLOOD })

  // Doorway measurement survey markings: incision lines on floor where Luini calibrated the portal
  into.box([2.4, 0.008, 0.04], { at: [21.0, traceY, 2.9], colour: WAREHOUSE_PORTAL_CORE })
  into.box([0.04, 0.008, 0.8], { at: [19.8, traceY, 2.9], colour: WAREHOUSE_PORTAL_CORE })
  into.box([0.04, 0.008, 0.8], { at: [22.2, traceY, 2.9], colour: WAREHOUSE_PORTAL_CORE })
}

/** Complete dressed floor slab with joints, steel plates, hazard striping, and incident traces */
export function dressWarehouseFloor(options: WarehouseFloorOptions): void {
  const { into, floor } = options
  dressExpansionJoints(into, floor)
  dressSteelDeckPlates(into, floor)
  dressTrafficMarkings(into, floor)
  dressLuiniIncidentTraces(into, floor)
}
