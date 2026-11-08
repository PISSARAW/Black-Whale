import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

export const POLICE_GRANITE = 0x7a838b
export const POLICE_GRANITE_DARK = 0x4d535a
export const POLICE_STONE = 0x9aa2aa
export const POLICE_METAL = 0x2a2f35
export const POLICE_NAVY = 0x1e354d
export const POLICE_GOLD = 0xc2a65d
export const POLICE_BRASS = 0xd4af37
export const POLICE_GLASS = 0x88b5c4
export const POLICE_WATER = 0x3a6b8c
export const POLICE_OAK = 0x423429
export const POLICE_PAPER = 0xd8d4ca
export const POLICE_OFFICER_BLUE = 0x1a2b3c
export const POLICE_FLESH = 0xd2b19a
export const POLICE_SCREEN_FRAME = 0x1a1e22
export const POLICE_SCREEN_GLOW = 0x3d708f
export const POLICE_ALERT_RED = 0xc0392b
export const POLICE_ALERT_GREEN = 0x27ae60
export const POLICE_LEATHER = 0x2c2621
export const POLICE_LIGHT_DIFFUSER = 0xf5ebd3
export const POLICE_TILES_LIGHT = 0x8e979f
export const POLICE_TILES_DARK = 0x3f464d

export class PoliceStationSurface {
  readonly width: number
  readonly depth: number
  readonly angle: number

  constructor(
    readonly into: BanquetDetailBuilder,
    readonly structure: Structure,
    readonly floor: number,
  ) {
    const isWall = structure.kind === 'cabinet' || structure.kind === 'painting'
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

  sphere(size: Point3, at: Point3, colour: number): void {
    this.into.sphere(size, { at: this.point(at), rotation: [0, this.angle, 0], colour })
  }

  cylinder(
    size: { radius: number; height: number; bottom?: number; sides?: number },
    at: Point3,
    colour: number,
  ): void {
    this.into.cylinder(size, { at: this.point(at), rotation: [0, this.angle, 0], colour })
  }
}
