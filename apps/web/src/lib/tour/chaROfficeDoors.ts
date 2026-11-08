import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  ACOUSTIC_SEAL,
  BRASS_ACCENT,
  CHROME_BRIGHT,
  DOOR_WOOD_PANELED,
  LED_ONLINE_GREEN,
  OFFICE_WOOD_DARK,
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

export interface DoorPlacement {
  into: BanquetDetailBuilder
  floor: number
  at: Vec2
}

/** The heavy steel vault door with a raised treasure-chest panel and turning wheel. */
export function dressTreasureChestDoor(placement: DoorPlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Steel casing frame and threshold sill
  into.box([0.22, 2.38, 1.48], { at: [x, floor + 1.19, z], colour: STEEL_DARK })
  into.box([0.26, 0.06, 1.5], { at: [x, floor + 0.03, z], colour: STEEL_DARK })

  // Main vault door slab with beveled appearance
  into.box([0.14, 2.2, 1.28], { at: [x + 0.03, floor + 1.18, z], colour: STEEL_VAULT })

  // Raised treasure-chest center panel with diagonal strapwork
  into.box([0.07, 1.45, 0.92], { at: [x + 0.09, floor + 1.25, z], colour: STEEL_BRUSHED })
  into.box([0.08, 0.06, 0.94], { at: [x + 0.09, floor + 1.95, z], colour: STEEL_VAULT })
  into.box([0.08, 0.06, 0.94], { at: [x + 0.09, floor + 0.55, z], colour: STEEL_VAULT })

  // Vault turning wheel (three spokes and knurled center hub)
  into.cylinder(
    { radius: 0.18, height: 0.06, sides: 16 },
    { at: [x + 0.14, floor + 1.25, z], colour: STEEL_VAULT, rotation: [0, 0, Math.PI / 2] },
  )
  into.cylinder(
    { radius: 0.065, height: 0.11, sides: 12 },
    { at: [x + 0.16, floor + 1.25, z], colour: BRASS_ACCENT, rotation: [0, 0, Math.PI / 2] },
  )
  for (let s = 0; s < 3; s++) {
    const angle = (s * Math.PI * 2) / 3
    into.box([0.035, 0.32, 0.045], {
      at: [x + 0.15, floor + 1.25, z],
      colour: STEEL_BRUSHED,
      rotation: [angle, 0, 0],
    })
  }

  // Mechanical combination dial and heavy cylindrical barrel hinges
  into.cylinder(
    { radius: 0.05, height: 0.04, sides: 16 },
    { at: [x + 0.13, floor + 1.62, z + 0.28], colour: CHROME_BRIGHT, rotation: [0, 0, Math.PI / 2] },
  )
  for (const hy of [floor + 0.45, floor + 1.95]) {
    into.cylinder(
      { radius: 0.045, height: 0.28, sides: 10 },
      { at: [x + 0.02, hy, z - 0.65], colour: STEEL_DARK },
    )
  }

  // Heavy perimeter locking bolts
  for (let i = 0; i < 5; i++) {
    const bz = z - 0.52 + i * 0.26
    into.sphere([0.024, 0.024, 0.024], { at: [x + 0.11, floor + 0.2, bz], colour: STEEL_BRUSHED })
    into.sphere([0.024, 0.024, 0.024], { at: [x + 0.11, floor + 2.15, bz], colour: STEEL_BRUSHED })
  }
}

/** The secret passage metal door featuring four dark cutouts arranged like a robot's face. */
export function dressRobotFacedDoor(placement: DoorPlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Outer steel door jamb with recessed reveal
  into.box([0.22, 2.55, 1.48], { at: [x, floor + 1.275, z], colour: STEEL_DARK })
  // Main flush door leaf concealing the secret passage
  into.box([0.15, 2.4, 1.26], { at: [x + 0.03, floor + 1.27, z], colour: STEEL_ROBOT_FACE })

  // Two horizontal rectangular eye cutouts with dark inset
  into.box([0.04, 0.11, 0.32], { at: [x + 0.11, floor + 1.7, z - 0.28], colour: STEEL_CUTOUT_DARK })
  into.box([0.04, 0.11, 0.32], { at: [x + 0.11, floor + 1.7, z + 0.28], colour: STEEL_CUTOUT_DARK })

  // Two lower rectangular feet / mouth cutouts
  into.box([0.04, 0.2, 0.2], { at: [x + 0.11, floor + 0.68, z - 0.24], colour: STEEL_CUTOUT_DARK })
  into.box([0.04, 0.2, 0.2], { at: [x + 0.11, floor + 0.68, z + 0.24], colour: STEEL_CUTOUT_DARK })

  // Concealed hairline seam around the secret passage
  into.box([0.02, 2.38, 0.025], { at: [x + 0.1, floor + 1.27, z - 0.61], colour: STEEL_CUTOUT_DARK })
  into.box([0.02, 2.38, 0.025], { at: [x + 0.1, floor + 1.27, z + 0.61], colour: STEEL_CUTOUT_DARK })
  into.box([0.02, 0.025, 1.24], { at: [x + 0.1, floor + 2.44, z], colour: STEEL_CUTOUT_DARK })

  // Discreet magnetic lock card slot and pivot hinge caps
  into.box([0.02, 0.08, 0.02], { at: [x + 0.11, floor + 1.15, z + 0.54], colour: STEEL_CUTOUT_DARK })
  into.cylinder({ radius: 0.03, height: 0.08, sides: 8 }, { at: [x + 0.02, floor + 2.44, z - 0.58], colour: STEEL_DARK })
  into.cylinder({ radius: 0.03, height: 0.08, sides: 8 }, { at: [x + 0.02, floor + 0.08, z - 0.58], colour: STEEL_DARK })
}

/** The third door of the main office: traditional paneled wood door with brass lever. */
export function dressWoodenDoor(placement: DoorPlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Molded dark wood architrave and casing
  into.box([0.22, 2.55, 1.48], { at: [x, floor + 1.275, z], colour: OFFICE_WOOD_DARK })
  into.box([0.25, 0.08, 1.54], { at: [x, floor + 2.52, z], colour: WOOD_TRIM })

  // Stained timber door slab
  into.box([0.13, 2.4, 1.24], { at: [x + 0.03, floor + 1.26, z], colour: DOOR_WOOD_PANELED })

  // Four deep recessed molded panels with stepped framing
  for (let row = 0; row < 2; row++) {
    const py = floor + 0.68 + row * 1.08
    const ph = row === 0 ? 0.72 : 0.88
    for (let col = -1; col <= 1; col += 2) {
      const pz = z + col * 0.28
      into.box([0.03, ph, 0.38], { at: [x + 0.09, py, pz], colour: WOOD_TRIM })
      into.box([0.04, ph - 0.06, 0.32], { at: [x + 0.095, py, pz], colour: OFFICE_WOOD_DARK })
    }
  }

  // Polished brass backplate, curved lever handle, and brass kickplate
  into.box([0.04, 0.26, 0.07], { at: [x + 0.1, floor + 1.05, z + 0.44], colour: BRASS_ACCENT })
  into.cylinder(
    { radius: 0.016, height: 0.13, sides: 8 },
    { at: [x + 0.13, floor + 1.09, z + 0.48], colour: BRASS_ACCENT, rotation: [0, 0, Math.PI / 2] },
  )
  into.box([0.035, 0.16, 1.18], { at: [x + 0.095, floor + 0.14, z], colour: BRASS_ACCENT })
}

/** The clean white door leading into the CCTV monitor room. */
export function dressWhiteDoor(placement: DoorPlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // White frame casing with acoustic seal
  into.box([1.48, 2.55, 0.22], { at: [x, floor + 1.275, z], colour: WHITE_FRAME })
  into.box([1.26, 2.42, 0.04], { at: [x, floor + 1.26, z - 0.09], colour: ACOUSTIC_SEAL })

  // Enameled white door leaf
  into.box([1.24, 2.4, 0.13], { at: [x, floor + 1.26, z + 0.02], colour: WHITE_DOOR_ENAMEL })

  // Contemporary brushed stainless steel hardware & deadbolt
  into.box([0.065, 0.24, 0.04], { at: [x + 0.45, floor + 1.05, z + 0.09], colour: CHROME_BRIGHT })
  into.cylinder(
    { radius: 0.016, height: 0.13, sides: 8 },
    { at: [x + 0.49, floor + 1.08, z + 0.11], colour: CHROME_BRIGHT, rotation: [Math.PI / 2, 0, 0] },
  )

  // Overhead hydraulic door closer arm
  into.box([0.32, 0.08, 0.08], { at: [x, floor + 2.38, z + 0.08], colour: CHROME_BRIGHT })
  into.cylinder(
    { radius: 0.012, height: 0.26, sides: 6 },
    { at: [x + 0.1, floor + 2.36, z + 0.12], colour: CHROME_BRIGHT, rotation: [0.3, 0, 0] },
  )
}

/** The smart-lock entrance door in the office hall. */
export function dressSmartLockEntrance(placement: DoorPlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Heavy steel blast door casing and sill plate
  into.box([1.52, 2.68, 0.22], { at: [x, floor + 1.34, z], colour: STEEL_DARK })
  into.box([1.54, 0.05, 0.3], { at: [x, floor + 0.025, z], colour: STEEL_DARK })

  // Armored vault door leaf with narrow vision slit
  into.box([1.26, 2.52, 0.14], { at: [x, floor + 1.34, z + 0.02], colour: STEEL_VAULT })
  into.box([0.12, 0.48, 0.06], { at: [x - 0.2, floor + 1.62, z + 0.03], colour: STEEL_CUTOUT_DARK })

  // Electronic smart-card reader & numeric PIN keypad
  into.box([0.2, 0.32, 0.09], { at: [x + 0.52, floor + 1.2, z + 0.1], colour: STEEL_GRAPHITE })
  into.box([0.14, 0.12, 0.02], { at: [x + 0.52, floor + 1.15, z + 0.15], colour: STEEL_DARK })
  into.box([0.045, 0.045, 0.025], {
    at: [x + 0.52, floor + 1.3, z + 0.15],
    colour: LED_ONLINE_GREEN,
    glow: true,
  })

  // Overhead electromagnetic holding lock & heavy closer
  into.box([0.45, 0.09, 0.09], { at: [x, floor + 2.52, z + 0.08], colour: STEEL_DARK })
  into.box([0.9, 0.04, 0.04], { at: [x, floor + 1.0, z + 0.1], colour: STEEL_BRUSHED })
}
