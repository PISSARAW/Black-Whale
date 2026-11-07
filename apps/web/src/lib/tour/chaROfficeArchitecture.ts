import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import {
  BRASS_ACCENT,
  CHROME_BRIGHT,
  DOOR_WOOD_PANELED,
  LED_ONLINE_GREEN,
  LED_RECORDING_RED,
  MONITOR_HOUSING,
  OFFICE_WOOD_DARK,
  SPOTLIGHT_WARM,
  STEEL_BRUSHED,
  STEEL_CUTOUT_DARK,
  STEEL_DARK,
  STEEL_GRAPHITE,
  STEEL_ROBOT_FACE,
  STEEL_VAULT,
  WHITE_DOOR_ENAMEL,
  WHITE_FRAME,
  WOOD_TRIM,
} from './chaROfficeDetailSurface'
import type { Vec2 } from './types'

interface DoorPlacement {
  into: BanquetDetailBuilder
  floor: number
  at: Vec2
}

/** The heavy steel vault door with a raised treasure-chest panel and turning wheel. */
export function dressTreasureChestDoor(placement: DoorPlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Steel casing frame
  into.box([0.2, 2.3, 1.4], { at: [x, floor + 1.15, z], colour: STEEL_DARK })
  // Main vault door slab
  into.box([0.14, 2.15, 1.2], { at: [x + 0.02, floor + 1.15, z], colour: STEEL_VAULT })
  // Raised treasure-chest center panel
  into.box([0.06, 1.3, 0.8], { at: [x + 0.08, floor + 1.25, z], colour: STEEL_BRUSHED })

  // Vault turning wheel (three spokes and central boss)
  into.cylinder(
    { radius: 0.16, height: 0.05, sides: 16 },
    { at: [x + 0.13, floor + 1.25, z], colour: STEEL_VAULT, rotation: [0, 0, Math.PI / 2] },
  )
  into.cylinder(
    { radius: 0.06, height: 0.09, sides: 12 },
    { at: [x + 0.15, floor + 1.25, z], colour: BRASS_ACCENT, rotation: [0, 0, Math.PI / 2] },
  )
  for (let s = 0; s < 3; s++) {
    const angle = (s * Math.PI * 2) / 3
    into.box([0.03, 0.28, 0.04], {
      at: [x + 0.14, floor + 1.25, z],
      colour: STEEL_BRUSHED,
      rotation: [angle, 0, 0],
    })
  }

  // Heavy perimeter locking bolts / rivets
  for (let i = 0; i < 4; i++) {
    const bz = z - 0.5 + i * 0.33
    into.sphere([0.02, 0.02, 0.02], { at: [x + 0.1, floor + 0.25, bz], colour: STEEL_BRUSHED })
    into.sphere([0.02, 0.02, 0.02], { at: [x + 0.1, floor + 2.05, bz], colour: STEEL_BRUSHED })
  }
}

/** The secret passage metal door featuring four dark cutouts arranged like a robot's face. */
export function dressRobotFacedDoor(placement: DoorPlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Outer steel door jamb
  into.box([0.2, 2.5, 1.4], { at: [x, floor + 1.25, z], colour: STEEL_DARK })
  // Main door leaf concealing the secret passageway
  into.box([0.14, 2.35, 1.2], { at: [x + 0.02, floor + 1.25, z], colour: STEEL_ROBOT_FACE })

  // Two horizontal rectangular eye cutouts
  into.box([0.03, 0.1, 0.28], { at: [x + 0.1, floor + 1.65, z - 0.26], colour: STEEL_CUTOUT_DARK })
  into.box([0.03, 0.1, 0.28], { at: [x + 0.1, floor + 1.65, z + 0.26], colour: STEEL_CUTOUT_DARK })

  // Two lower rectangular feet / mouth cutouts
  into.box([0.03, 0.18, 0.18], { at: [x + 0.1, floor + 0.65, z - 0.22], colour: STEEL_CUTOUT_DARK })
  into.box([0.03, 0.18, 0.18], { at: [x + 0.1, floor + 0.65, z + 0.22], colour: STEEL_CUTOUT_DARK })

  // Concealed secret passage border seam
  into.box([0.02, 2.3, 0.02], { at: [x + 0.09, floor + 1.25, z - 0.58], colour: STEEL_CUTOUT_DARK })
  into.box([0.02, 2.3, 0.02], { at: [x + 0.09, floor + 1.25, z + 0.58], colour: STEEL_CUTOUT_DARK })
  into.box([0.02, 0.02, 1.18], { at: [x + 0.09, floor + 2.38, z], colour: STEEL_CUTOUT_DARK })
}

/** The third door of the main office: traditional paneled wood door with brass lever. */
export function dressWoodenDoor(placement: DoorPlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Wood door frame
  into.box([0.2, 2.5, 1.4], { at: [x, floor + 1.25, z], colour: OFFICE_WOOD_DARK })
  // Stained timber door slab
  into.box([0.12, 2.35, 1.18], { at: [x + 0.02, floor + 1.25, z], colour: DOOR_WOOD_PANELED })

  // Four recessed molded panels
  for (let row = 0; row < 2; row++) {
    const py = floor + 0.65 + row * 1.05
    for (let col = -1; col <= 1; col += 2) {
      const pz = z + col * 0.26
      into.box([0.03, 0.8, 0.36], { at: [x + 0.08, py, pz], colour: WOOD_TRIM })
    }
  }

  // Brass backplate and lever handle
  into.box([0.04, 0.22, 0.06], { at: [x + 0.09, floor + 1.05, z + 0.42], colour: BRASS_ACCENT })
  into.cylinder(
    { radius: 0.015, height: 0.12, sides: 8 },
    { at: [x + 0.12, floor + 1.08, z + 0.46], colour: BRASS_ACCENT, rotation: [0, 0, Math.PI / 2] },
  )
}

/** The clean white door leading into the CCTV monitor room. */
export function dressWhiteDoor(placement: DoorPlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // White frame casing
  into.box([1.4, 2.5, 0.2], { at: [x, floor + 1.25, z], colour: WHITE_FRAME })
  // White enameled door leaf
  into.box([1.18, 2.35, 0.12], { at: [x, floor + 1.25, z + 0.02], colour: WHITE_DOOR_ENAMEL })

  // Polished chrome hardware
  into.box([0.06, 0.2, 0.03], { at: [x + 0.42, floor + 1.05, z + 0.08], colour: CHROME_BRIGHT })
  into.cylinder(
    { radius: 0.015, height: 0.12, sides: 8 },
    { at: [x + 0.46, floor + 1.08, z + 0.1], colour: CHROME_BRIGHT, rotation: [Math.PI / 2, 0, 0] },
  )
}

/** The smart-lock entrance door and dual security cameras in the office hall. */
export function dressSmartLockEntrance(placement: DoorPlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Heavy steel door casing
  into.box([1.4, 2.6, 0.2], { at: [x, floor + 1.3, z], colour: STEEL_DARK })
  into.box([1.18, 2.45, 0.12], { at: [x, floor + 1.3, z + 0.02], colour: STEEL_VAULT })

  // Electronic smart-card reader & keypad box
  into.box([0.18, 0.28, 0.08], { at: [x + 0.48, floor + 1.2, z + 0.1], colour: STEEL_GRAPHITE })
  into.box([0.04, 0.04, 0.02], {
    at: [x + 0.48, floor + 1.3, z + 0.14],
    colour: LED_ONLINE_GREEN,
    glow: true,
  })

  // Overhead dual CCTV surveillance cameras
  const barY = floor + 2.7
  into.box([0.8, 0.06, 0.06], { at: [x, barY, z + 0.2], colour: STEEL_DARK })
  for (const side of [-0.3, 0.3]) {
    into.box([0.12, 0.1, 0.22], {
      at: [x + side, barY - 0.08, z + 0.28],
      colour: MONITOR_HOUSING,
      rotation: [0.35, side < 0 ? -0.25 : 0.25, 0],
    })
    into.sphere([0.02, 0.02, 0.02], {
      at: [x + side, barY - 0.12, z + 0.38],
      colour: LED_RECORDING_RED,
      glow: true,
    })
  }
}

/** Adds industrial ceiling conduits and caged lighting fixtures to any office room. */
export function dressIndustrialCeiling(options: {
  into: BanquetDetailBuilder
  floor: number
  ceilingHeight: number
  center: Point3
  length: number
}): void {
  const { into, floor, ceilingHeight, center, length } = options
  const topY = floor + ceilingHeight

  // Industrial steel pipe running along the ceiling
  into.cylinder(
    { radius: 0.04, height: length, sides: 12 },
    {
      at: [center[0], topY - 0.15, center[2]],
      colour: STEEL_BRUSHED,
      rotation: [0, 0, Math.PI / 2],
    },
  )

  // Ceiling light boxes with warm diffusers
  const numLamps = Math.max(2, Math.floor(length / 5))
  const step = length / (numLamps + 1)
  for (let i = 1; i <= numLamps; i++) {
    const lx = center[0] - length / 2 + i * step
    into.box([0.5, 0.08, 0.35], { at: [lx, topY - 0.05, center[2]], colour: STEEL_DARK })
    into.box([0.42, 0.03, 0.27], {
      at: [lx, topY - 0.09, center[2]],
      colour: SPOTLIGHT_WARM,
      glow: true,
    })
  }
}
