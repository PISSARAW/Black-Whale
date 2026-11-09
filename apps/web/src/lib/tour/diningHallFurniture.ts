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
export const CADDY_BASE = 0x2a2c2e
export const SAUCE_BOTTLE = 0x1f1914
export const SAUCE_CAP = 0x8a201c
export const SHAKER = 0xcccccc
export const NAPKIN_HOLDER = 0x909498
export const NAPKIN_PAPER = 0xf5f3ee
export const TEACUP = 0xdcd8cf
export const CLAMSHELL_BOX = 0xd8c8a8
export const BURGER_BUN = 0xd49b4b
export const BURGER_PATTY = 0x4a2818
export const BURGER_GREENS = 0x6e9934
export const SIDE_CUP = 0xf0ede6

interface FurnitureContext {
  into: BanquetDetailBuilder
  structure: Structure
  floor: number
}

export function centralVIPTableLayout(size: readonly [number, number]) {
  const [width, depth] = size
  const placeSettings = [-0.34, -0.11, 0.11, 0.34].flatMap((depthRatio) =>
    [-0.275, 0.275].map((widthRatio) => [width * widthRatio, depth * depthRatio] as const),
  )
  return {
    runner: [width * 0.45, depth * 0.88] as const,
    placeSettings,
  }
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

/**
 * Fast-food hamburger meal in an open clamshell box with drink and side cup
 * directly depicted on the meal tray in chapter 378 (panel 3).
 */
function placeBurgerClamshellMeal(into: BanquetDetailBuilder, at: Point3, trayColour = TRAY_RED) {
  const [x, y, z] = at

  // Serving tray
  into.box([0.44, 0.018, 0.32], { at: [x, y + 0.009, z], colour: trayColour })

  // Open clamshell box bottom
  into.box([0.18, 0.025, 0.17], { at: [x + 0.05, y + 0.02, z + 0.02], colour: CLAMSHELL_BOX })
  // Open clamshell box lid angled backward
  into.box([0.18, 0.13, 0.012], {
    at: [x + 0.05, y + 0.08, z - 0.065],
    rotation: [-0.4, 0, 0],
    colour: CLAMSHELL_BOX,
  })

  // Hamburger inside clamshell box
  const bx = x + 0.05
  const bz = z + 0.02
  into.cylinder(
    { radius: 0.052, height: 0.018, sides: 12 },
    { at: [bx, y + 0.03, bz], colour: BURGER_BUN },
  )
  into.cylinder(
    { radius: 0.056, height: 0.022, sides: 12 },
    { at: [bx, y + 0.045, bz], colour: BURGER_PATTY },
  )
  into.box([0.1, 0.008, 0.1], { at: [bx, y + 0.055, bz], colour: BURGER_GREENS })
  into.sphere([0.052, 0.026, 0.052], { at: [bx, y + 0.07, bz], colour: BURGER_BUN })

  // Beverage tumbler cup with drinking straw
  into.cylinder(
    { radius: 0.038, bottom: 0.03, height: 0.095, sides: 8 },
    { at: [x - 0.12, y + 0.06, z - 0.06], colour: CUP_BLUE },
  )
  into.cylinder(
    { radius: 0.004, height: 0.06, sides: 6 },
    { at: [x - 0.12, y + 0.12, z - 0.06], rotation: [0.15, 0, 0.1], colour: 0xeeeeee },
  )

  // Side cup (coleslaw / dip)
  into.cylinder(
    { radius: 0.04, bottom: 0.032, height: 0.04, sides: 10 },
    { at: [x - 0.12, y + 0.035, z + 0.06], colour: SIDE_CUP },
  )
}

/** Places a table condiment caddy with soy sauce bottle, salt shaker and napkin dispenser. */
function placeCondimentCaddy(into: BanquetDetailBuilder, at: Point3) {
  const [x, y, z] = at

  // Steel tray base
  into.box([0.18, 0.015, 0.12], { at: [x, y + 0.0075, z], colour: CADDY_BASE })

  // Soy sauce bottle with red spout cap
  into.cylinder(
    { radius: 0.026, bottom: 0.03, height: 0.1, sides: 8 },
    { at: [x - 0.045, y + 0.05, z - 0.01], colour: SAUCE_BOTTLE },
  )
  into.cylinder(
    { radius: 0.014, height: 0.025, sides: 8 },
    { at: [x - 0.045, y + 0.11, z - 0.01], colour: SAUCE_CAP },
  )

  // Salt shaker
  into.cylinder(
    { radius: 0.02, height: 0.075, sides: 8 },
    { at: [x + 0.045, y + 0.038, z - 0.025], colour: SHAKER },
  )

  // Metal napkin dispenser with white paper napkins
  into.box([0.03, 0.08, 0.08], { at: [x + 0.045, y + 0.04, z + 0.025], colour: NAPKIN_HOLDER })
  into.box([0.022, 0.075, 0.07], { at: [x + 0.045, y + 0.04, z + 0.025], colour: NAPKIN_PAPER })
}

interface TableLegsOptions {
  into: BanquetDetailBuilder
  origin: [number, number, number]
  size: [number, number]
  height: number
}

function placeTableLegs(options: TableLegsOptions): void {
  const { into, origin, size, height } = options
  const [x, y, z] = origin
  const [w, d] = size
  const legOffsetX = w / 2 - 0.25
  const legOffsetZ = d / 2 - 0.2
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      into.cylinder(
        { radius: 0.032, height: height - 0.05, sides: 8 },
        {
          at: [x + sx * legOffsetX, y + (height - 0.05) / 2, z + sz * legOffsetZ],
          colour: TABLE_LEGS,
        },
      )
    }
  }
}

interface TablewareRowOptions {
  into: BanquetDetailBuilder
  at: [number, number, number]
  size: [number, number]
}

function placeTableTableware(options: TablewareRowOptions): void {
  const { into, at, size } = options
  const [x, topY, z] = at
  const [w, d] = size
  const isHorizontal = w > d
  const length = isHorizontal ? w : d
  const count = Math.max(1, Math.floor(length / 2.4))
  const step = length / (count + 1)

  for (let i = 1; i <= count; i++) {
    const px = isHorizontal ? x - w / 2 + i * step : x
    const pz = isHorizontal ? z : z - d / 2 + i * step
    const trayColour = i % 2 === 0 ? TRAY_RED : TRAY_BROWN
    if (i % 2 === 1) {
      placeBurgerClamshellMeal(into, [px, topY, pz], trayColour)
    } else {
      placeMealTray(into, [px, topY, pz], trayColour)
    }

    if (i < count) {
      const caddyX = isHorizontal ? px + step / 2 : px
      const caddyZ = isHorizontal ? pz : pz + step / 2
      placeCondimentCaddy(into, [caddyX, topY, caddyZ])
    }
  }
}

/** Refectory table with laminated top, protective edging and tubular steel legs. */
export function dressDiningTable(context: FurnitureContext): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at
  const [w, d] = structure.size
  const y = floor + structure.base
  const topY = y + structure.height

  // Laminated table top and protective edge banding
  into.box([w, 0.045, d], { at: [x, topY - 0.022, z], colour: TABLE_TOP })
  into.box([w + 0.02, 0.05, d + 0.02], { at: [x, topY - 0.025, z], colour: TABLE_EDGE })

  // 4 tubular steel legs
  placeTableLegs({ into, origin: [x, y, z], size: [w, d], height: structure.height })

  // Scattered trays and condiment caddies along long tables
  placeTableTableware({ into, at: [x, topY, z], size: [w, d] })
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

  const layout = centralVIPTableLayout(structure.size)

  // The runner follows the long axis of both central tables.
  into.box([layout.runner[0], 0.02, layout.runner[1]], {
    at: [x, topY + 0.01, z],
    colour: 0xdedcd5,
  })

  // Four settings on each long side, matching the orientation of the benches.
  for (const [index, [dx, dz]] of layout.placeSettings.entries()) {
    placeMealTray(into, [x + dx, topY + 0.02, z + dz], index % 2 ? TRAY_RED : TRAY_BROWN)
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

  // Condiment caddy and ceramic teacups for the 10 Spiders
  placeCondimentCaddy(into, [x - 0.5, topY + 0.02, z])
  for (const [dx, dz] of layout.placeSettings) {
    into.cylinder(
      { radius: 0.035, bottom: 0.028, height: 0.05, sides: 8 },
      { at: [x + dx - Math.sign(dx) * 0.24, topY + 0.045, z + dz], colour: TEACUP },
    )
  }
}

interface FranklinBenchOptions {
  into: BanquetDetailBuilder
  x: number
  z: number
  w: number
  floor: number
}

function dressFranklinBenches(options: FranklinBenchOptions): void {
  const { into, x, z, w, floor } = options
  for (const sz of [-0.68, 0.68]) {
    into.box([w, 0.04, 0.34], { at: [x, floor + 0.43, z + sz], colour: BENCH_WOOD })
    for (const sx of [-1, 1]) {
      const legX = x + sx * (w / 2 - 0.3)
      into.box([0.06, 0.41, 0.06], { at: [legX, floor + 0.205, z + sz], colour: BENCH_LEGS })
      into.box([0.14, 0.02, 0.14], { at: [legX, floor + 0.01, z + sz], colour: TABLE_LEGS })
    }
  }
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

  // Grounded refectory benches alongside Franklin's table
  dressFranklinBenches({ into, x, z, w, floor })

  // Franklin's meal tray (fast-food burger meal from ch. 378), condiment caddy and large mug
  placeBurgerClamshellMeal(into, [x, topY, z], TRAY_RED)
  placeCondimentCaddy(into, [x - 0.35, topY, z])
  into.cylinder(
    { radius: 0.055, height: 0.14, sides: 12 },
    { at: [x + 0.45, topY + 0.07, z + 0.1], colour: 0x5a6d7a },
  )
}
