import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallBays, wallPoint, type BanquetWallRun } from './banquetWallLayout'
import {
  BRASS_MOLDING,
  CABLE_BLACK,
  CABLE_ORANGE,
  DUCT_FLANGE,
  DUCT_GALVANIZED,
  EXTINGUISHER_RED,
  FLOOR_COMPUTER_TILE,
  FLOOR_RUBBER_RUNNER,
  FLOOR_SEAM_WELD,
  FLOOR_STEEL_PLATE,
  FLOOR_TILE_GRID,
  HAZARD_BLACK,
  HAZARD_YELLOW,
  LED_ONLINE_GREEN,
  PANEL_ENCLOSURE,
  PANEL_SWITCH,
  PARQUET_MAHOGANY,
  SPOTLIGHT_COOL,
  SPOTLIGHT_WARM,
  STEEL_BRUSHED,
  STEEL_DARK,
  STEEL_GRAPHITE,
  STEEL_I_BEAM,
  TRAY_GALVANIZED,
  WALL_KICKPLATE_STEEL,
  WALL_STIFFENER_STEEL,
} from './chaROfficeDetailSurface'
import type { TierPlan } from './blueprint'
import type { Space } from './types'

export interface RoomBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

interface CeilingContext {
  into: BanquetDetailBuilder
  floor: number
  ceilingHeight: number
  bounds: RoomBounds
}

interface WallContext {
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

function ceilingDucts(into: BanquetDetailBuilder, topY: number, bounds: RoomBounds): void {
  const { minX, maxX, minZ, maxZ } = bounds
  const lenX = maxX - minX
  const midZ = (minZ + maxZ) / 2

  // Massive main galvanized ventilation trunk
  into.box([lenX - 1.2, 0.44, 0.58], {
    at: [(minX + maxX) / 2, topY - 0.26, midZ],
    colour: DUCT_GALVANIZED,
  })
  // Flanged connecting rings and suspension rods
  const step = 3.2
  for (let x = minX + 2.0; x < maxX - 1.0; x += step) {
    into.box([0.08, 0.52, 0.66], { at: [x, topY - 0.26, midZ], colour: DUCT_FLANGE })
    into.cylinder(
      { radius: 0.012, height: 0.35, sides: 6 },
      { at: [x, topY - 0.1, midZ - 0.25], colour: STEEL_BRUSHED },
    )
    into.cylinder(
      { radius: 0.012, height: 0.35, sides: 6 },
      { at: [x, topY - 0.1, midZ + 0.25], colour: STEEL_BRUSHED },
    )
  }
}

function cableTrays(into: BanquetDetailBuilder, topY: number, bounds: RoomBounds): void {
  const { minX, maxX, minZ, maxZ } = bounds
  const lenX = maxX - minX
  const trayZ = (minZ + maxZ) / 2 + 1.8

  // Perforated cable tray
  into.box([lenX - 2.0, 0.06, 0.36], {
    at: [(minX + maxX) / 2, topY - 0.18, trayZ],
    colour: TRAY_GALVANIZED,
  })
  // Black and orange high-voltage cable runs
  into.box([lenX - 2.2, 0.04, 0.08], {
    at: [(minX + maxX) / 2, topY - 0.14, trayZ - 0.08],
    colour: CABLE_BLACK,
  })
  into.box([lenX - 2.2, 0.04, 0.06], {
    at: [(minX + maxX) / 2, topY - 0.14, trayZ + 0.06],
    colour: CABLE_ORANGE,
  })
}

/** Heavy industrial ceiling with structural I-beams, ducts, cable trays and caged lamps. */
export function dressIndustrialCeiling(context: CeilingContext): void {
  const { into, floor, ceilingHeight, bounds } = context
  const { minX, maxX, minZ, maxZ } = bounds
  const topY = floor + ceilingHeight
  const lenZ = maxZ - minZ

  // Transverse structural steel I-beams spaced every 3.6m
  const beamPitch = 3.6
  for (let x = minX + 1.8; x < maxX; x += beamPitch) {
    into.box([0.18, 0.36, lenZ - 0.8], {
      at: [x, topY - 0.18, (minZ + maxZ) / 2],
      colour: STEEL_I_BEAM,
    })
    into.box([0.32, 0.04, lenZ - 0.8], {
      at: [x, topY - 0.35, (minZ + maxZ) / 2],
      colour: STEEL_I_BEAM,
    })
    // Gusset plates at beam ends
    into.box([0.22, 0.24, 0.08], { at: [x, topY - 0.22, minZ + 0.45], colour: STEEL_DARK })
    into.box([0.22, 0.24, 0.08], { at: [x, topY - 0.22, maxZ - 0.45], colour: STEEL_DARK })
  }

  ceilingDucts(into, topY, bounds)
  cableTrays(into, topY, bounds)

  // Industrial fluorescent light fixtures with protective wire cages
  for (let x = minX + 3.2; x < maxX - 2.0; x += 4.5) {
    for (const zOff of [-1.5, 1.5]) {
      const lz = (minZ + maxZ) / 2 + zOff
      into.box([1.4, 0.1, 0.36], { at: [x, topY - 0.08, lz], colour: STEEL_GRAPHITE })
      into.box([1.25, 0.03, 0.26], { at: [x, topY - 0.13, lz], colour: SPOTLIGHT_WARM, glow: true })
      into.box([1.3, 0.02, 0.3], { at: [x, topY - 0.16, lz], colour: STEEL_DARK })
    }
  }
}

/** Suspended acoustic tile T-bar ceiling grid for the CCTV monitor room. */
export function dressTechnicalCeiling(context: CeilingContext): void {
  const { into, floor, ceilingHeight, bounds } = context
  const { minX, maxX, minZ, maxZ } = bounds
  const topY = floor + ceilingHeight

  // Recessed modular fluorescent troffers
  for (let x = minX + 2.5; x < maxX - 2.0; x += 3.6) {
    for (let z = minZ + 2.5; z < maxZ - 2.0; z += 4.2) {
      into.box([1.4, 0.08, 0.7], { at: [x, topY - 0.05, z], colour: STEEL_DARK })
      into.box([1.24, 0.02, 0.58], { at: [x, topY - 0.08, z], colour: SPOTLIGHT_COOL, glow: true })
    }
  }

  // Overhead sprinkler heads & smoke detectors
  for (let x = minX + 3.5; x < maxX - 2.5; x += 5.5) {
    into.cylinder(
      { radius: 0.06, height: 0.04, sides: 12 },
      { at: [x, topY - 0.03, (minZ + maxZ) / 2], colour: STEEL_BRUSHED },
    )
    into.sphere([0.015, 0.015, 0.015], {
      at: [x, topY - 0.05, (minZ + maxZ) / 2],
      colour: EXTINGUISHER_RED,
    })
  }
}

/** Floor of the Main Office: steel perimeter plating with inlaid dark mahogany parquet. */
export function dressMainOfficeFloor(options: { into: BanquetDetailBuilder; floor: number }): void {
  const { into, floor } = options

  // Perimeter steel deck plating
  into.box([17.6, 0.03, 14.6], { at: [-11.25, floor + 0.015, -4.25], colour: FLOOR_STEEL_PLATE })

  // Welded seam grid lines across the steel plating
  for (let x = -19.0; x <= -3.0; x += 3.0) {
    into.box([0.04, 0.035, 14.4], { at: [x, floor + 0.018, -4.25], colour: FLOOR_SEAM_WELD })
  }

  // Central dark mahogany parquet inlay under the executive command zone
  into.box([9.2, 0.035, 8.4], { at: [-11.0, floor + 0.02, -4.5], colour: PARQUET_MAHOGANY })
  // Polished brass perimeter transition moulding
  into.box([9.36, 0.04, 0.08], { at: [-11.0, floor + 0.025, -8.7], colour: BRASS_MOLDING })
  into.box([9.36, 0.04, 0.08], { at: [-11.0, floor + 0.025, -0.3], colour: BRASS_MOLDING })
  into.box([0.08, 0.04, 8.48], { at: [-15.64, floor + 0.025, -4.5], colour: BRASS_MOLDING })
  into.box([0.08, 0.04, 8.48], { at: [-6.36, floor + 0.025, -4.5], colour: BRASS_MOLDING })
}

/** Floor of the CCTV Monitor Room: raised anti-static technical computer tiles. */
export function dressMonitorRoomFloor(options: {
  into: BanquetDetailBuilder
  floor: number
}): void {
  const { into, floor } = options

  // Raised computer floor base
  into.box([20.6, 0.04, 23.0], { at: [9.75, floor + 0.02, 0], colour: FLOOR_COMPUTER_TILE })

  // 60x60cm floor tile joint grid
  for (let x = 0.5; x <= 19.5; x += 2.4) {
    into.box([0.03, 0.045, 22.8], { at: [x, floor + 0.025, 0], colour: FLOOR_TILE_GRID })
  }
  for (let z = -10.5; z <= 10.5; z += 2.4) {
    into.box([20.4, 0.045, 0.03], { at: [9.75, floor + 0.025, z], colour: FLOOR_TILE_GRID })
  }

  // Yellow & black hazard perimeter stripe in front of CCTV rack
  into.box([9.8, 0.045, 0.18], { at: [9.75, floor + 0.026, -9.2], colour: HAZARD_YELLOW })
  into.box([9.8, 0.045, 0.06], { at: [9.75, floor + 0.027, -9.2], colour: HAZARD_BLACK })
}

/** Floor of the Bedroom: industrial plate with heavy rubber anti-fatigue runner. */
export function dressBedroomFloor(options: { into: BanquetDetailBuilder; floor: number }): void {
  const { into, floor } = options

  into.box([17.6, 0.03, 6.6], { at: [-11.25, floor + 0.015, 8.25], colour: FLOOR_STEEL_PLATE })
  // Anti-fatigue runner along the bunks and storage
  into.box([15.0, 0.035, 1.6], { at: [-11.25, floor + 0.02, 8.25], colour: FLOOR_RUBBER_RUNNER })
}

function wallEquipment(
  into: BanquetDetailBuilder,
  run: BanquetWallRun,
  options: { along: number; floor: number },
): void {
  const { along, floor } = options

  // Industrial wall power distribution panel
  into.box([0.48, 0.65, 0.14], {
    at: wallPoint(run, { along, y: floor + 1.5, inset: 0.07 }),
    rotation: [0, run.angle, 0],
    colour: PANEL_ENCLOSURE,
  })
  into.box([0.08, 0.18, 0.06], {
    at: wallPoint(run, { along: along + 0.16, y: floor + 1.5, inset: 0.16 }),
    rotation: [0, run.angle, 0],
    colour: PANEL_SWITCH,
  })
  into.sphere([0.012, 0.012, 0.012], {
    at: wallPoint(run, { along: along - 0.16, y: floor + 1.72, inset: 0.15 }),
    colour: LED_ONLINE_GREEN,
    glow: true,
  })

  // Wall-mounted fire extinguisher & pressure gauge
  into.cylinder(
    { radius: 0.08, height: 0.48, sides: 12 },
    {
      at: wallPoint(run, { along: along + 1.2, y: floor + 1.15, inset: 0.1 }),
      colour: EXTINGUISHER_RED,
    },
  )
  into.sphere([0.02, 0.02, 0.02], {
    at: wallPoint(run, { along: along + 1.2, y: floor + 1.42, inset: 0.1 }),
    colour: BRASS_MOLDING,
  })
}

/** Dresses all perimeter walls of a Cha-R room with steel kickplates, stiffeners and equipment. */
export function dressOfficeWallRuns(context: WallContext): void {
  const { into, plan, space } = context
  const floor = 0 // Relative room floor

  for (const run of banquetWallRuns(plan, space)) {
    // Heavy continuous bottom kickplate
    into.box([run.length, 0.16, 0.06], {
      at: wallPoint(run, { along: run.length / 2, y: floor + 0.08, inset: 0.03 }),
      rotation: [0, run.angle, 0],
      colour: WALL_KICKPLATE_STEEL,
    })

    // Mid-level steel wainscot bumper rail
    into.box([run.length, 0.06, 0.05], {
      at: wallPoint(run, { along: run.length / 2, y: floor + 1.0, inset: 0.025 }),
      rotation: [0, run.angle, 0],
      colour: STEEL_GRAPHITE,
    })

    // Vertical structural stiffener columns every bay
    const bays = wallBays(run)
    for (const bay of bays) {
      into.box([0.14, 3.8, 0.08], {
        at: wallPoint(run, { along: bay.along, y: floor + 1.9, inset: 0.04 }),
        rotation: [0, run.angle, 0],
        colour: WALL_STIFFENER_STEEL,
      })
      // Vertical conduit line running to ceiling
      into.cylinder(
        { radius: 0.016, height: 3.8, sides: 8 },
        {
          at: wallPoint(run, { along: bay.along + 0.12, y: floor + 1.9, inset: 0.05 }),
          colour: STEEL_BRUSHED,
        },
      )
    }

    // Electrical panel and extinguisher on walls longer than 7m
    if (run.length > 7.0) {
      wallEquipment(into, run, { along: run.length * 0.35, floor })
    }
  }
}
