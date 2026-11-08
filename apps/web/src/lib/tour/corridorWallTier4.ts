import { wallBays, wallBox, wallPoint, type WallSurface } from './corridorWallLayout'

const STEEL_STIFFENER = 0x393f45
const CONDUIT_PIPE = 0x5a6068
const JUNCTION_BOX = 0x444950
const HYDRAULIC_PIPE = 0x3f4f5d
const VALVE_RED = 0xbd2828
const HAZARD_YELLOW = 0xd9b329
const HAZARD_BLACK = 0x1b1c1e
const CAGE_METAL = 0x2e3237
const LAMP_WARM = 0xffe6a3

interface Tier4WallContext {
  floor: number
  ceiling: number
}

function verticalStiffeners(wall: WallSurface, context: Tier4WallContext): void {
  const { floor, ceiling } = context
  const height = ceiling - floor
  const { length } = wall.run

  // Continuous floor steel channel
  wallBox(wall, [length, 0.1, 0.04], {
    along: length / 2,
    y: floor + 0.05,
    colour: STEEL_STIFFENER,
    inset: 0.02,
  })

  // Vertical steel U-channel ribs every 1.6m
  const pitch = 1.6
  for (let along = pitch; along < length; along += pitch) {
    wallBox(wall, [0.08, height, 0.06], {
      along,
      y: floor + height / 2,
      colour: STEEL_STIFFENER,
      inset: 0.03,
    })
  }
}

function horizontalConduits(wall: WallSurface, context: Tier4WallContext): void {
  const { floor, ceiling } = context
  const { length } = wall.run

  // Upper dual electrical conduit run
  wallBox(wall, [length, 0.035, 0.035], {
    along: length / 2,
    y: ceiling - 0.42,
    colour: CONDUIT_PIPE,
    inset: 0.05,
  })
  wallBox(wall, [length, 0.035, 0.035], {
    along: length / 2,
    y: ceiling - 0.5,
    colour: CONDUIT_PIPE,
    inset: 0.05,
  })

  // Mid-level hydraulic pipe run
  wallBox(wall, [length, 0.05, 0.05], {
    along: length / 2,
    y: floor + 1.35,
    colour: HYDRAULIC_PIPE,
    inset: 0.055,
  })

  // Junction boxes along the upper conduit
  const step = 3.2
  for (let along = 1.6; along < length; along += step) {
    wallBox(wall, [0.12, 0.14, 0.06], {
      along,
      y: ceiling - 0.46,
      colour: JUNCTION_BOX,
      inset: 0.055,
    })
  }
}

function hazardBands(wall: WallSurface, floor: number): void {
  const { length: totalLen } = wall.run
  // Diagonal safety stripe markers at low levels near corners
  const segLen = Math.min(totalLen, 1.2)
  for (const start of [0.1, Math.max(0.1, totalLen - segLen - 0.1)]) {
    wallBox(wall, [segLen, 0.16, 0.02], {
      along: start + segLen / 2,
      y: floor + 0.22,
      colour: HAZARD_YELLOW,
      inset: 0.012,
    })
    // Black hatch accents
    const stripes = 4
    for (let i = 0; i < stripes; i++) {
      wallBox(wall, [0.06, 0.16, 0.024], {
        along: start + (i + 0.5) * (segLen / stripes),
        y: floor + 0.22,
        colour: HAZARD_BLACK,
        inset: 0.014,
      })
    }
  }
}

function cagedMarineLamp(wall: WallSurface, along: number, floor: number): void {
  // Cast metal bulkhead box
  wallBox(wall, [0.1, 0.16, 0.05], {
    along,
    y: floor + 2.1,
    colour: CAGE_METAL,
    inset: 0.035,
  })
  // Glowing warm bulb
  const pt = wallPoint(wall.run, { along, y: floor + 2.1, inset: 0.09 })
  wall.into.cylinder(
    { radius: 0.038, height: 0.09, sides: 6 },
    { at: pt, colour: LAMP_WARM, glow: true },
  )
  // Wire guard cage
  wallBox(wall, [0.12, 0.18, 0.08], {
    along,
    y: floor + 2.1,
    colour: CAGE_METAL,
    inset: 0.075,
  })
}

function pipeValve(wall: WallSurface, along: number, floor: number): void {
  // Valve body and red handwheel
  wallBox(wall, [0.08, 0.08, 0.07], {
    along,
    y: floor + 1.35,
    colour: STEEL_STIFFENER,
    inset: 0.07,
  })
  const pt = wallPoint(wall.run, { along, y: floor + 1.35, inset: 0.13 })
  wall.into.cylinder({ radius: 0.07, height: 0.02, sides: 8 }, { at: pt, colour: VALVE_RED })
}

/** Dresses a Tier 4 industrial mafia passage with stiffeners, conduits, valves and caged lights. */
export function dressTier4CorridorWall(wall: WallSurface, context: Tier4WallContext): void {
  const { floor } = context
  verticalStiffeners(wall, context)
  horizontalConduits(wall, context)
  hazardBands(wall, floor)

  const bays = wallBays(wall.run, 3.6)
  for (const bay of bays) {
    pipeValve(wall, bay.along, floor)
    cagedMarineLamp(wall, bay.along, floor)
  }
}
