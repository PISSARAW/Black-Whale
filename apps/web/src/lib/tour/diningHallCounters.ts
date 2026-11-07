import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Structure } from './types'

export const STAINLESS = 0xcad0d4
export const COUNTER_BASE = 0x484239
export const TRAY_SLIDE = 0x9fa4a8
export const MENU_BG = 0x181a1d
export const MENU_TEXT_GLOW = 0xfff4cf
export const MENU_FRAME = 0x5a554a
export const VENDING_BODY = 0x24282e
export const VENDING_GLOW = 0x64b0f0
export const VENDING_TRIM = 0x8a9299
export const VENDING_ACCENT = 0xa4352f

interface CounterContext {
  into: BanquetDetailBuilder
  structure: Structure
  floor: number
  ceiling?: number
}

/** 25-metre continuous West service counter with tray slides and sneeze guards. */
export function dressServiceCounter(context: CounterContext): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at
  const [sizeX, sizeZ] = structure.size
  const y = floor + structure.base
  const topY = y + structure.height

  // Stainless steel counter top with slight overhang
  into.box([sizeX + 0.1, 0.08, sizeZ + 0.05], {
    at: [x, topY - 0.04, z],
    colour: STAINLESS,
  })

  // Dark reinforced counter face & base plinth
  into.box([sizeX, structure.height - 0.08, sizeZ], {
    at: [x, y + (structure.height - 0.08) / 2, z],
    colour: COUNTER_BASE,
  })

  // Three parallel tubular tray slides along customer side (East face)
  const slideX = x + sizeX / 2 + 0.18
  for (const dy of [-0.08, 0, 0.08]) {
    into.box([0.03, 0.03, sizeZ - 0.5], {
      at: [slideX, topY - 0.15 + dy, z],
      colour: TRAY_SLIDE,
    })
  }

  // Slide bracket supports every 2.5 metres
  for (let pz = z - sizeZ / 2 + 1; pz < z + sizeZ / 2; pz += 2.5) {
    into.box([0.22, 0.04, 0.04], {
      at: [x + sizeX / 2 + 0.08, topY - 0.15, pz],
      colour: STAINLESS,
    })
  }

  // Upright sneeze guard posts and acrylic screen
  dressCounterSneezeGuard({ into, x: x + sizeX / 4, topY, z, sizeZ })

  // Stainless steel food warming insert wells (bains-marie) with hot dishes
  dressFoodWarmingWells({ into, x, topY, span: [z - sizeZ / 2, z + sizeZ / 2] })

  // Fixed counter stools along customer-facing aisle (East face)
  dressCounterStools({
    into,
    x: slideX + 0.45,
    span: [z - sizeZ / 2, z + sizeZ / 2],
    floor,
  })

  // Tray return racks at the counter extremities
  dressTrayReturnRack({ into, at: [x, floor, z - sizeZ / 2 + 0.8], floor })
  dressTrayReturnRack({ into, at: [x, floor, z + sizeZ / 2 - 0.8], floor })

  // Tall vertical menu tariff board on right wall flank (ch. 378 panel 1)
  dressVerticalTariffBoard({ into, at: [14.06, floor + 2.1, z + sizeZ / 2 + 0.8] })

  // Back-of-counter crates and supply sacks (ch. 378 panel 1)
  dressBackOfCounterStorage({ into, origin: [x, floor, z - sizeZ / 2 + 3.0] })
}

interface SneezeGuardOptions {
  into: BanquetDetailBuilder
  x: number
  topY: number
  z: number
  sizeZ: number
}

function dressCounterSneezeGuard(options: SneezeGuardOptions): void {
  const { into, x, topY, z, sizeZ } = options
  for (let pz = z - sizeZ / 2 + 1; pz < z + sizeZ / 2; pz += 3) {
    into.box([0.03, 0.45, 0.03], {
      at: [x, topY + 0.225, pz],
      colour: STAINLESS,
    })
  }
  into.box([0.04, 0.35, sizeZ - 1], {
    at: [x, topY + 0.25, z],
    colour: 0xd8e4e8,
  })
  // Stainless steel top clamping rail securing the continuous screen
  into.box([0.05, 0.03, sizeZ - 1], {
    at: [x, topY + 0.44, z],
    colour: STAINLESS,
  })
}

interface WarmingWellsOptions {
  into: BanquetDetailBuilder
  x: number
  topY: number
  span: [number, number]
}

function dressFoodWarmingWells(options: WarmingWellsOptions): void {
  const { into, x, topY, span } = options
  const [minZ, maxZ] = span
  const foodColours = [0x7a3a22, 0xe8e4dc, 0xa66030, 0x4a2a1a]
  let idx = 0
  for (let pz = minZ + 2.5; pz <= maxZ - 2.5; pz += 3.2) {
    into.box([0.5, 0.04, 0.38], { at: [x - 0.1, topY + 0.02, pz], colour: 0xb8c0c4 })
    into.box([0.44, 0.02, 0.32], {
      at: [x - 0.1, topY + 0.03, pz],
      colour: foodColours[idx % foodColours.length],
    })
    idx++
  }
}

interface TariffBoardOptions {
  into: BanquetDetailBuilder
  at: [number, number, number]
}

function dressVerticalTariffBoard(options: TariffBoardOptions): void {
  const { into, at } = options
  const [x, y, z] = at
  // Wall mounting backer plate flush against the West wall at x = 14.0
  into.box([0.04, 1.95, 0.9], { at: [14.02, y, z], colour: 0x38342c })
  into.box([0.06, 1.9, 0.85], { at: [x, y, z], colour: MENU_FRAME })
  into.box([0.07, 1.8, 0.78], { at: [x, y, z], colour: 0xeeece8 })
  for (const dy of [-0.65, -0.45, -0.25, -0.05, 0.15, 0.35, 0.55, 0.75]) {
    into.box([0.075, 0.02, 0.3], { at: [x + 0.005, y + dy, z - 0.18], colour: 0x222426 })
    into.box([0.075, 0.02, 0.3], { at: [x + 0.005, y + dy, z + 0.18], colour: 0x222426 })
  }
}

interface StorageOptions {
  into: BanquetDetailBuilder
  origin: [number, number, number]
}

function dressBackOfCounterStorage(options: StorageOptions): void {
  const { into, origin } = options
  const [, floor, z] = origin
  into.box([0.36, 0.35, 0.45], { at: [14.35, floor + 0.175, z - 2.0], colour: 0x7c6248 })
  into.box([0.36, 0.35, 0.45], { at: [14.35, floor + 0.175, z - 1.45], colour: 0x6e563d })
  into.box([0.34, 0.32, 0.42], { at: [14.35, floor + 0.51, z - 1.7], colour: 0x82694e })
  into.sphere([0.16, 0.28, 0.16], { at: [14.35, floor + 0.28, z + 1.8], colour: 0xb5ab9a })
  into.sphere([0.18, 0.25, 0.16], { at: [14.35, floor + 0.25, z + 2.3], colour: 0x9e9484 })
}

interface StoolRowOptions {
  into: BanquetDetailBuilder
  x: number
  span: [number, number]
  floor: number
}

function dressCounterStools(options: StoolRowOptions): void {
  const { into, x, span, floor } = options
  const [minZ, maxZ] = span
  const step = 2.0
  for (let z = minZ + 1.5; z <= maxZ - 1.5; z += step) {
    into.cylinder({ radius: 0.14, height: 0.02, sides: 8 }, { at: [x, floor + 0.01, z], colour: STAINLESS })
    into.cylinder({ radius: 0.035, height: 0.62, sides: 8 }, { at: [x, floor + 0.32, z], colour: STAINLESS })
    into.cylinder({ radius: 0.22, height: 0.06, sides: 16 }, { at: [x, floor + 0.65, z], colour: 0x303338 })
    into.ring(
      { radius: 0.22, tube: 0.015 },
      { at: [x, floor + 0.65, z], rotation: [Math.PI / 2, 0, 0], colour: STAINLESS },
    )
  }
}

interface TrayReturnOptions {
  into: BanquetDetailBuilder
  at: [number, number, number]
  floor: number
}

function dressTrayReturnRack(options: TrayReturnOptions): void {
  const { into, at, floor } = options
  const [x, , z] = at
  // Stainless steel tray rack cabinet
  into.box([0.9, 1.4, 0.75], { at: [x, floor + 0.7, z], colour: STAINLESS })
  // Horizontal tray slide shelves
  for (const dy of [0.35, 0.65, 0.95, 1.25]) {
    into.box([0.84, 0.02, 0.7], { at: [x, floor + dy, z], colour: TRAY_SLIDE })
  }
  // Circular waste chute aperture with dark rim
  into.cylinder({ radius: 0.16, height: 0.04, sides: 12 }, { at: [x, floor + 1.42, z], colour: 0x1a1c1e })
}

/** Suspended multi-section illuminated menu boards over the service counter. */
export function dressMenuBoards(context: CounterContext): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at
  const [sizeX, sizeZ] = structure.size
  const y = floor + structure.base + structure.height / 2

  // Background frame
  into.box([sizeX, structure.height, sizeZ], {
    at: [x, y, z],
    colour: MENU_FRAME,
  })

  // 6 Illuminated menu sections
  const count = 6
  const panelLen = (sizeZ - 0.6) / count
  const startZ = z - sizeZ / 2 + 0.3 + panelLen / 2

  for (let i = 0; i < count; i++) {
    const pz = startZ + i * panelLen
    into.box([0.04, structure.height - 0.16, panelLen - 0.15], {
      at: [x + sizeX / 2 + 0.02, y, pz],
      colour: MENU_BG,
    })
    // Glowing header strip showing menu categories
    into.box([0.05, 0.15, panelLen - 0.25], {
      at: [x + sizeX / 2 + 0.03, y + structure.height / 3, pz],
      colour: MENU_TEXT_GLOW,
      glow: true,
    })
  }

  // Vertical steel hanger columns extending to 9 m ceiling and horizontal wall cantilevers
  const ceiling = context.ceiling ?? floor + 9.0
  const topOfBoard = floor + structure.base + structure.height
  const hangerHeight = ceiling - topOfBoard
  const hangerMidY = topOfBoard + hangerHeight / 2
  const wallGap = x - 14.0
  const wallMidX = 14.0 + wallGap / 2

  for (let pz = z - sizeZ / 2 + 2; pz < z + sizeZ / 2; pz += 3.5) {
    into.box([0.06, hangerHeight, 0.06], {
      at: [x, hangerMidY, pz],
      colour: MENU_FRAME,
    })
    into.box([0.2, 0.04, 0.2], {
      at: [x, ceiling - 0.02, pz],
      colour: 0x484239,
    })
    into.box([wallGap, 0.05, 0.05], {
      at: [wallMidX, topOfBoard - 0.15, pz],
      colour: MENU_FRAME,
    })
    into.box([wallGap, 0.05, 0.05], {
      at: [wallMidX, floor + structure.base + 0.15, pz],
      colour: MENU_FRAME,
    })
    into.box([0.02, 0.45, 0.14], {
      at: [14.01, y, pz],
      colour: 0x3d3f44,
    })
  }
}

/** Retro refrigerated drink vending machines with illuminated display and coin slot. */
export function dressVendingMachines(context: CounterContext): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at
  const [sizeX, sizeZ] = structure.size
  const y = floor + structure.base
  const height = structure.height

  // Main cabinet body
  into.box([sizeX, height, sizeZ], {
    at: [x, y + height / 2, z],
    colour: VENDING_BODY,
  })

  // Two adjacent machines (soda & iced tea/coffee)
  const halfZ = sizeZ / 2
  for (const side of [-1, 1]) {
    const unitZ = z + side * (halfZ / 2)
    const unitLen = halfZ - 0.15

    // Illuminated product panel (glow)
    into.box([0.05, height * 0.45, unitLen - 0.1], {
      at: [x - sizeX / 2 - 0.02, y + height * 0.65, unitZ],
      colour: side === -1 ? VENDING_GLOW : VENDING_ACCENT,
      glow: true,
    })

    // Selection buttons row
    into.box([0.04, 0.08, unitLen - 0.2], {
      at: [x - sizeX / 2 - 0.02, y + height * 0.38, unitZ],
      colour: VENDING_TRIM,
    })

    // Coin slot and bill acceptor plate
    into.box([0.04, 0.2, 0.12], {
      at: [x - sizeX / 2 - 0.02, y + height * 0.48, unitZ + 0.25 * side],
      colour: 0x151618,
    })

    // Dispensing bin recess at the bottom
    into.box([0.15, 0.26, unitLen - 0.2], {
      at: [x - sizeX / 2 + 0.05, y + 0.22, unitZ],
      colour: 0x111214,
    })
  }
}
