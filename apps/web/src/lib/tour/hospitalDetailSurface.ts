import type * as Three from 'three'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

// Clinical and hospital colour palette
export const CLINICAL_WHITE = 0xf5f8f9
export const CLINICAL_WALL = 0x587075
export const CLINICAL_FLOOR = 0x263538
export const CLINICAL_TEAL = 0x3d7077
export const CLINICAL_MINT = 0x6e9e95
export const STEEL_MEDICAL = 0xb4bcc4
export const STEEL_DARK = 0x2f363d
export const CHROME = 0xdde3e8

// Furniture and bedding
export const BED_FRAME = 0xd5dde2
export const BED_SHEET = 0xf5f8fa
export const BED_BLANKET = 0x4a7278
export const DESK_WOOD = 0x3e4a4c
export const CHAIR_FABRIC = 0x3b5256

// Electronics, diagnostics, and glows
export const MONITOR_FRAME = 0x1e2428
export const MONITOR_ECG_GREEN = 0x39d98a
export const XRAY_BLUE_GLOW = 0x64b5f6
export const XRAY_FRAME = 0x1b2024
export const OXYGEN_GREEN = 0x2e7d32
export const CART_RED = 0xc53030
export const FLUID_CLEAR = 0x8ec7d9

/** Local coordinates helper for placing hospital fixtures and medical equipment */
export class HospitalSurface {
  readonly width: number
  readonly depth: number
  readonly angle: number

  constructor(
    readonly into: BanquetDetailBuilder,
    readonly structure: Structure,
    readonly floor: number,
  ) {
    const wallFacing = structure.kind === 'cabinet' || structure.kind === 'counter'
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
