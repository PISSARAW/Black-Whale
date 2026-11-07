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

  // Upright sneeze guard posts and acrylic top rail
  for (let pz = z - sizeZ / 2 + 1; pz < z + sizeZ / 2; pz += 3) {
    into.box([0.03, 0.45, 0.03], {
      at: [x + sizeX / 4, topY + 0.225, pz],
      colour: STAINLESS,
    })
  }
  into.box([0.04, 0.35, sizeZ - 1], {
    at: [x + sizeX / 4, topY + 0.25, z],
    colour: 0xd8e4e8,
  })
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

  // Suspension brackets going upward
  for (let pz = z - sizeZ / 2 + 2; pz < z + sizeZ / 2; pz += 4) {
    into.box([0.04, 1.2, 0.04], {
      at: [x, y + structure.height / 2 + 0.6, pz],
      colour: MENU_FRAME,
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
