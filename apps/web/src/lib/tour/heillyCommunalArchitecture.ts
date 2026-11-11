import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Space, Structure } from './types'
import {
  COOLER_BODY,
  FABRIC_CHAIR,
  GLASS_WATER,
  LEATHER_BLACK,
  APPLIANCE_TRIM,
  APPLIANCE_WHITE,
  CHROME,
  STEEL_BRUSHED,
  STEEL_DARK,
  WOOD_MAFIA,
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

function wallBookcase(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [w, d] = structure.size
  const h = structure.height

  into.box([w, h, d], { at: [x, floor + h / 2, z], colour: WOOD_MAFIA })
  into.box([w - 0.16, h - 0.16, d + 0.02], {
    at: [x, floor + h / 2, z + 0.02],
    colour: 0x18191b,
  })

  const columns = 5
  const shelves = 6
  for (let row = 0; row <= shelves; row++) {
    const y = floor + 0.1 + (row * (h - 0.2)) / shelves
    into.box([w - 0.1, 0.05, d + 0.08], { at: [x, y, z], colour: WOOD_MAFIA })
  }
  for (let col = 1; col < columns; col++) {
    const dividerX = x - w / 2 + (col * w) / columns
    into.box([0.05, h - 0.12, d + 0.06], {
      at: [dividerX, floor + h / 2, z],
      colour: WOOD_MAFIA,
    })
  }

  const bookColours = [0x6c4b3a, 0x455364, 0x6a3030, 0xb5a98f, 0x33483b]
  for (let row = 0; row < shelves; row++) {
    for (let index = 0; index < 22; index++) {
      const bookWidth = (w - 0.35) / 22
      const bookHeight = 0.18 + ((index + row) % 4) * 0.035
      into.box([bookWidth * 0.78, bookHeight, d * 0.62], {
        at: [
          x - w / 2 + 0.18 + index * bookWidth,
          floor + 0.14 + (row * (h - 0.2)) / shelves + bookHeight / 2,
          z + d * 0.2,
        ],
        colour: bookColours[(index + row) % bookColours.length],
      })
    }
  }
}

function kitchenette(into: BanquetDetailBuilder, floor: number): void {
  const wallX = 5.48
  const centreZ = 4.6

  // Lower cabinets and continuous worktop along the right-hand wall.
  into.box([0.62, 0.86, 4.5], {
    at: [wallX, floor + 0.43, centreZ],
    colour: APPLIANCE_WHITE,
  })
  into.box([0.72, 0.07, 4.62], {
    at: [wallX - 0.03, floor + 0.9, centreZ],
    colour: STEEL_BRUSHED,
  })
  for (const z of [3.15, 4.15, 5.15, 6.15]) {
    into.box([0.04, 0.62, 0.04], {
      at: [wallX - 0.34, floor + 0.46, z],
      colour: APPLIANCE_TRIM,
    })
    into.box([0.025, 0.12, 0.18], {
      at: [wallX - 0.37, floor + 0.53, z + 0.32],
      colour: CHROME,
    })
  }

  // Sink basin and arched tap.
  into.box([0.12, 0.07, 0.9], {
    at: [wallX - 0.35, floor + 0.94, 5.55],
    colour: CHROME,
  })
  into.curve(
    [
      [wallX - 0.52, floor + 0.94, 5.5],
      [wallX - 0.56, floor + 1.2, 5.5],
      [wallX - 0.72, floor + 1.24, 5.5],
    ],
    0.018,
    { at: [0, 0, 0], colour: CHROME },
  )

  // Upper cupboards, open shelf and the tall refrigerator visible at right.
  for (const z of [3.4, 4.45, 5.5]) {
    into.box([0.48, 0.72, 0.95], {
      at: [wallX + 0.02, floor + 2.05, z],
      colour: APPLIANCE_WHITE,
    })
    into.box([0.035, 0.2, 0.03], {
      at: [wallX - 0.24, floor + 2.05, z + 0.34],
      colour: APPLIANCE_TRIM,
    })
  }
  into.box([0.88, 1.85, 0.88], {
    at: [5.22, floor + 0.925, 7.05],
    colour: APPLIANCE_WHITE,
  })
  into.box([0.05, 0.48, 0.035], {
    at: [4.75, floor + 1.1, 7.3],
    colour: APPLIANCE_TRIM,
  })

  // Kettle, rice cooker and stacked bowls on the counter.
  into.cylinder(
    { radius: 0.16, height: 0.26, sides: 14 },
    { at: [5.02, floor + 1.06, 3.05], colour: STEEL_DARK },
  )
  into.sphere([0.18, 0.12, 0.18], {
    at: [5.02, floor + 1.22, 3.05],
    colour: APPLIANCE_WHITE,
  })
  for (let index = 0; index < 4; index++) {
    into.cylinder(
      { radius: 0.13 - index * 0.012, height: 0.035, sides: 16 },
      { at: [5.04, floor + 0.94 + index * 0.035, 4.2], colour: 0xd8d2c4 },
    )
  }
}

function wallDetails(into: BanquetDetailBuilder, floor: number): void {
  // Circular wall fan/clock on the left and notice boards above the kitchenette.
  into.ring(
    { radius: 0.32, tube: 0.035 },
    { at: [-4.58, floor + 2.45, 1.35], rotation: [0, Math.PI / 2, 0], colour: STEEL_DARK },
  )
  for (const angle of [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4]) {
    into.box([0.025, 0.52, 0.07], {
      at: [-4.54, floor + 2.45, 1.35],
      rotation: [angle, 0, Math.PI / 2],
      colour: STEEL_DARK,
    })
  }
  into.box([0.055, 1.05, 1.5], {
    at: [5.66, floor + 2.05, 1.55],
    colour: 0x8a765b,
  })
  for (const [y, z, h, d] of [
    [2.25, 1.1, 0.34, 0.42],
    [1.95, 1.7, 0.42, 0.55],
    [2.42, 2.0, 0.28, 0.35],
  ] as const) {
    into.box([0.065, h, d], { at: [5.61, floor + y, z], colour: 0xe4dfd2 })
  }
}

function livedInClutter(into: BanquetDetailBuilder, floor: number): void {
  // Cups, bowls, cans and papers scattered across the shared table.
  const tabletop: readonly [number, number, number, number][] = [
    [-1.55, 4.8, 0.07, 0xb8b1a4],
    [-0.65, 5.52, 0.08, 0xd7d0c0],
    [0.18, 4.65, 0.06, 0x7f3434],
    [1.05, 5.68, 0.08, 0x8f9aa2],
    [1.92, 4.85, 0.06, 0xd7d0c0],
    [2.62, 5.5, 0.07, 0x6b7f58],
  ]
  for (const [x, z, radius, colour] of tabletop) {
    into.cylinder({ radius, height: 0.13, sides: 12 }, { at: [x, floor + 0.83, z], colour })
  }
  for (const [x, z, angle] of [
    [-1.1, 5.15, 0.14],
    [0.55, 5.2, -0.2],
    [2.15, 5.1, 0.25],
  ]) {
    into.box([0.48, 0.018, 0.32], {
      at: [x, floor + 0.79, z],
      rotation: [0, angle, 0],
      colour: 0xd6d0c2,
    })
  }

  // Bags, cartons, bottles and bins make the floor read as the crowded panel.
  const floorObjects: readonly [number, number, number, number, number][] = [
    [-3.6, 2.3, 0.55, 0.36, 0x6b6257],
    [-2.8, 1.15, 0.4, 0.52, 0x8d7b61],
    [-1.9, 2.25, 0.32, 0.28, 0x494c50],
    [3.65, 1.25, 0.46, 0.62, 0x54575b],
    [4.15, 6.85, 0.5, 0.42, 0x7a6c55],
  ]
  for (const [x, z, w, h, colour] of floorObjects) {
    into.box([w, h, w * 0.78], { at: [x, floor + h / 2, z], colour })
  }
  for (const [x, z] of [
    [-3.2, 3.15],
    [3.9, 2.4],
    [4.45, 2.15],
  ] as const) {
    into.cylinder(
      { radius: 0.055, height: 0.22, sides: 10 },
      { at: [x, floor + 0.11, z], colour: 0x4f5d48 },
    )
  }
}

function waterDispenser(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at

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

  // Repeated transverse rails and fluorescent fittings reproduce the dense
  // rectilinear ceiling visible across the whole chapter 399 panel.
  for (let zOffset = -2.5; zOffset <= 4.8; zOffset += 1.15) {
    into.box([9.7, 0.055, 0.055], {
      at: [0.5, y + 0.18, zOffset],
      colour: STEEL_DARK,
    })
  }
  for (const xOffset of [-3.8, -1.4, 1.0, 3.4]) {
    into.box([0.055, 0.05, 7.5], {
      at: [xOffset, y + 0.14, 3.6],
      colour: STEEL_BRUSHED,
    })
  }
  for (const [xOffset, zOffset] of [
    [-2.2, 2.0],
    [1.3, 3.7],
    [3.5, 6.1],
  ] as const) {
    into.box([1.05, 0.045, 0.18], {
      at: [xOffset, y - 0.05, zOffset],
      colour: 0xf3efe2,
      glow: true,
    })
  }
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

  // 3. Full bookcase shown on the rear wall (no invented CCTV bank)
  const storage = structures.find((s) => s.id.includes('wall-storage'))
  if (storage) {
    wallBookcase(into, storage, floor)
  }

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

  // 7. Open kitchenette, wall notices and the lived-in disorder of the panel
  kitchenette(into, floor)
  wallDetails(into, floor)
  livedInClutter(into, floor)
}
