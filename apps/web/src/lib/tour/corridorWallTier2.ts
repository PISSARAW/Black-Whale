import { wallBays, wallBox, wallPoint, type WallBay, type WallSurface } from './corridorWallLayout'

const BUMPER_RAIL = 0x484e55
const BUMPER_BRACKET = 0x272a2e
const JOINT_DARK = 0x1d2024
const INTERCOM_METAL = 0x2f343a
const LED_RED = 0xcc2929
const FIRE_RED = 0x962323
const CABINET_GLASS = 0x6e8894
const SIGN_BLUE = 0x1f2e42
const SIGN_TEXT = 0xd4dde6
const LAMP_CASING = 0x3f454d
const LAMP_DIFFUSER = 0xf0f5fa

interface Tier2WallContext {
  floor: number
  ceiling: number
}

function protectiveBumper(wall: WallSurface, floor: number): void {
  const { length } = wall.run
  // Baseboard kickplate
  wallBox(wall, [length, 0.1, 0.025], {
    along: length / 2,
    y: floor + 0.05,
    colour: BUMPER_BRACKET,
    inset: 0.012,
  })

  // Continuous bumper crash rail at waist height
  wallBox(wall, [length, 0.07, 0.06], {
    along: length / 2,
    y: floor + 0.95,
    colour: BUMPER_RAIL,
    inset: 0.045,
  })

  // Wall brackets spaced along the run
  const step = 2.0
  for (let along = 1.0; along < length; along += step) {
    wallBox(wall, [0.05, 0.12, 0.04], {
      along,
      y: floor + 0.95,
      colour: BUMPER_BRACKET,
      inset: 0.02,
    })
  }
}

function panelJoints(wall: WallSurface, context: Tier2WallContext): void {
  const { floor, ceiling } = context
  const height = ceiling - floor
  const pitch = 2.4
  for (let along = pitch; along < wall.run.length; along += pitch) {
    // Vertical dark reveal joint
    wallBox(wall, [0.03, height, 0.015], {
      along,
      y: floor + height / 2,
      colour: JOINT_DARK,
      inset: 0.008,
    })
  }
}

function securityIntercom(wall: WallSurface, along: number, floor: number): void {
  // Wall-mounted intercom backplate
  wallBox(wall, [0.22, 0.36, 0.04], {
    along,
    y: floor + 1.45,
    colour: INTERCOM_METAL,
    inset: 0.02,
  })
  // Speaker grille / keypad
  wallBox(wall, [0.16, 0.14, 0.045], {
    along,
    y: floor + 1.5,
    colour: 0x1e2126,
    inset: 0.025,
  })
  // Status LED indicator
  wallBox(wall, [0.02, 0.02, 0.048], {
    along: along + 0.06,
    y: floor + 1.58,
    colour: LED_RED,
    inset: 0.026,
  })

  // Overhead mini dome camera bracket
  wallBox(wall, [0.1, 0.06, 0.14], {
    along,
    y: floor + 2.2,
    colour: INTERCOM_METAL,
    inset: 0.07,
  })
  const domePt = wallPoint(wall.run, { along, y: floor + 2.16, inset: 0.14 })
  wall.into.cylinder({ radius: 0.04, height: 0.04, sides: 6 }, { at: domePt, colour: 0x181a1d })
}

function fireHoseCabinet(wall: WallSurface, along: number, floor: number): void {
  // Red cabinet enclosure
  wallBox(wall, [0.46, 0.58, 0.08], {
    along,
    y: floor + 1.15,
    colour: FIRE_RED,
    inset: 0.04,
  })
  // Inspection glass window
  wallBox(wall, [0.34, 0.44, 0.085], {
    along,
    y: floor + 1.15,
    colour: CABINET_GLASS,
    inset: 0.045,
  })
}

function wayfindingSign(wall: WallSurface, along: number, floor: number): void {
  // Administrative directional sign plate
  wallBox(wall, [0.55, 0.18, 0.03], {
    along,
    y: floor + 1.75,
    colour: SIGN_BLUE,
    inset: 0.016,
  })
  // Stenciled text stripe
  wallBox(wall, [0.45, 0.05, 0.034], {
    along,
    y: floor + 1.75,
    colour: SIGN_TEXT,
    inset: 0.018,
  })
}

function bayEquipment(wall: WallSurface, bay: WallBay, floor: number): void {
  const mod = bay.index % 3
  if (mod === 0) {
    securityIntercom(wall, bay.along, floor)
  } else if (mod === 1) {
    wayfindingSign(wall, bay.along, floor)
  } else {
    fireHoseCabinet(wall, bay.along, floor)
  }
}

/** Dresses a Tier 2 administrative/security corridor wall run. */
export function dressTier2CorridorWall(wall: WallSurface, context: Tier2WallContext): void {
  const { floor, ceiling } = context
  protectiveBumper(wall, floor)
  panelJoints(wall, context)

  // Upper linear fluorescent troffer fixture
  wallBox(wall, [wall.run.length * 0.8, 0.08, 0.1], {
    along: wall.run.length / 2,
    y: ceiling - 0.15,
    colour: LAMP_CASING,
    inset: 0.05,
  })
  wallBox(wall, [wall.run.length * 0.76, 0.04, 0.11], {
    along: wall.run.length / 2,
    y: ceiling - 0.15,
    colour: LAMP_DIFFUSER,
    inset: 0.055,
  })

  const bays = wallBays(wall.run, 3.8)
  for (const bay of bays) {
    bayEquipment(wall, bay, floor)
  }
}
