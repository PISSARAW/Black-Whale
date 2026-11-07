import type * as Three from 'three'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

export const BENJAMIN_DARK_WOOD = 0x382d24
export const BENJAMIN_BRONZE = 0x94825d
export const BENJAMIN_STONE = 0x6e6b63
export const BENJAMIN_UNIFORM_GREEN = 0x364236
export const BENJAMIN_UNIFORM_GREY = 0x272c29
export const BENJAMIN_LEATHER_DARK = 0x181412
export const BENJAMIN_GOLD_TRIM = 0xb49856
export const BENJAMIN_SKIN = 0xd2b79b
export const BENJAMIN_FLOOR = 0x2b2723

export class BenjaminRoomSurface {
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

  cylinder(
    size: { radius: number; height: number; bottom?: number; sides?: number },
    at: Point3,
    colour: number,
  ): void {
    this.into.cylinder(size, { at: this.point(at), rotation: [0, this.angle, 0], colour })
  }

  sphere(size: Point3, at: Point3, styling: number | { colour: number; glow?: boolean }): void {
    const colour = typeof styling === 'number' ? styling : styling.colour
    const glow = typeof styling === 'number' ? false : styling.glow
    this.into.sphere(size, { at: this.point(at), rotation: [0, this.angle, 0], colour, glow })
  }

  ring(radius: number, at: Point3, colour: number): void {
    this.into.ring(
      { radius, tube: 0.018 },
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

export function benjaminMouldedFrame(
  surface: BenjaminRoomSurface,
  panel: { width: number; height: number; y: number; z: number; trim?: number },
): void {
  const { width, height, y, z, trim = 0.08 } = panel
  for (const side of [-1, 1]) {
    surface.box([width, trim, 0.06], [0, y + (side * height) / 2, z], BENJAMIN_BRONZE)
    surface.box([trim, height, 0.06], [(side * width) / 2, y, z], BENJAMIN_BRONZE)
  }
}
