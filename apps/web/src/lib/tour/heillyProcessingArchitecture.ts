import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import type { Space, Structure } from './types'
import {
  CHROME,
  NEN_DEEP,
  NEN_GLOW,
  NEN_PURPLE,
  STEEL_BRUSHED,
  STEEL_DARK,
  TILE_BORDER,
  TILE_WHITE,
} from './heillyHideoutDetailSurface'

export interface ProcessingContext {
  into: BanquetDetailBuilder
  floor: number
  ceilingHeight: number
  space: Space
  structures: Structure[]
}

interface DoorPlacement {
  at: Point3
  rotY: number
  label?: string
}

function whiteTileWainscoting(context: ProcessingContext): void {
  const { into, floor } = context
  const minX = -18.4
  const maxX = -7.88
  const minZ = -11.9
  const maxZ = -6.65
  const widthX = maxX - minX
  const depthZ = maxZ - minZ
  const wainscotHeight = 2.4

  // North wall tile wainscot
  into.box([widthX, wainscotHeight, 0.05], {
    at: [(minX + maxX) / 2, floor + wainscotHeight / 2, maxZ - 0.03],
    colour: TILE_WHITE,
  })
  // South wall tile wainscot
  into.box([widthX, wainscotHeight, 0.05], {
    at: [(minX + maxX) / 2, floor + wainscotHeight / 2, minZ + 0.03],
    colour: TILE_WHITE,
  })
  // West wall tile wainscot
  into.box([0.05, wainscotHeight, depthZ], {
    at: [minX + 0.03, floor + wainscotHeight / 2, (minZ + maxZ) / 2],
    colour: TILE_WHITE,
  })
  // East wall tile wainscot
  into.box([0.05, wainscotHeight, depthZ], {
    at: [maxX - 0.03, floor + wainscotHeight / 2, (minZ + maxZ) / 2],
    colour: TILE_WHITE,
  })
  // Baseboard trim
  into.box([widthX, 0.12, 0.08], {
    at: [(minX + maxX) / 2, floor + 0.06, maxZ - 0.04],
    colour: TILE_BORDER,
  })
  into.box([widthX, 0.12, 0.08], {
    at: [(minX + maxX) / 2, floor + 0.06, minZ + 0.04],
    colour: TILE_BORDER,
  })
}

function nenBarrierWard(context: ProcessingContext): void {
  const { into, floor } = context
  const minX = -18.4
  const maxX = -7.88
  const minZ = -11.9
  const maxZ = -6.65
  const widthX = maxX - minX
  const depthZ = maxZ - minZ
  const wardY = floor + 2.42

  // Glowing Nen barrier circuit along the perimeter walls
  into.box([widthX - 0.2, 0.05, 0.06], {
    at: [(minX + maxX) / 2, wardY, maxZ - 0.04],
    colour: NEN_PURPLE,
  })
  into.box([widthX - 0.2, 0.02, 0.07], {
    at: [(minX + maxX) / 2, wardY, maxZ - 0.04],
    colour: NEN_GLOW,
    glow: true,
  })
  into.box([widthX - 0.2, 0.05, 0.06], {
    at: [(minX + maxX) / 2, wardY, minZ + 0.04],
    colour: NEN_PURPLE,
  })
  into.box([widthX - 0.2, 0.02, 0.07], {
    at: [(minX + maxX) / 2, wardY, minZ + 0.04],
    colour: NEN_GLOW,
    glow: true,
  })
  into.box([0.06, 0.05, depthZ - 0.2], {
    at: [minX + 0.04, wardY, (minZ + maxZ) / 2],
    colour: NEN_PURPLE,
  })
  into.box([0.07, 0.02, depthZ - 0.2], {
    at: [minX + 0.04, wardY, (minZ + maxZ) / 2],
    colour: NEN_GLOW,
    glow: true,
  })
  into.box([0.06, 0.05, depthZ - 0.2], {
    at: [maxX - 0.04, wardY, (minZ + maxZ) / 2],
    colour: NEN_PURPLE,
  })
  // Vertical Nen conduits in corners
  for (const cornerX of [minX + 0.05, maxX - 0.05]) {
    for (const cornerZ of [minZ + 0.05, maxZ - 0.05]) {
      into.box([0.06, 2.5, 0.06], {
        at: [cornerX, floor + 1.25, cornerZ],
        colour: NEN_DEEP,
      })
      into.box([0.03, 2.4, 0.03], {
        at: [cornerX, floor + 1.25, cornerZ],
        colour: NEN_GLOW,
        glow: true,
      })
    }
  }
}

function singleDoor(into: BanquetDetailBuilder, door: DoorPlacement): void {
  const [x, y, z] = door.at
  const rot = [0, door.rotY, 0] as Point3
  const doorWidth = 0.95
  const doorHeight = 2.15

  // Heavy steel door frame
  into.box([doorWidth + 0.14, doorHeight + 0.08, 0.14], {
    at: [x, y + (doorHeight + 0.08) / 2, z],
    rotation: rot,
    colour: STEEL_DARK,
  })
  // Recessed door panel
  into.box([doorWidth, doorHeight, 0.06], {
    at: [x, y + doorHeight / 2, z],
    rotation: rot,
    colour: 0x22272e,
  })
  // Chrome handle and latch
  into.box([0.04, 0.14, 0.1], {
    at: [x + 0.38, y + 1.02, z],
    rotation: rot,
    colour: CHROME,
  })
  // Door number plate above
  into.box([0.18, 0.07, 0.08], {
    at: [x, y + doorHeight - 0.1, z],
    rotation: rot,
    colour: STEEL_BRUSHED,
  })
}

function sevenDoors(context: ProcessingContext): void {
  const { into, floor } = context
  const northZ = -6.65 + 0.06
  const westX = -18.4 + 0.06
  const southZ = -11.9 + 0.06

  // 5 doors on north wall (WC 1, WC 2, WC 3, Bath, Shower cubicle)
  const northDoorsX = [-16.7, -15.1, -13.5, -11.9, -10.3]
  for (const doorX of northDoorsX) {
    singleDoor(into, { at: [doorX, floor, northZ], rotY: 0 })
  }
  // 1 door on west wall (maintenance closet)
  singleDoor(into, { at: [westX, floor, -9.25], rotY: Math.PI / 2 })
  // 1 door on south wall (portal route)
  singleDoor(into, { at: [-13.14, floor, southZ], rotY: 0 })
}

function showerStation(into: BanquetDetailBuilder, at: Point3): void {
  const [x, floorY, z] = at
  const wallZ = z - 0.08

  // Vertical chrome riser rail
  into.cylinder(
    { radius: 0.018, height: 1.6, sides: 12 },
    { at: [x, floorY + 1.3, wallZ + 0.06], colour: CHROME },
  )
  // Wall mount brackets
  into.box([0.06, 0.05, 0.08], { at: [x, floorY + 0.55, wallZ + 0.04], colour: STEEL_BRUSHED })
  into.box([0.06, 0.05, 0.08], { at: [x, floorY + 2.05, wallZ + 0.04], colour: STEEL_BRUSHED })
  // Mixer unit with control valve
  into.box([0.22, 0.1, 0.12], { at: [x, floorY + 1.05, wallZ + 0.07], colour: CHROME })
  into.cylinder(
    { radius: 0.025, height: 0.06, sides: 12 },
    { at: [x, floorY + 1.05, wallZ + 0.14], colour: CHROME, rotation: [Math.PI / 2, 0, 0] },
  )
  // Shower head
  into.cylinder(
    { radius: 0.07, height: 0.04, bottom: 0.09, sides: 16 },
    { at: [x, floorY + 2.1, wallZ + 0.18], colour: CHROME, rotation: [0.35, 0, 0] },
  )
  // Hanging flexible shower hose
  into.curve(
    [
      [x - 0.06, floorY + 1.0, wallZ + 0.07],
      [x - 0.12, floorY + 0.5, wallZ + 0.12],
      [x - 0.04, floorY + 0.25, wallZ + 0.14],
      [x, floorY + 0.08, wallZ + 0.2],
    ],
    0.012,
    { at: [0, 0, 0], colour: CHROME },
  )
}

function floorDrain(into: BanquetDetailBuilder, at: Point3): void {
  const [x, floorY, z] = at
  const y = floorY + 0.005

  // Stainless outer ring flush with floor
  into.ring({ radius: 0.28, tube: 0.02 }, { at: [x, y, z], rotation: [Math.PI / 2, 0, 0], colour: STEEL_BRUSHED })
  // Recessed dark well
  into.cylinder({ radius: 0.26, height: 0.02, sides: 16 }, { at: [x, y - 0.01, z], colour: 0x14181c })
  // Drain cross grating
  into.box([0.5, 0.006, 0.03], { at: [x, y, z], colour: STEEL_DARK })
  into.box([0.03, 0.006, 0.5], { at: [x, y, z], colour: STEEL_DARK })
}

function maintenanceShelves(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const h = structure.height
  const halfH = h / 2

  // Frame uprights
  into.box([0.65, h, 0.05], { at: [x, floor + halfH, z - 1.15], colour: STEEL_BRUSHED })
  into.box([0.65, h, 0.05], { at: [x, floor + halfH, z + 1.15], colour: STEEL_BRUSHED })
  // Shelves
  for (let s = 0; s < 5; s++) {
    const shelfY = floor + 0.15 + s * 0.48
    into.box([0.62, 0.03, 2.3], { at: [x, shelfY, z], colour: STEEL_DARK })
    // Bottles and jugs on shelf
    for (let j = -3; j <= 3; j++) {
      const bottleZ = z + j * 0.32
      into.cylinder(
        { radius: 0.06, height: 0.26, sides: 8 },
        { at: [x + 0.05, shelfY + 0.15, bottleZ], colour: 0xd8dde2 },
      )
    }
  }
}

export function dressHeillyProcessingArchitecture(context: ProcessingContext): void {
  const { into, floor, structures } = context
  whiteTileWainscoting(context)
  nenBarrierWard(context)
  sevenDoors(context)

  // Shower stations
  const showerStations = structures.filter((s) => s.id.includes('shower-rail'))
  if (showerStations.length > 0) {
    for (const station of showerStations) {
      showerStation(into, [station.at[0], floor, station.at[1]])
    }
  } else {
    showerStation(into, [-17.4, floor, -11.35])
    showerStation(into, [-15.7, floor, -11.35])
  }
  showerStation(into, [-14.0, floor, -11.35])

  // Floor drains
  const drains = structures.filter((s) => s.id.includes('floor-drain'))
  if (drains.length > 0) {
    for (const drain of drains) {
      floorDrain(into, [drain.at[0], floor, drain.at[1]])
    }
  } else {
    floorDrain(into, [-13.6, floor, -9.2])
    floorDrain(into, [-11.8, floor, -9.2])
  }

  // Maintenance shelves
  const shelf = structures.find((s) => s.id.includes('maintenance-shelves'))
  if (shelf) {
    maintenanceShelves(into, shelf, floor)
  }
}
