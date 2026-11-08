import type * as Three from 'three'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

export const ZHANG_LEI_WOOD = 0x3a2215
export const ZHANG_LEI_GOLD = 0xc9a458
export const ZHANG_LEI_VELVET = 0x24352b
export const ZHANG_LEI_STONE = 0x92887a
export const ZHANG_LEI_BRONZE = 0x483e35
export const ZHANG_LEI_FABRIC_PALE = 0xe2decb
export const ZHANG_LEI_CANDLE = 0xf4f1e6
export const ZHANG_LEI_FLAME = 0xffdf78

/**
 * Local surface coordinator for Room 1003 state dining room structures.
 * Translates local model points into absolute tour world coordinates.
 */
export class ZhangLeiSurface {
  readonly width: number
  readonly depth: number
  readonly angle: number

  constructor(
    readonly into: BanquetDetailBuilder,
    readonly structure: Structure,
    readonly floor: number,
  ) {
    const wallFacing = structure.kind === 'painting' || structure.kind === 'cabinet'
    const sideWall = wallFacing && structure.size[1] > structure.size[0]
    this.width = sideWall ? structure.size[1] : structure.size[0]
    this.depth = sideWall ? structure.size[0] : structure.size[1]
    this.angle =
      -(structure.rotation * Math.PI) / 180 +
      (sideWall ? (structure.at[0] > 6 ? -Math.PI / 2 : Math.PI / 2) : 0)
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
    this.into.cylinder(size, { at: this.point(at), colour })
  }

  ring(radius: number, at: Point3, colour: number): void {
    this.into.ring(
      { radius, tube: 0.018 },
      {
        at: this.point(at),
        rotation: [0, this.angle, 0],
        colour,
      },
    )
  }

  curve(points: readonly Point3[], radius: number, colour: number): void {
    this.into.curve(
      points.map((p) => this.point(p)),
      radius,
      {
        at: [0, 0, 0],
        colour,
      },
    )
  }

  add(geometry: Three.BufferGeometry, at: Point3, colour: number): void {
    this.into.add(geometry, { at: this.point(at), rotation: [0, this.angle, 0], colour })
  }
}

export function zhangLeiFrame(
  surface: ZhangLeiSurface,
  panel: {
    width: number
    height: number
    y: number
    z: number
    trim?: number
  },
): void {
  const { width, height, y, z, trim = 0.06 } = panel
  for (const side of [-1, 1]) {
    surface.box([width, trim, 0.045], [0, y + (side * height) / 2, z], ZHANG_LEI_GOLD)
    surface.box([trim, height, 0.045], [(side * width) / 2, y, z], ZHANG_LEI_GOLD)
  }
}

export function zhangLeiTurnedBaluster(
  surface: ZhangLeiSurface,
  options: {
    at: Point3
    height: number
    radius: number
  },
): void {
  const { at, height, radius } = options
  const [x, y, z] = at
  surface.cylinder(
    { radius: radius * 1.15, height: height * 0.12 },
    [x, y + height * 0.06, z],
    ZHANG_LEI_WOOD,
  )
  surface.sphere(
    [radius * 1.25, height * 0.14, radius * 1.25],
    [x, y + height * 0.28, z],
    ZHANG_LEI_WOOD,
  )
  surface.cylinder(
    { radius: radius * 0.7, height: height * 0.35 },
    [x, y + height * 0.55, z],
    ZHANG_LEI_WOOD,
  )
  surface.sphere(
    [radius * 1.1, height * 0.1, radius * 1.1],
    [x, y + height * 0.78, z],
    ZHANG_LEI_GOLD,
  )
  surface.cylinder(
    { radius: radius * 1.15, height: height * 0.12 },
    [x, y + height * 0.94, z],
    ZHANG_LEI_WOOD,
  )
}
