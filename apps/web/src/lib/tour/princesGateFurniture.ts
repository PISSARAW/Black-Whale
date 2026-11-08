import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Structure } from './types'

const MAHOGANY = 0x3a1f18
const DESK_TOP = 0x2c1712
const BRONZE = 0x72604c
const GOLD = 0xd4af37
const STEEL = 0x889098
const MONITOR_DARK = 0x1a1a1c
const MONITOR_GLOW = 0x4a7a8c
const LUMEN_WARM = 0xfef5e0
const PAPER_WHITE = 0xf5eedb
const GUN_METAL = 0x2e3236

interface FurnitureContext {
  into: BanquetDetailBuilder
  structure: Structure
  floor: number
}

function counterBody(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [width, length] = structure.size
  const height = structure.height

  // Main counter base in rich dark mahogany
  into.box([width, height, length], {
    at: [x, floor + height / 2, z],
    colour: MAHOGANY,
  })
  // Bronze baseboard moulding
  into.box([width + 0.04, 0.08, length + 0.04], {
    at: [x, floor + 0.04, z],
    colour: BRONZE,
  })
  // Polished transaction top
  into.box([width + 0.08, 0.05, length + 0.08], {
    at: [x, floor + height + 0.025, z],
    colour: DESK_TOP,
  })
  // Gold edge banding
  into.box([width + 0.09, 0.02, length + 0.09], {
    at: [x, floor + height + 0.04, z],
    colour: GOLD,
  })
}

function counterEquipment(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const topY = floor + structure.height + 0.05

  // Open visitor registry logbook
  into.box([0.34, 0.03, 0.44], {
    at: [x - 0.1, topY + 0.015, z - 0.25],
    colour: PAPER_WHITE,
  })
  into.box([0.36, 0.015, 0.46], {
    at: [x - 0.1, topY + 0.007, z - 0.25],
    colour: MAHOGANY,
  })

  // Security surveillance monitor screen
  into.box([0.06, 0.28, 0.38], {
    at: [x + 0.12, topY + 0.22, z + 0.3],
    colour: MONITOR_DARK,
    rotation: [0, -0.2, 0],
  })
  into.box([0.01, 0.24, 0.34], {
    at: [x + 0.09, topY + 0.22, z + 0.3],
    colour: MONITOR_GLOW,
    glow: true,
    rotation: [0, -0.2, 0],
  })
  into.box([0.16, 0.02, 0.14], {
    at: [x + 0.12, topY + 0.01, z + 0.3],
    colour: STEEL,
  })

  // Brass desk lamp with warm glow
  into.cylinder(
    { radius: 0.07, height: 0.02 },
    { at: [x - 0.25, topY + 0.01, z + 0.5], colour: BRONZE },
  )
  into.box([0.02, 0.32, 0.02], {
    at: [x - 0.25, topY + 0.17, z + 0.5],
    colour: BRONZE,
  })
  into.box([0.14, 0.08, 0.1], {
    at: [x - 0.2, topY + 0.32, z + 0.48],
    colour: LUMEN_WARM,
    glow: true,
  })
}

function counterSeat(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const chairX = x + 0.65

  // Guard officer chair behind the desk
  into.cylinder({ radius: 0.22, height: 0.06 }, { at: [chairX, floor + 0.52, z], colour: MAHOGANY })
  into.cylinder({ radius: 0.03, height: 0.48 }, { at: [chairX, floor + 0.24, z], colour: STEEL })
  into.cylinder({ radius: 0.26, height: 0.03 }, { at: [chairX, floor + 0.015, z], colour: STEEL })
  into.box([0.05, 0.42, 0.38], {
    at: [chairX + 0.18, floor + 0.76, z],
    colour: MAHOGANY,
  })
}

export function dressGateDesk(context: FurnitureContext): void {
  const { into, structure, floor } = context
  counterBody(into, structure, floor)
  counterEquipment(into, structure, floor)
  counterSeat(into, structure, floor)
}

export function dressWeaponRack(into: BanquetDetailBuilder, floor: number): void {
  // Wall-mounted military arms rack
  const rx = 15.6,
    rz = -6.42
  into.box([0.9, 1.2, 0.1], {
    at: [rx, floor + 1.2, rz],
    colour: MAHOGANY,
  })
  for (const dx of [-0.28, 0, 0.28]) {
    into.box([0.05, 0.95, 0.08], {
      at: [rx + dx, floor + 1.2, rz + 0.08],
      colour: GUN_METAL,
    })
  }
}
