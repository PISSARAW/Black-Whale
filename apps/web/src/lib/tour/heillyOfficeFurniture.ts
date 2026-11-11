import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Space, Structure } from './types'
import {
  FAMICOM_CREAM,
  FAMICOM_RED,
  LEATHER_BLACK,
  MONITOR_CASE,
  SFAMICOM_DARK,
  SFAMICOM_GREY,
  STEEL_DARK,
  WOOD_MAFIA,
} from './heillyHideoutDetailSurface'

export interface OfficeContext {
  into: BanquetDetailBuilder
  floor: number
  ceilingHeight: number
  space: Space
  structures: Structure[]
}

const WOOD_INLAY = 0x8b6546
const WOOD_DARK = 0x261912
const UPHOLSTERY = 0x393236
const PAPER = 0xded8c6
const PANEL_WALL = 0xe8e1d9
const PANEL_FLOOR = 0xbcb5ae

function morenaDesk(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [width, depth] = structure.size
  const height = structure.height

  into.box([width, 0.12, depth], {
    at: [x, floor + height - 0.06, z],
    colour: WOOD_MAFIA,
  })
  for (const stripe of [-0.43, -0.18, 0.18, 0.43]) {
    into.box([width - 0.18, 0.014, 0.045], {
      at: [x, floor + height + 0.008, z + stripe * depth],
      colour: WOOD_INLAY,
    })
  }

  const pedestalX = width / 2 - 0.46
  for (const side of [-1, 1]) {
    into.box([0.78, height - 0.1, depth - 0.16], {
      at: [x + side * pedestalX, floor + (height - 0.1) / 2, z],
      colour: WOOD_DARK,
    })
    for (const drawerY of [0.24, 0.48]) {
      into.box([0.52, 0.025, 0.045], {
        at: [x + side * pedestalX, floor + drawerY, z - depth / 2 - 0.01],
        colour: WOOD_INLAY,
      })
    }
  }
  into.box([width - 0.3, 0.42, 0.08], {
    at: [x, floor + 0.3, z + depth / 2 - 0.06],
    colour: WOOD_DARK,
  })

  for (const [dx, dz, angle] of [
    [-0.55, 0.02, -0.08],
    [-0.28, 0.04, 0.04],
    [0.02, 0.02, -0.03],
  ] as const) {
    into.box([0.24, 0.012, 0.34], {
      at: [x + dx, floor + height + 0.018, z + dz],
      rotation: [0, angle, 0],
      colour: PAPER,
    })
  }
  into.cylinder(
    { radius: 0.055, height: 0.22, sides: 14 },
    { at: [x + 0.8, floor + height + 0.11, z + 0.04], colour: 0xa5a19a },
  )
  into.cylinder(
    { radius: 0.07, height: 0.1, sides: 14, open: true },
    { at: [x + 1.12, floor + height + 0.05, z + 0.08], colour: 0xc6c1b7 },
  )
}

function morenaChair(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const seatY = floor + 0.48

  into.box([0.66, 0.16, 0.62], { at: [x, seatY, z], colour: LEATHER_BLACK })
  into.box([0.68, 0.82, 0.14], {
    at: [x, seatY + 0.43, z - 0.25],
    colour: LEATHER_BLACK,
  })
  into.box([0.5, 0.66, 0.03], {
    at: [x, seatY + 0.43, z - 0.33],
    colour: UPHOLSTERY,
  })
  for (const side of [-1, 1]) {
    const sideX = x + side * 0.38
    into.box([0.1, 1.05, 0.12], {
      at: [sideX, seatY + 0.43, z - 0.25],
      colour: WOOD_DARK,
    })
    into.sphere([0.09, 0.12, 0.09], {
      at: [sideX, seatY + 1.02, z - 0.25],
      colour: WOOD_INLAY,
    })
    into.box([0.1, 0.09, 0.5], {
      at: [sideX, seatY + 0.23, z + 0.02],
      colour: WOOD_DARK,
    })
    into.box([0.09, 0.42, 0.09], {
      at: [sideX, floor + 0.21, z],
      colour: WOOD_DARK,
    })
  }
  into.box([0.82, 0.11, 0.16], {
    at: [x, seatY + 0.91, z - 0.25],
    colour: WOOD_INLAY,
  })
}

function centralSofa(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [width, depth] = structure.size
  const seatY = floor + 0.38

  into.box([width, 0.36, depth - 0.18], {
    at: [x, floor + 0.2, z],
    colour: LEATHER_BLACK,
  })
  const cushionWidth = (width - 0.42) / 3
  for (const offset of [-1, 0, 1]) {
    into.box([cushionWidth, 0.15, depth - 0.38], {
      at: [x + offset * (cushionWidth + 0.04), seatY, z - 0.06],
      colour: 0x4a4245,
    })
    into.box([cushionWidth, 0.62, 0.18], {
      at: [x + offset * (cushionWidth + 0.04), floor + 0.72, z + depth / 2 - 0.13],
      colour: UPHOLSTERY,
    })
  }
  for (const side of [-1, 1]) {
    into.box([0.23, 0.64, depth], {
      at: [x + side * (width / 2 - 0.12), floor + 0.38, z],
      colour: LEATHER_BLACK,
    })
    into.box([0.12, 0.2, 0.12], {
      at: [x + side * (width / 2 - 0.2), floor + 0.1, z - depth / 2 + 0.15],
      colour: WOOD_DARK,
    })
  }
}

function wallBench(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [width, depth] = structure.size
  into.box([width, 0.15, depth], {
    at: [x, floor + 0.48, z],
    colour: UPHOLSTERY,
  })
  into.box([0.13, 0.58, depth], {
    at: [x + width / 2 - 0.08, floor + 0.76, z],
    colour: UPHOLSTERY,
  })
  for (const dz of [-depth / 2 + 0.18, depth / 2 - 0.18]) {
    for (const dx of [-width / 2 + 0.12, width / 2 - 0.12]) {
      into.box([0.07, 0.46, 0.07], {
        at: [x + dx, floor + 0.23, z + dz],
        colour: WOOD_DARK,
      })
    }
  }
}

function televisionConsole(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [width, depth] = structure.size
  const height = structure.height
  into.box([width, height, depth], {
    at: [x, floor + height / 2, z],
    colour: 0x1c1d20,
  })
  const tvY = floor + height + 0.66
  into.box([2.15, 1.3, 0.2], { at: [x, tvY, z], colour: MONITOR_CASE })
  into.box([2.01, 1.15, 0.035], {
    at: [x, tvY, z + depth / 2 + 0.02],
    colour: 0x101215,
  })
  into.box([0.7, 0.06, 0.36], {
    at: [x, floor + height + 0.03, z],
    colour: STEEL_DARK,
  })
}

interface RetroContext {
  into: BanquetDetailBuilder
  structure: Structure
  floor: number
  superFamicom: boolean
}

function retroConsole(context: RetroContext): void {
  const { into, structure, floor, superFamicom } = context
  const [x, z] = structure.at
  const y = floor + structure.base
  const shell = superFamicom ? SFAMICOM_GREY : FAMICOM_CREAM
  const trim = superFamicom ? SFAMICOM_DARK : FAMICOM_RED
  into.box([0.36, 0.11, 0.3], { at: [x, y + 0.055, z], colour: shell })
  into.box([0.25, 0.035, 0.17], { at: [x, y + 0.12, z], colour: trim })
  into.box([0.18, 0.08, 0.035], { at: [x, y + 0.16, z], colour: trim })
}

interface DoorPanel {
  at: readonly [number, number]
  width: number
  rotation: number
}

function panelledDoor(into: BanquetDetailBuilder, floor: number, door: DoorPanel): void {
  const [x, z] = door.at
  const rotation = [0, door.rotation, 0] as const
  const insetX = Math.sin(door.rotation) * 0.035
  const insetZ = -Math.cos(door.rotation) * 0.035
  into.box([door.width, 2.75, 0.055], {
    at: [x, floor + 1.375, z],
    rotation,
    colour: 0x6b5d52,
  })
  for (const y of [0.72, 1.9]) {
    into.box([door.width - 0.25, 0.78, 0.035], {
      at: [x + insetX, floor + y, z + insetZ],
      rotation,
      colour: 0x85766a,
    })
    into.box([door.width - 0.42, 0.58, 0.025], {
      at: [x + insetX * 1.6, floor + y, z + insetZ * 1.6],
      rotation,
      colour: 0x51463e,
    })
  }
}

function roomArchitecture(context: OfficeContext): void {
  const { into, floor, space } = context
  const xs = space.footprint.map(([x]) => x)
  const zs = space.footprint.map(([, z]) => z)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)

  into.box([maxX - minX - 0.1, 0.025, maxZ - minZ - 0.1], {
    at: [(minX + maxX) / 2, floor + 0.013, (minZ + maxZ) / 2],
    colour: PANEL_FLOOR,
    glow: true,
  })
  into.box([maxX - minX, 3.15, 0.035], {
    at: [(minX + maxX) / 2, floor + 1.575, maxZ - 0.03],
    colour: PANEL_WALL,
    glow: true,
  })
  into.box([0.035, 3.15, maxZ - minZ], {
    at: [maxX - 0.03, floor + 1.575, (minZ + maxZ) / 2],
    colour: PANEL_WALL,
    glow: true,
  })
  into.box([0.035, 3.15, maxZ - minZ], {
    at: [minX + 0.03, floor + 1.575, (minZ + maxZ) / 2],
    colour: PANEL_WALL,
    glow: true,
  })
  into.box([maxX - minX, 0.16, 0.08], {
    at: [(minX + maxX) / 2, floor + 0.08, maxZ - 0.04],
    colour: WOOD_DARK,
  })
  into.box([0.08, 0.16, maxZ - minZ], {
    at: [maxX - 0.04, floor + 0.08, (minZ + maxZ) / 2],
    colour: WOOD_DARK,
  })
  panelledDoor(into, floor, { at: [10.45, maxZ - 0.075], width: 1.35, rotation: 0 })
  panelledDoor(into, floor, { at: [13.55, maxZ - 0.075], width: 1.75, rotation: 0 })
  panelledDoor(into, floor, {
    at: [maxX - 0.075, 5.25],
    width: 1.75,
    rotation: Math.PI / 2,
  })
}

const find = (structures: Structure[], ending: string): Structure | undefined =>
  structures.find(({ id }) => id.endsWith(ending))

/** The supplied panel's sparse audience layout, while retaining the later TV evidence. */
export function dressHeillyOffice(context: OfficeContext): void {
  const { into, floor, structures } = context
  roomArchitecture(context)

  const desk = find(structures, '-card-table')
  const dealerChair = find(structures, '-dealer-chair')
  const couch = find(structures, '-office-couch')
  const bench = find(structures, '-wall-bench')
  const television = find(structures, '-console')
  const famicom = find(structures, '-famicom')
  const superFamicom = find(structures, '-super-famicom')

  if (desk) morenaDesk(into, desk, floor)
  if (dealerChair) morenaChair(into, dealerChair, floor)
  if (couch) centralSofa(into, couch, floor)
  if (bench) wallBench(into, bench, floor)
  if (television) televisionConsole(into, television, floor)
  if (famicom) retroConsole({ into, structure: famicom, floor, superFamicom: false })
  if (superFamicom) {
    retroConsole({ into, structure: superFamicom, floor, superFamicom: true })
  }
}
