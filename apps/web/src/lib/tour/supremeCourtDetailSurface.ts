import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

export const COURT_MAHOGANY = 0x3a2318
export const COURT_WALNUT = 0x4a3222
export const COURT_GOLD = 0xd4af37
export const COURT_BRASS = 0xc2a65d
export const COURT_PARQUET_LIGHT = 0x6d543f
export const COURT_PARQUET_DARK = 0x422f20
export const COURT_CARPET_RED = 0x7a1820
export const COURT_CARPET_BORDER = 0xb8923a
export const COURT_LEATHER_DARK = 0x241d19
export const COURT_LEATHER_GREEN = 0x1f3427
export const COURT_SEAL_BLUE = 0x1b3554
export const COURT_LIGHT_DIFFUSER = 0xfdf3d8
export const COURT_PAPER = 0xede8dc
export const COURT_STONE = 0x8a9299

export class SupremeCourtSurface {
  readonly width: number
  readonly depth: number
  readonly angle: number

  constructor(
    readonly into: BanquetDetailBuilder,
    readonly structure: Structure,
    readonly floor: number,
  ) {
    const isWall = structure.kind === 'painting' || structure.kind === 'cabinet'
    const sideWall = isWall && structure.size[1] > structure.size[0]
    this.width = sideWall ? structure.size[1] : structure.size[0]
    this.depth = sideWall ? structure.size[0] : structure.size[1]
    this.angle =
      -(structure.rotation * Math.PI) / 180 +
      (sideWall ? (structure.at[0] > 0 ? -Math.PI / 2 : Math.PI / 2) : 0)
  }

  point([x, y, z]: Point3): Point3 {
    const cos = Math.cos(this.angle)
    const sin = Math.sin(this.angle)
    return [
      this.structure.at[0] + x * cos + z * sin,
      this.floor + this.structure.base + y,
      this.structure.at[1] - x * sin + z * cos,
    ]
  }

  box(size: Point3, at: Point3, colour: number): void {
    this.into.box(size, { at: this.point(at), rotation: [0, this.angle, 0], colour })
  }

  sphere(size: Point3, at: Point3, options: number | { colour: number; glow?: boolean }): void {
    const opts = typeof options === 'number' ? { colour: options } : options
    this.into.sphere(size, {
      at: this.point(at),
      rotation: [0, this.angle, 0],
      colour: opts.colour,
      glow: opts.glow,
    })
  }

  cylinder(
    size: { radius: number; height: number; bottom?: number; sides?: number },
    at: Point3,
    colour: number,
  ): void {
    this.into.cylinder(size, { at: this.point(at), rotation: [0, this.angle, 0], colour })
  }
}
