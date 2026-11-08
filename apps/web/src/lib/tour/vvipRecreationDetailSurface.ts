import type * as Three from 'three'
import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

export const PALETTE = {
  mahogany: 0x3d2012,
  darkWood: 0x24140b,
  gold: 0xbda05e,
  emeraldFelt: 0x1d5c36,
  creamMarble: 0xebe6d8,
  alabaster: 0xdcd8c9,
  burgundy: 0x5a1922,
  leather: 0x331c17,
  crystal: 0xe0e8ec,
  warmLight: 0xffe8aa,
  brass: 0x9b824a,
} as const

export interface VvipSurfaceContext {
  into: BanquetDetailBuilder
  structure: Structure
  floor: number
}

/** Wraps a structure to position architectural and furniture details accurately. */
export class VvipRecreationSurface {
  readonly x: number
  readonly z: number
  readonly y: number
  readonly width: number
  readonly depth: number
  readonly height: number

  constructor(
    readonly into: BanquetDetailBuilder,
    readonly structure: Structure,
    floor: number,
  ) {
    this.x = structure.at[0]
    this.z = structure.at[1]
    this.y = floor + structure.base
    this.width = structure.size[0]
    this.depth = structure.size[1]
    this.height = structure.height
  }

  box(size: Point3, offset: Point3, colour: number): void {
    this.into.box(size, {
      at: [this.x + offset[0], this.y + offset[1], this.z + offset[2]],
      colour,
    })
  }

  cylinder(
    dim: { radius: number; height: number; bottom?: number; sides?: number },
    offset: Point3,
    colour: number,
  ): void {
    this.into.cylinder(
      { ...dim, sides: dim.sides ?? 12 },
      {
        at: [this.x + offset[0], this.y + offset[1], this.z + offset[2]],
        colour,
      },
    )
  }

  ring(dim: { radius: number; tube: number }, offset: Point3, colour: number): void {
    this.into.ring(dim, {
      at: [this.x + offset[0], this.y + offset[1], this.z + offset[2]],
      colour,
    })
  }
}

export interface BalusterOptions {
  into: BanquetDetailBuilder
  at: Point3
  height: number
  colour?: number
}

/** Draws a turned baluster for stair and gallery railings. */
export function drawTurnedBaluster(options: BalusterOptions): void {
  const { into, at, height, colour = PALETTE.darkWood } = options
  const [x, y, z] = at
  into.cylinder(
    { radius: 0.032, height: height * 0.16, sides: 8 },
    { at: [x, y + height * 0.08, z], colour },
  )
  into.cylinder(
    { radius: 0.048, height: height * 0.18, sides: 12 },
    { at: [x, y + height * 0.25, z], colour },
  )
  into.cylinder(
    { radius: 0.024, bottom: 0.042, height: height * 0.45, sides: 12 },
    { at: [x, y + height * 0.56, z], colour },
  )
  into.cylinder(
    { radius: 0.038, height: height * 0.15, sides: 8 },
    { at: [x, y + height * 0.86, z], colour },
  )
}

export interface ColumnOptions {
  into: BanquetDetailBuilder
  at: Point3
  height: number
  radius?: number
}

/** Draws a fluted classical column with molded base and gilded capital. */
export function drawFlutedColumn(options: ColumnOptions): void {
  const { into, at, height, radius = 0.32 } = options
  const [x, y, z] = at
  // Plinth and base
  into.box([radius * 2.5, 0.25, radius * 2.5], { at: [x, y + 0.125, z], colour: PALETTE.alabaster })
  into.cylinder(
    { radius: radius * 1.18, height: 0.18, sides: 16 },
    { at: [x, y + 0.34, z], colour: PALETTE.gold },
  )

  // Fluted column shaft
  into.flutedShaft(
    { radius, height: height - 0.9, flutes: 12 },
    { at: [x, y + 0.43 + (height - 0.9) / 2, z], colour: PALETTE.alabaster },
  )

  // Capital with gold leaf molding and abacus
  into.cylinder(
    { radius: radius * 1.25, bottom: radius, height: 0.35, sides: 16 },
    { at: [x, y + height - 0.35, z], colour: PALETTE.gold },
  )
  into.box([radius * 2.6, 0.15, radius * 2.6], {
    at: [x, y + height - 0.075, z],
    colour: PALETTE.alabaster,
  })
}

/** Draws a monumental chandelier with cascading crystal prisms and warm lights. */
export function drawMonumentalChandelier(options: {
  THREE: typeof Three
  into: BanquetDetailBuilder
  at: Point3
}): void {
  const {
    THREE,
    into,
    at: [x, y, z],
  } = options

  // Central gilded rod and canopy
  into.cylinder(
    { radius: 0.04, height: 1.2, sides: 8 },
    { at: [x, y - 0.6, z], colour: PALETTE.gold },
  )
  into.cylinder(
    { radius: 0.45, bottom: 0.15, height: 0.25, sides: 16 },
    { at: [x, y - 0.15, z], colour: PALETTE.gold },
  )

  // 3 concentric crystal rings
  for (let tier = 0; tier < 3; tier++) {
    const ringRadius = 1.3 - tier * 0.35
    const ringY = y - 1.2 - tier * 0.45
    into.ring(
      { radius: ringRadius, tube: 0.045 },
      { at: [x, ringY, z], rotation: [Math.PI / 2, 0, 0], colour: PALETTE.gold },
    )

    const dropCount = 12 - tier * 2
    for (let drop = 0; drop < dropCount; drop++) {
      const angle = (drop * Math.PI * 2) / dropCount
      const px = x + Math.cos(angle) * ringRadius
      const pz = z + Math.sin(angle) * ringRadius

      into.cylinder(
        { radius: 0.012, height: 0.35, sides: 4, open: true },
        { at: [px, ringY - 0.18, pz], colour: PALETTE.crystal },
      )
      into.add(new THREE.OctahedronGeometry(0.08).scale(0.8, 2.0, 0.8), {
        at: [px, ringY - 0.4, pz],
        colour: PALETTE.crystal,
      })
      // Luminous candle flame / warm crystal glow
      into.sphere([0.04, 0.07, 0.04], {
        at: [px, ringY + 0.1, pz],
        colour: PALETTE.warmLight,
        glow: true,
      })
    }
  }

  // Lower crystal pendant
  into.add(new THREE.OctahedronGeometry(0.18).scale(1, 2.2, 1), {
    at: [x, y - 2.65, z],
    colour: PALETTE.crystal,
  })
}
