import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

export const TABLE_TOP = 0x4d3f2e
export const TABLE_EDGE = 0x362c20
export const TABLE_LEGS = 0x222426
export const BENCH_WOOD = 0x564734
export const BENCH_LEGS = 0x202224
export const PLATFORM_RISER = 0x3e3932
export const PLATFORM_BORDER = 0x6e6354
export const TRAY_RED = 0x86322b
export const TRAY_BROWN = 0x483a30
export const BOWL_WHITE = 0xdad6cb
export const CUP_BLUE = 0x384c59
export const CHOPSTICKS = 0xc2ab7a

interface FurnitureContext {
  into: BanquetDetailBuilder
  structure: Structure
  floor: number
}

/** Places a cafeteria meal tray with a bowl, cup and chopsticks. */
function placeMealTray(into: BanquetDetailBuilder, at: Point3, trayColour = TRAY_RED) {
  const [x, y, z] = at

  // Serving tray
  into.box([0.44, 0.018, 0.32], { at: [x, y + 0.009, z], colour: trayColour })

  // Meal bowl (noodle / rice)
  into.cylinder(
    { radius: 0.09, bottom: 0.06, height: 0.065, sides: 12 },
    { at: [x - 0.09, y + 0.05, z - 0.04], colour: BOWL_WHITE },
  )

  // Beverage tumbler cup
  into.cylinder(
    { radius: 0.042, bottom: 0.035, height: 0.09, sides: 8 },
    { at: [x + 0.12, y + 0.06, z - 0.06], colour: CUP_BLUE },
  )

  // Pair of wooden chopsticks
  into.box([0.22, 0.008, 0.012], {
    at: [x - 0.02, y + 0.022, z + 0.1],
    colour: CHOPSTICKS,
  })
}

/** Refectory table with laminated top, protective edging and tubular steel legs. */
export function dressDiningTable(context: FurnitureContext): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at
  const [w, d] = structure.size
  const y = floor + structure.base
  const topY = y + structure.height

  // Laminated table top
  into.box([w, 0.045, d], {
    at: [x, topY - 0.022, z],
    colour: TABLE_TOP,
  })

  // Protective dark edge banding
  into.box([w + 0.02, 0.05, d + 0.02], {
    at: [x, topY - 0.025, z],
    colour: TABLE_EDGE,
  })

  // 4 tubular steel legs
  const legOffsetX = w / 2 - 0.25
  const legOffsetZ = d / 2 - 0.2
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      into.cylinder(
        { radius: 0.032, height: structure.height - 0.05, sides: 8 },
        {
          at: [x + sx * legOffsetX, y + (structure.height - 0.05) / 2, z + sz * legOffsetZ],
          colour: TABLE_LEGS,
        },
      )
    }
  }

  // Scattered trays along long tables (every ~2.2 metres)
  const isHorizontal = w > d
  const length = isHorizontal ? w : d
  const count = Math.max(1, Math.floor(length / 2.4))
  const step = length / (count + 1)

  for (let i = 1; i <= count; i++) {
    const px = isHorizontal ? x - w / 2 + i * step : x
    const pz = isHorizontal ? z : z - d / 2 + i * step
    const trayColour = i % 2 === 0 ? TRAY_RED : TRAY_BROWN
    placeMealTray(into, [px, topY, pz], trayColour)
  }
}

/** Dining bench with finished wooden plank and steel stanchion feet. */
export function dressDiningBench(context: FurnitureContext): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at
  const [w, d] = structure.size
  const y = floor + structure.base
  const topY = y + structure.height

  // Wooden bench plank
  into.box([w, 0.04, d], {
    at: [x, topY - 0.02, z],
    colour: BENCH_WOOD,
  })

  // Stanchion support legs
  const isHorizontal = w > d
  const len = isHorizontal ? w : d
  const legStep = Math.max(1.5, len / 3)
  const count = Math.max(2, Math.floor(len / legStep))

  for (let i = 0; i < count; i++) {
    const offset = -len / 2 + 0.3 + (i * (len - 0.6)) / (count - 1)
    const lx = isHorizontal ? x + offset : x
    const lz = isHorizontal ? z : z + offset
    into.box([0.06, structure.height - 0.04, 0.06], {
      at: [lx, y + (structure.height - 0.04) / 2, lz],
      colour: BENCH_LEGS,
    })
    // Floor mounting foot
    into.box([0.14, 0.02, 0.14], {
      at: [lx, y + 0.01, lz],
      colour: TABLE_LEGS,
    })
  }
}

/** Central VIP raised platforms where the Phantom Troupe gathers. */
export function dressCentralVIPPlatform(context: FurnitureContext): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at
  const [w, d] = structure.size
  const y = floor + structure.base
  const topY = y + structure.height

  // Raised platform deck
  into.box([w, structure.height, d], {
    at: [x, y + structure.height / 2, z],
    colour: PLATFORM_RISER,
  })

  // Perimeter bevel trim
  into.box([w + 0.12, 0.06, d + 0.12], {
    at: [x, topY - 0.03, z],
    colour: PLATFORM_BORDER,
  })

  // Tablecloth runner down the centre of the VIP meeting table
  into.box([w * 0.88, 0.02, d * 0.45], {
    at: [x, topY + 0.01, z],
    colour: 0xdedcd5,
  })

  // Multiple trays & meal bowls for the 10 Spiders meeting
  for (const dx of [-1.8, -0.6, 0.6, 1.8]) {
    for (const dz of [-0.8, 0.8]) {
      placeMealTray(into, [x + dx, topY + 0.02, z + dz], dx + dz > 0 ? TRAY_RED : TRAY_BROWN)
    }
  }

  // Large shared central food platter & teapot
  into.cylinder(
    { radius: 0.28, height: 0.04, sides: 16 },
    { at: [x, topY + 0.04, z], colour: 0xe6e3dc },
  )
  into.cylinder(
    { radius: 0.1, height: 0.18, sides: 10 },
    { at: [x + 0.45, topY + 0.11, z], colour: 0x3d3a36 },
  )
}

/** Franklin's solo waiting table (chapters 379-380). */
export function dressFranklinTable(context: FurnitureContext): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at
  const [w, d] = structure.size
  const y = floor + structure.base
  const topY = y + structure.height

  // Table top & legs
  into.box([w, 0.045, d], { at: [x, topY - 0.022, z], colour: TABLE_TOP })
  into.box([w + 0.02, 0.05, d + 0.02], { at: [x, topY - 0.025, z], colour: TABLE_EDGE })

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      into.cylinder(
        { radius: 0.032, height: structure.height - 0.05, sides: 8 },
        {
          at: [x + sx * (w / 2 - 0.2), y + (structure.height - 0.05) / 2, z + sz * (d / 2 - 0.15)],
          colour: TABLE_LEGS,
        },
      )
    }
  }

  // Franklin's meal tray and large mug
  placeMealTray(into, [x, topY, z], TRAY_RED)
  into.cylinder(
    { radius: 0.055, height: 0.14, sides: 12 },
    { at: [x + 0.5, topY + 0.07, z + 0.1], colour: 0x5a6d7a },
  )
}
