import type * as Three from 'three'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

export const TSERRIEDNICH_DARK_WOOD = 0x3a2b1f
export const TSERRIEDNICH_PANEL_WOOD = 0x4d3a28
export const TSERRIEDNICH_REEDING_GROOVE = 0x362716
export const TSERRIEDNICH_GOLD_TRIM = 0xa98a52
export const TSERRIEDNICH_STONE = 0x6b6760
export const TSERRIEDNICH_CLOCK_FACE = 0xe9e2d0
export const TSERRIEDNICH_CLOCK_HAND = 0x1c1915
export const TSERRIEDNICH_CANVAS = 0x2c3a33
export const TSERRIEDNICH_FRIDGE_WHITE = 0xe4e2dc
export const TSERRIEDNICH_FRIDGE_STEEL = 0xaaa9a4
export const TSERRIEDNICH_COUNTER_STONE = 0xc9c4b8

/** Local coordinate system bound to one structure, as `BenjaminRoomSurface` is. */
export class TserriednichRoomSurface {
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

  add(geometry: Three.BufferGeometry, at: Point3, colour: number): void {
    this.into.add(geometry, { at: this.point(at), rotation: [0, this.angle, 0], colour })
  }
}

export function tserriednichMouldedFrame(
  surface: TserriednichRoomSurface,
  panel: { width: number; height: number; y: number; z: number; trim?: number },
): void {
  const { width, height, y, z, trim = 0.07 } = panel
  for (const side of [-1, 1]) {
    surface.box([width, trim, 0.05], [0, y + (side * height) / 2, z], TSERRIEDNICH_GOLD_TRIM)
    surface.box([trim, height, 0.05], [(side * width) / 2, y, z], TSERRIEDNICH_GOLD_TRIM)
  }
}
