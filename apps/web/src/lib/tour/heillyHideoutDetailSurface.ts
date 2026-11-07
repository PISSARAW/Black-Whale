import type * as Three from 'three'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

// White clinical tile and sanitary surfaces
export const TILE_WHITE = 0xf5f6f8
export const TILE_GROUT = 0x8a939e
export const TILE_BORDER = 0xd5dade

// Nen barrier aura
export const NEN_PURPLE = 0x9333ea
export const NEN_GLOW = 0xc084fc
export const NEN_DEEP = 0x581c87

// Industrial and appliance metals
export const STEEL_BRUSHED = 0xa4abb3
export const STEEL_DARK = 0x33383f
export const CHROME = 0xdee3e8
export const APPLIANCE_WHITE = 0xecf0f3
export const APPLIANCE_TRIM = 0x5a626a

// Office and communal materials
export const WOOD_MAFIA = 0x3d291e
export const WOOD_TABLE = 0x2e241f
export const LEATHER_BLACK = 0x1f2226
export const FABRIC_CHAIR = 0x373b40
export const GLASS_WATER = 0x6ba4b8
export const COOLER_BODY = 0xe2e5e8

// Electronics and consoles
export const MONITOR_CASE = 0x181c20
export const MONITOR_SCREEN = 0x24332e // CCTV surveillance phosphor
export const FAMICOM_CREAM = 0xede6d4
export const FAMICOM_RED = 0x851e24
export const SFAMICOM_GREY = 0xc2c5cc
export const SFAMICOM_DARK = 0x72757c
export const STATUS_LED_GREEN = 0x38a169
export const STATUS_LED_RED = 0xe53e3e

export interface WallBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

/** Local coordinates helper for placing furniture and architectural items */
export class HeillySurface {
  readonly width: number
  readonly depth: number
  readonly angle: number

  constructor(
    readonly into: BanquetDetailBuilder,
    readonly structure: Structure,
    readonly floor: number,
  ) {
    const wallFacing = structure.kind === 'cabinet' || structure.kind === 'basin'
    const sideWall = wallFacing && structure.size[1] > structure.size[0]
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

  ring(radius: number, at: Point3, colour: number): void {
    this.into.ring(
      { radius, tube: 0.015 },
      { at: this.point(at), rotation: [0, this.angle, 0], colour },
    )
  }

  curve(points: readonly Point3[], radius: number, colour: number): void {
    this.into.curve(
      points.map((p) => this.point(p)),
      radius,
      { at: [0, 0, 0], colour },
    )
  }

  add(geometry: Three.BufferGeometry, at: Point3, colour: number): void {
    this.into.add(geometry, { at: this.point(at), rotation: [0, this.angle, 0], colour })
  }
}
