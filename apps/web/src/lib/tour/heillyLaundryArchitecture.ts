import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import type { Space, Structure } from './types'
import {
  APPLIANCE_TRIM,
  APPLIANCE_WHITE,
  CHROME,
  STATUS_LED_GREEN,
  STEEL_BRUSHED,
  STEEL_DARK,
} from './heillyHideoutDetailSurface'

export interface LaundryContext {
  into: BanquetDetailBuilder
  floor: number
  ceilingHeight: number
  space: Space
  structures: Structure[]
}

interface MachinePlacement {
  at: Point3
  isDryer?: boolean
}

function industrialMachine(into: BanquetDetailBuilder, placement: MachinePlacement): void {
  const [x, floorY, z] = placement.at
  const width = 1.05
  const height = 1.45
  const depth = 1.15
  const centerY = floorY + height / 2

  // Main cabinet
  into.box([width, height, depth], {
    at: [x, centerY, z],
    colour: APPLIANCE_WHITE,
  })
  // Base plinth
  into.box([width + 0.04, 0.12, depth + 0.04], {
    at: [x, floorY + 0.06, z],
    colour: STEEL_DARK,
  })
  // Upper control fascia
  into.box([width - 0.04, 0.28, 0.08], {
    at: [x, floorY + height - 0.16, z + depth / 2 + 0.02],
    colour: APPLIANCE_TRIM,
  })
  // Control dial & buttons
  into.cylinder(
    { radius: 0.045, height: 0.03, sides: 16 },
    {
      at: [x - 0.25, floorY + height - 0.16, z + depth / 2 + 0.07],
      colour: STEEL_BRUSHED,
      rotation: [Math.PI / 2, 0, 0],
    },
  )
  into.box([0.08, 0.04, 0.02], {
    at: [x + 0.2, floorY + height - 0.16, z + depth / 2 + 0.07],
    colour: STATUS_LED_GREEN,
    glow: true,
  })
  // Front porthole door outer rim
  into.ring(
    { radius: 0.32, tube: 0.035 },
    { at: [x, floorY + 0.65, z + depth / 2 + 0.02], rotation: [0, 0, 0], colour: CHROME },
  )
  // Dark inner drum glass
  into.cylinder(
    { radius: 0.3, height: 0.02, sides: 20 },
    {
      at: [x, floorY + 0.65, z + depth / 2 + 0.01],
      colour: 0x181e24,
      rotation: [Math.PI / 2, 0, 0],
    },
  )
  // Handle latch
  into.box([0.04, 0.12, 0.03], {
    at: [x + 0.32, floorY + 0.65, z + depth / 2 + 0.05],
    colour: CHROME,
  })

  // Overhead vent duct for dryers
  if (placement.isDryer) {
    into.cylinder(
      { radius: 0.09, height: 1.8, sides: 12 },
      { at: [x, floorY + height + 0.9, z - 0.2], colour: STEEL_BRUSHED },
    )
  }
}

function machineBank(into: BanquetDetailBuilder, floor: number): void {
  // Line of industrial washers and dryers along the west wall (x = -17.35)
  const zPositions = [1.0, 2.3, 3.6, 4.9, 6.2]
  for (let i = 0; i < zPositions.length; i++) {
    industrialMachine(into, {
      at: [-17.35, floor, zPositions[i]],
      isDryer: i % 2 === 1,
    })
  }

  // Overhead manifold connecting the dryer exhaust ducts
  into.box([0.22, 0.22, 5.8], {
    at: [-17.35, floor + 3.4, 3.6],
    colour: STEEL_BRUSHED,
  })
}

function workTable(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [w, d] = structure.size
  const h = structure.height

  // Stainless steel worktop
  into.box([w, 0.06, d], {
    at: [x, floor + h - 0.03, z],
    colour: STEEL_BRUSHED,
  })
  // Frame skirt
  into.box([w - 0.06, 0.08, d - 0.06], {
    at: [x, floor + h - 0.08, z],
    colour: STEEL_DARK,
  })
  // Four tubular legs
  const halfW = w / 2 - 0.08
  const halfD = d / 2 - 0.08
  for (const dx of [-halfW, halfW]) {
    for (const dz of [-halfD, halfD]) {
      into.cylinder(
        { radius: 0.035, height: h - 0.06, sides: 12 },
        { at: [x + dx, floor + (h - 0.06) / 2, z + dz], colour: STEEL_BRUSHED },
      )
    }
  }
  // Slatted undershelf
  into.box([w - 0.14, 0.03, d - 0.14], {
    at: [x, floor + 0.22, z],
    colour: STEEL_DARK,
  })
  // Laundry sorting crates on table
  into.box([0.7, 0.24, 0.5], {
    at: [x - w * 0.25, floor + h + 0.12, z],
    colour: 0x4a5460,
  })
  into.box([0.7, 0.24, 0.5], {
    at: [x + w * 0.25, floor + h + 0.12, z],
    colour: 0x4a5460,
  })
  // Folded white linen stacks inside
  into.box([0.55, 0.18, 0.4], {
    at: [x - w * 0.25, floor + h + 0.12, z],
    colour: 0xf0f3f6,
  })
  into.box([0.55, 0.18, 0.4], {
    at: [x + w * 0.25, floor + h + 0.12, z],
    colour: 0xe8ecf0,
  })
}

function utilitySink(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [w, d] = structure.size
  const h = structure.height

  // Outer cabinet basin
  into.box([w, h, d], {
    at: [x, floor + h / 2, z],
    colour: STEEL_BRUSHED,
  })
  // Dark inner sink tub
  into.box([w - 0.12, 0.4, d - 0.12], {
    at: [x, floor + h - 0.2, z],
    colour: 0x252a30,
  })
  // Gooseneck mixer faucet
  into.cylinder(
    { radius: 0.02, height: 0.35, sides: 12 },
    { at: [x, floor + h + 0.18, z - d / 2 + 0.08], colour: CHROME },
  )
  into.curve(
    [
      [x, floor + h + 0.35, z - d / 2 + 0.08],
      [x, floor + h + 0.48, z - d / 2 + 0.18],
      [x, floor + h + 0.38, z - d / 2 + 0.28],
    ],
    0.016,
    { at: [0, 0, 0], colour: CHROME },
  )
}

function tallLockers(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [w, d] = structure.size
  const h = structure.height

  // Main locker body
  into.box([w, h, d], {
    at: [x, floor + h / 2, z],
    colour: STEEL_DARK,
  })
  // Vertical locker door seams and handles
  const doors = 3
  const doorW = (w - 0.04) / doors
  for (let i = 0; i < doors; i++) {
    const doorX = x - w / 2 + 0.02 + (i + 0.5) * doorW
    // Door panel relief
    into.box([doorW - 0.03, h - 0.12, 0.02], {
      at: [doorX, floor + h / 2, z + d / 2 + 0.01],
      colour: 0x3d434c,
    })
    // Ventilation louvers
    into.box([doorW - 0.08, 0.14, 0.03], {
      at: [doorX, floor + h - 0.3, z + d / 2 + 0.02],
      colour: STEEL_DARK,
    })
    // Chrome handle
    into.box([0.02, 0.12, 0.04], {
      at: [doorX + doorW / 2 - 0.04, floor + h / 2, z + d / 2 + 0.03],
      colour: CHROME,
    })
  }
}

function wallSupplyShelves(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [w, d] = structure.size
  const h = structure.height

  // Upright brackets
  const posts = 4
  for (let p = 0; p < posts; p++) {
    const postX = x - w / 2 + (p / (posts - 1)) * w
    into.box([0.05, h, d], {
      at: [postX, floor + h / 2, z],
      colour: STEEL_BRUSHED,
    })
  }
  // Shelf tiers
  for (let s = 1; s <= 4; s++) {
    const shelfY = floor + (s / 4.2) * h
    into.box([w, 0.04, d], {
      at: [x, shelfY, z],
      colour: STEEL_DARK,
    })
    // Supply boxes and detergent canisters on shelves
    for (let b = 0; b < 6; b++) {
      const boxX = x - w / 2 + 0.35 + b * 0.7
      into.box([0.35, 0.25, d * 0.75], {
        at: [boxX, shelfY + 0.14, z],
        colour: b % 2 === 0 ? 0xd0d5db : 0x7a838d,
      })
    }
  }
}

export function dressHeillyLaundryArchitecture(context: LaundryContext): void {
  const { into, floor, structures } = context

  // 1. Industrial washer/dryer bank
  machineBank(into, floor)

  // 2. Work tables
  const tables = structures.filter((s) => s.id.includes('work-table'))
  for (const table of tables) {
    workTable(into, table, floor)
  }

  // 3. Utility sink
  const sink = structures.find((s) => s.id.includes('laundry-sink'))
  if (sink) {
    utilitySink(into, sink, floor)
  }

  // 4. Tall lockers
  const lockers = structures.find((s) => s.id.includes('laundry-lockers'))
  if (lockers) {
    tallLockers(into, lockers, floor)
  }

  // 5. Wall supply shelves
  const shelves = structures.find((s) => s.id.includes('laundry-wall-shelves'))
  if (shelves) {
    wallSupplyShelves(into, shelves, floor)
  }
}
