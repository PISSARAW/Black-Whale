import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { WarehouseDetailSurface } from './warehouseDetailSurface'
import {
  WAREHOUSE_ALERT_RED,
  WAREHOUSE_HAZARD_BLACK,
  WAREHOUSE_HAZARD_YELLOW,
  WAREHOUSE_PORTAL_CORE,
  WAREHOUSE_PORTAL_VIOLET,
  WAREHOUSE_STATUS_GREEN,
  WAREHOUSE_STEEL_DARK,
  WAREHOUSE_STEEL_LIGHT,
  WAREHOUSE_STEEL_PANEL,
} from './warehouseDetailSurface'

export interface WarehouseEntranceOptions {
  into: BanquetDetailBuilder
  floor: number
}

/** Chapter 380: Wide-angle CCTV camera installed after loading to watch the single entrance */
export function dressEntranceCamera(surface: WarehouseDetailSurface): void {
  const w = surface.width
  const d = surface.depth
  const h = surface.structure.height

  // Steel mounting base plate bolted into the bulkhead
  surface.box([w * 0.9, 0.08, d * 0.9], [0, h * 0.5, 0], WAREHOUSE_STEEL_DARK)

  // Articulated tubular steel swivel arm angled downward toward the threshold
  surface.cylinder({ radius: 0.04, height: 0.35 }, [0, -0.1, 0], WAREHOUSE_STEEL_LIGHT)

  // Weatherproof CCTV camera housing pointed toward the incoming traffic (z = 0)
  surface.box([0.22, 0.22, 0.45], [0, -0.28, -0.1], WAREHOUSE_STEEL_PANEL)
  // Sunshield / protective top hood
  surface.box([0.26, 0.04, 0.48], [0, -0.16, -0.1], WAREHOUSE_STEEL_DARK)

  // Optical glass lens barrel
  surface.cylinder({ radius: 0.08, height: 0.06 }, [0, -0.28, -0.34], WAREHOUSE_STEEL_DARK)
  surface.sphere([0.06, 0.06, 0.04], [0, -0.28, -0.36], { colour: 0x1a2b3c })

  // Active recording status LED (amber/green dual indicator)
  surface.sphere([0.012, 0.012, 0.012], [0.08, -0.22, -0.33], {
    colour: WAREHOUSE_STATUS_GREEN,
    glow: true,
  })
  surface.sphere([0.012, 0.012, 0.012], [-0.08, -0.22, -0.33], {
    colour: WAREHOUSE_ALERT_RED,
    glow: true,
  })

  // Surface conduit running up to the ceiling cable trays
  surface.cylinder({ radius: 0.02, height: 1.2 }, [0, 0.6, 0.05], WAREHOUSE_STEEL_LIGHT)
}

/** 6m colossal rolling steel freight shutter door at the main access threshold */
function dressFreightRollingShutter(into: BanquetDetailBuilder, floor: number): void {
  const doorX = 21.0
  const doorZ = 3.42
  const doorW = 6.0
  const doorH = 4.8

  // Outer structural steel portal frame architrave
  into.box([doorW + 0.6, doorH + 0.4, 0.35], {
    at: [doorX, floor + doorH / 2, doorZ],
    colour: WAREHOUSE_STEEL_DARK,
  })

  // Overhead roll-up cylinder coil drum housing
  into.cylinder(
    { radius: 0.42, height: doorW + 0.4 },
    { at: [doorX, floor + doorH + 0.4, doorZ], colour: WAREHOUSE_STEEL_PANEL },
  )

  // Segmented corrugated steel shutter curtain (slight opening at bottom for freight clearance)
  into.box([doorW, doorH - 0.4, 0.08], {
    at: [doorX, floor + doorH / 2 + 0.2, doorZ],
    colour: WAREHOUSE_STEEL_PANEL,
  })

  // Yellow and black chevron hazard stripe along the bottom crash bar
  into.box([doorW, 0.25, 0.12], {
    at: [doorX, floor + 0.5, doorZ],
    colour: WAREHOUSE_HAZARD_YELLOW,
  })
  into.box([doorW, 0.12, 0.14], {
    at: [doorX, floor + 0.5, doorZ],
    colour: WAREHOUSE_HAZARD_BLACK,
  })

  // Manual emergency chain hoist loop on right jamb
  into.cylinder(
    { radius: 0.08, height: 3.2 },
    { at: [doorX + doorW / 2 + 0.2, floor + 2.0, doorZ - 0.1], colour: WAREHOUSE_STEEL_LIGHT },
  )
}

/** Chapter 380: The locked back security door that prevented Luini from escaping rearward */
function dressLockedBackDoor(into: BanquetDetailBuilder, floor: number): void {
  const doorX = -34.85
  const doorZ = -21.0
  const doorH = 3.2
  const doorW = 3.4

  // Heavy steel architrave set into west perimeter bulkhead
  into.box([0.18, doorH + 0.2, doorW + 0.2], {
    at: [doorX, floor + doorH / 2, doorZ],
    colour: WAREHOUSE_STEEL_DARK,
  })

  // Pair of plain steel leaves matching the panel's end-of-aisle exit.
  into.box([0.08, doorH, doorW], {
    at: [doorX + 0.04, floor + doorH / 2, doorZ],
    colour: WAREHOUSE_STEEL_PANEL,
  })

  into.box([0.12, doorH, 0.1], {
    at: [doorX + 0.1, floor + doorH / 2, doorZ],
    colour: WAREHOUSE_STEEL_DARK,
  })
  for (const side of [-1, 1]) {
    into.box([0.11, 0.08, doorW * 0.42], {
      at: [doorX + 0.1, floor + 1.15, doorZ + side * doorW * 0.25],
      colour: WAREHOUSE_STEEL_DARK,
    })
  }

  // Heavy slide deadbolt and padlock hasp
  into.box([0.16, 0.12, 0.72], {
    at: [doorX + 0.14, floor + 1.25, doorZ],
    colour: WAREHOUSE_STEEL_LIGHT,
  })
  into.cylinder(
    { radius: 0.03, height: 0.08 },
    { at: [doorX + 0.1, floor + 1.1, doorZ], colour: 0xb58900 },
  )

  // Horizontal bulkhead lamp directly above the doors.
  into.box([0.16, 0.42, 2.4], {
    at: [doorX + 0.12, floor + doorH + 0.75, doorZ],
    colour: WAREHOUSE_STEEL_DARK,
  })
  into.box([0.2, 0.22, 2.05], {
    at: [doorX + 0.19, floor + doorH + 0.75, doorZ],
    colour: 0xe8e3d7,
    glow: true,
  })
}

/** Chapters 378 & 379: Luini's spatial Nen portal opening breached into the wall/ceiling */
function dressLuiniSpatialPortal(into: BanquetDetailBuilder, floor: number): void {
  const portalX = 21.0
  const portalY = floor + 3.8
  const portalZ = 3.2

  // Nen dimensional void aperture appearing in the wall
  into.box([1.4, 2.2, 0.04], {
    at: [portalX, portalY, portalZ],
    colour: WAREHOUSE_PORTAL_CORE,
  })

  // Pulsing violet spatial Nen aura perimeter rim
  into.box([1.55, 2.35, 0.02], {
    at: [portalX, portalY, portalZ - 0.01],
    colour: WAREHOUSE_PORTAL_VIOLET,
    glow: true,
  })

  // Spatial distortion rings expanding around the opening
  into.sphere([0.7, 1.1, 0.05], {
    at: [portalX, portalY, portalZ + 0.02],
    colour: WAREHOUSE_PORTAL_VIOLET,
    glow: true,
  })
}

/** Complete ensemble of warehouse entrance fixtures, rolling shutter, locked door, and portal */
export function dressWarehouseEntranceFeatures(options: WarehouseEntranceOptions): void {
  const { into, floor } = options
  dressFreightRollingShutter(into, floor)
  dressLockedBackDoor(into, floor)
  dressLuiniSpatialPortal(into, floor)
}
