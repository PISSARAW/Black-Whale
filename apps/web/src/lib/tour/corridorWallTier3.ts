import { wallBays, wallBox, type WallBay, type WallSurface } from './corridorWallLayout'

const BASEBOARD_DARK = 0x2b2420
const HANDRAIL_WOOD = 0x543f30
const ALUMINUM_STRIP = 0x9aa0a6
const DOOR_FRAME = 0x3e4348
const DOOR_LEAF = 0x51585d
const DOOR_HANDLE = 0xc2c8d0
const NUMBER_PLATE = 0x23272c
const NUMBER_TEXT = 0xd8e0e8
const LAMP_GREEN = 0x4cd964
const EXTINGUISHER_RED = 0xba2424
const VENT_GRILLE = 0x30353a

interface Tier3WallContext {
  floor: number
  ceiling: number
}

function passengerRails(wall: WallSurface, floor: number): void {
  const { length } = wall.run
  // Baseboard trim
  wallBox(wall, [length, 0.08, 0.02], {
    along: length / 2,
    y: floor + 0.04,
    colour: BASEBOARD_DARK,
    inset: 0.01,
  })

  // Wooden protective handrail at waist height
  wallBox(wall, [length, 0.055, 0.045], {
    along: length / 2,
    y: floor + 0.9,
    colour: HANDRAIL_WOOD,
    inset: 0.035,
  })
}

function panelVerticalStrips(wall: WallSurface, context: Tier3WallContext): void {
  const { floor, ceiling } = context
  const height = ceiling - floor
  const pitch = 1.6
  for (let along = pitch; along < wall.run.length; along += pitch) {
    // Aluminum joining T-strip between prefabricated wall panels
    wallBox(wall, [0.02, height, 0.015], {
      along,
      y: floor + height / 2,
      colour: ALUMINUM_STRIP,
      inset: 0.008,
    })
  }
}

function cabinDoor(wall: WallSurface, along: number, floor: number): void {
  // Standard cabin doorframe
  wallBox(wall, [0.92, 2.1, 0.03], {
    along,
    y: floor + 1.05,
    colour: DOOR_FRAME,
    inset: 0.015,
  })
  // Door leaf
  wallBox(wall, [0.82, 2.02, 0.024], {
    along,
    y: floor + 1.01,
    colour: DOOR_LEAF,
    inset: 0.018,
  })
  // Door handle
  wallBox(wall, [0.03, 0.1, 0.045], {
    along: along - 0.32,
    y: floor + 1.0,
    colour: DOOR_HANDLE,
    inset: 0.03,
  })
  // Cabin number plate (SRCL 9041 - 9488 from chapters 398-399)
  wallBox(wall, [0.18, 0.08, 0.03], {
    along,
    y: floor + 1.55,
    colour: NUMBER_PLATE,
    inset: 0.022,
  })
  wallBox(wall, [0.14, 0.03, 0.034], {
    along,
    y: floor + 1.55,
    colour: NUMBER_TEXT,
    inset: 0.024,
  })
  // Indicator light above door lintel
  wallBox(wall, [0.08, 0.04, 0.03], {
    along,
    y: floor + 2.18,
    colour: LAMP_GREEN,
    inset: 0.022,
  })
}

function extinguisherStation(wall: WallSurface, along: number, floor: number): void {
  // Recessed niche frame
  wallBox(wall, [0.34, 0.65, 0.04], {
    along,
    y: floor + 1.05,
    colour: DOOR_FRAME,
    inset: 0.02,
  })
  // Red fire extinguisher cylinder
  wallBox(wall, [0.14, 0.44, 0.12], {
    along,
    y: floor + 1.05,
    colour: EXTINGUISHER_RED,
    inset: 0.06,
  })
}

function bayDecorations(wall: WallSurface, bay: WallBay, context: Tier3WallContext): void {
  const { floor, ceiling } = context
  cabinDoor(wall, bay.along, floor)

  // Overhead air return vent grille
  wallBox(wall, [0.65, 0.14, 0.02], {
    along: bay.along,
    y: ceiling - 0.22,
    colour: VENT_GRILLE,
    inset: 0.012,
  })

  // Interleaved fire safety stations between cabin bays
  if (bay.index % 2 === 1 && bay.along + 1.2 < wall.run.length) {
    extinguisherStation(wall, bay.along + 1.1, floor)
  }
}

/** Dresses a Tier 3 passenger circulation corridor with modular cabins and wayfinding. */
export function dressTier3CorridorWall(wall: WallSurface, context: Tier3WallContext): void {
  passengerRails(wall, context.floor)
  panelVerticalStrips(wall, context)

  const bays = wallBays(wall.run, 3.2)
  for (const bay of bays) {
    bayDecorations(wall, bay, context)
  }
}
