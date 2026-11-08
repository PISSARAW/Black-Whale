import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'

export const SCREENING_CARPET = 0x241c28
export const SCREENING_WALL_FABRIC = 0x4d354e
export const SCREENING_WOOD_MAHOGANY = 0x35221b
export const SCREENING_WOOD_TRIM = 0x4a3227
export const SCREENING_GOLD_LEAF = 0xd4af37
export const SCREENING_BRASS = 0xbe9c48
export const SCREENING_CURTAIN_CRIMSON = 0x6d1323
export const SCREENING_CURTAIN_DARK = 0x4a0d18
export const SCREENING_SCREEN_WHITE = 0xf0f0eb
export const SCREENING_SCREEN_FRAME = 0x121316
export const SCREENING_SEAT_VELVET = 0x751627
export const SCREENING_SEAT_FRAME = 0x26282c
export const SCREENING_STAGE_FLOOR = 0x2b1d16
export const SCREENING_WARM_GLOW = 0xffd899
export const SCREENING_EXIT_GREEN = 0x33cc44
export const SCREENING_DARK_STEEL = 0x303338
export const SCREENING_GLASS = 0x5a6d7a

export interface CylinderOptions {
  colour?: number
  glow?: boolean
  rotation?: Point3
}

export interface CylinderSize {
  radius: number
  height: number
  bottom?: number
  sides?: number
  open?: boolean
}

export interface RingSize {
  radius: number
  tube: number
}

/** Detail geometry helper for the Tier 2 Screening Room. */
export class ScreeningRoomSurface {
  constructor(public readonly into: BanquetDetailBuilder) {}

  box(size: Point3, at: Point3, colour: number): void {
    this.into.box(size, { at, colour })
  }

  glowingBox(size: Point3, at: Point3, colour: number): void {
    this.into.box(size, { at, colour, glow: true })
  }

  cylinder(size: CylinderSize, at: Point3, options: CylinderOptions = {}): void {
    this.into.cylinder(size, {
      at,
      colour: options.colour ?? SCREENING_BRASS,
      glow: options.glow,
      rotation: options.rotation,
    })
  }

  sphere(size: Point3, at: Point3, colour: number): void {
    this.into.sphere(size, { at, colour })
  }

  glowingSphere(size: Point3, at: Point3, colour: number): void {
    this.into.sphere(size, { at, colour, glow: true })
  }

  ring(size: RingSize, at: Point3, colour: number): void {
    this.into.ring(size, { at, colour })
  }
}
