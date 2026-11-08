import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

export const WAREHOUSE_STEEL_DARK = 0x22262a
export const WAREHOUSE_STEEL_PANEL = 0x3d444a
export const WAREHOUSE_STEEL_LIGHT = 0x6e7882
export const WAREHOUSE_CRANE_YELLOW = 0xd4a017
export const WAREHOUSE_HAZARD_YELLOW = 0xe0a500
export const WAREHOUSE_HAZARD_BLACK = 0x141414
export const WAREHOUSE_CONCRETE_DECK = 0x2a2824
export const WAREHOUSE_CONCRETE_LIGHT = 0x3d3a34
export const WAREHOUSE_WOOD_DARK = 0x3d2f20
export const WAREHOUSE_WOOD_LIGHT = 0x6e5538
export const WAREHOUSE_CONTAINER_BLUE = 0x2c4a6f
export const WAREHOUSE_CONTAINER_RED = 0x783428
export const WAREHOUSE_CONTAINER_GREEN = 0x2f523c
export const WAREHOUSE_SODIUM_WARM = 0xffc470
export const WAREHOUSE_NEON_COOL = 0xd2e4f0
export const WAREHOUSE_ALERT_RED = 0xa31f1f
export const WAREHOUSE_STATUS_GREEN = 0x27ae60
export const WAREHOUSE_PORTAL_VIOLET = 0x8a2be2
export const WAREHOUSE_PORTAL_CORE = 0x18092e
export const WAREHOUSE_BLOOD = 0x4a0e12

export class WarehouseDetailSurface {
  readonly width: number
  readonly depth: number
  readonly angle: number

  constructor(
    readonly into: BanquetDetailBuilder,
    readonly structure: Structure,
    readonly floor: number,
  ) {
    const isCabinet = structure.kind === 'cabinet'
    const sideWall = isCabinet && structure.size[1] > structure.size[0]
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

  cylinder(params: { radius: number; height: number }, at: Point3, colour: number): void {
    this.into.cylinder(params, { at: this.point(at), rotation: [0, this.angle, 0], colour })
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
}
