import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import type { Space, Structure } from './types'
import {
  COOLER_BODY,
  FABRIC_CHAIR,
  GLASS_WATER,
  LEATHER_BLACK,
  MONITOR_CASE,
  MONITOR_SCREEN,
  STATUS_LED_GREEN,
  STATUS_LED_RED,
  STEEL_BRUSHED,
  STEEL_DARK,
  WOOD_TABLE,
} from './heillyHideoutDetailSurface'

export interface CommunalContext {
  into: BanquetDetailBuilder
  floor: number
  ceilingHeight: number
  space: Space
  structures: Structure[]
}

function largeTable(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [w, d] = structure.size
  const h = structure.height

  // Solid dark laminate top
  into.box([w, 0.06, d], {
    at: [x, floor + h - 0.03, z],
    colour: WOOD_TABLE,
  })
  // Metal edge trim
  into.box([w + 0.02, 0.02, d + 0.02], {
    at: [x, floor + h - 0.03, z],
    colour: STEEL_DARK,
  })
  // Sturdy steel legs and crossbeam
  const halfW = w / 2 - 0.25
  const halfD = d / 2 - 0.25
  for (const dx of [-halfW, halfW]) {
    into.box([0.1, h - 0.06, d - 0.4], {
      at: [x + dx, floor + (h - 0.06) / 2, z],
      colour: STEEL_DARK,
    })
  }
  // Central stretcher beam
  into.box([w - 0.6, 0.08, 0.12], {
    at: [x, floor + 0.25, z],
    colour: STEEL_DARK,
  })
}

function chair(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const seatY = floor + 0.46

  // Padded seat cushion
  into.box([0.5, 0.08, 0.48], {
    at: [x, seatY, z],
    colour: FABRIC_CHAIR,
  })
  // Padded backrest
  into.box([0.48, 0.44, 0.06], {
    at: [x, seatY + 0.26, z - 0.22],
    colour: FABRIC_CHAIR,
  })
  // Tubular frame legs
  for (const dx of [-0.22, 0.22]) {
    for (const dz of [-0.2, 0.2]) {
      into.cylinder(
        { radius: 0.016, height: 0.44, sides: 10 },
        { at: [x + dx, floor + 0.22, z + dz], colour: STEEL_BRUSHED },
      )
    }
  }
}

function surveillanceMonitorBank(into: BanquetDetailBuilder, floor: number): void {
  // CCTV surveillance screen matrix mounted on the south wall (x around -1 to 2, z = 0.05)
  const wallZ = 0.08
  const baseConsoleY = floor + 0.85

  // Monitor wall rack backing
  into.box([3.2, 1.6, 0.08], {
    at: [0.5, baseConsoleY + 0.9, wallZ],
    colour: MONITOR_CASE,
  })

  // 6 surveillance monitors in 3 columns x 2 rows
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const monX = -0.5 + col * 1.0
      const monY = baseConsoleY + 0.45 + row * 0.72

      // Monitor bezel
      into.box([0.9, 0.62, 0.08], {
        at: [monX, monY, wallZ + 0.06],
        colour: MONITOR_CASE,
      })
      // Surveillance camera display screen (phosphor tint with glow)
      into.box([0.82, 0.54, 0.02], {
        at: [monX, monY, wallZ + 0.11],
        colour: MONITOR_SCREEN,
        glow: true,
      })
      // Status indicator LED
      into.box([0.02, 0.02, 0.01], {
        at: [monX + 0.38, monY - 0.25, wallZ + 0.11],
        colour: row === 0 ? STATUS_LED_GREEN : STATUS_LED_RED,
        glow: true,
      })
    }
  }

  // Operator shelf with keyboard and switcher panel underneath
  into.box([3.4, 0.05, 0.6], {
    at: [0.5, baseConsoleY, wallZ + 0.3],
    colour: STEEL_DARK,
  })
  into.box([0.8, 0.03, 0.26], {
    at: [0.5, baseConsoleY + 0.04, wallZ + 0.35],
    colour: 0x2d3238,
  })
}

function waterDispenser(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const h = structure.height

  // Main cooler body
  into.box([0.42, 0.95, 0.42], {
    at: [x, floor + 0.475, z],
    colour: COOLER_BODY,
  })
  // Black dispense alcove
  into.box([0.34, 0.26, 0.18], {
    at: [x, floor + 0.68, z + 0.12],
    colour: 0x22262a,
  })
  // Hot and cold spigots
  into.box([0.02, 0.06, 0.04], { at: [x - 0.06, floor + 0.75, z + 0.15], colour: 0x2b6cb0 })
  into.box([0.02, 0.06, 0.04], { at: [x + 0.06, floor + 0.75, z + 0.15], colour: 0xc53030 })
  // Blue 5-gallon inverted water bottle
  into.cylinder(
    { radius: 0.18, height: 0.45, sides: 16 },
    { at: [x, floor + 1.18, z], colour: GLASS_WATER },
  )
  into.sphere([0.18, 0.08, 0.18], { at: [x, floor + 1.4, z], colour: GLASS_WATER })
}

function ceilingServices(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [w, d] = structure.size
  const y = floor + structure.base + structure.height / 2

  // Suspended cable ladder tray
  into.box([w, 0.06, d], {
    at: [x, y, z],
    colour: STEEL_BRUSHED,
  })
  // Parallel industrial conduit pipes
  into.cylinder(
    { radius: 0.04, height: w, sides: 12 },
    { at: [x, y + 0.08, z - 0.12], colour: STEEL_DARK, rotation: [0, 0, Math.PI / 2] },
  )
  into.cylinder(
    { radius: 0.03, height: w, sides: 12 },
    { at: [x, y + 0.08, z + 0.12], colour: STEEL_DARK, rotation: [0, 0, Math.PI / 2] },
  )
}

function couch(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [w, d] = structure.size
  const h = structure.height

  // Base and seat cushion
  into.box([w, 0.42, d], {
    at: [x, floor + 0.21, z],
    colour: LEATHER_BLACK,
  })
  // Backrest along wall
  into.box([0.22, h - 0.2, d], {
    at: [x - w / 2 + 0.11, floor + 0.3 + (h - 0.2) / 2, z],
    colour: LEATHER_BLACK,
  })
  // Armrests
  into.box([w, 0.25, 0.18], { at: [x, floor + 0.45, z - d / 2 + 0.09], colour: LEATHER_BLACK })
  into.box([w, 0.25, 0.18], { at: [x, floor + 0.45, z + d / 2 - 0.09], colour: LEATHER_BLACK })
}

export function dressHeillyCommunalArchitecture(context: CommunalContext): void {
  const { into, floor, structures } = context

  // 1. Large communal table
  const table = structures.find((s) => s.id.includes('large-table'))
  if (table) {
    largeTable(into, table, floor)
  }

  // 2. Chairs around the table
  const chairs = structures.filter((s) => s.id.includes('communal-chair'))
  for (const c of chairs) {
    chair(into, c, floor)
  }

  // 3. Surveillance monitor bank / control screens
  surveillanceMonitorBank(into, floor)

  // 4. Water dispenser
  const dispenser = structures.find((s) => s.id.includes('water-dispenser'))
  if (dispenser) {
    waterDispenser(into, dispenser, floor)
  }

  // 5. Ceiling services
  const services = structures.find((s) => s.id.includes('ceiling-services'))
  if (services) {
    ceilingServices(into, services, floor)
  }

  // 6. Lounge couch
  const sofa = structures.find((s) => s.id.includes('couch'))
  if (sofa) {
    couch(into, sofa, floor)
  }
}
