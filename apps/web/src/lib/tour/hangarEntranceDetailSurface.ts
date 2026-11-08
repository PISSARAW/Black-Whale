import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

export const HANGAR_STEEL_DARK = 0x222629
export const HANGAR_STEEL_LIGHT = 0x687278
export const HANGAR_STEEL_PANEL = 0x3d4449
export const HANGAR_HAZARD_YELLOW = 0xd4a017
export const HANGAR_HAZARD_BLACK = 0x181a1b
export const HANGAR_CRANE_YELLOW = 0xe5a922
export const HANGAR_RUST_ORANGE = 0x8a4622
export const HANGAR_CONCRETE = 0x4a4f52
export const HANGAR_DIFFUSER_WARM = 0xfcf3cf
export const HANGAR_BEACON_AMBER = 0xff8c00
export const HANGAR_STATUS_GREEN = 0x27ae60
export const HANGAR_STATUS_RED = 0xc0392b
export const HANGAR_WOOD_PALLET = 0x7a5b3a
export const HANGAR_WOOD_CRATE = 0x8c6b45
export const HANGAR_DRUM_BLUE = 0x244b73
export const HANGAR_DRUM_GREEN = 0x1f543d
export const HANGAR_FIRE_RED = 0x9e1b24

export class HangarEntranceSurface {
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
