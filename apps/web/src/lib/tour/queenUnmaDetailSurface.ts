import type * as Three from 'three'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

export const UNMA_WOOD = 0x3d2b20
export const UNMA_LIGHT_WOOD = 0x8a6c4f
export const UNMA_GOLD = 0xbda267
export const UNMA_VELVET = 0x482736
export const UNMA_FABRIC_PALE = 0xe4ded3
export const UNMA_STONE = 0xc5baa3

export interface FrameOptions {
  width: number
  height: number
  y: number
  z: number
  trim?: number
  colour?: number
}

/** Local +Z faces the room; structure rotations are degrees in the ground plane. */
export class QueenUnmaSurface {
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
      { radius, tube: 0.016 },
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

export function unmaFrame(surface: QueenUnmaSurface, options: FrameOptions): void {
  const { width, height, y, z, trim = 0.065, colour = UNMA_GOLD } = options
  for (const side of [-1, 1]) {
    surface.box([width, trim, 0.045], [0, y + (side * height) / 2, z], colour)
    surface.box([trim, height, 0.045], [(side * width) / 2, y, z], colour)
  }
}

export function unmaTurnedPost(
  surface: QueenUnmaSurface,
  options: { at: Point3; height: number; radius?: number; colour?: number },
): void {
  const { at, height, radius = 0.035, colour = UNMA_LIGHT_WOOD } = options
  const [x, y, z] = at
  surface.cylinder({ radius: radius * 1.25, height: 0.05 }, [x, y + 0.025, z], colour)
  surface.cylinder({ radius, height: height - 0.1 }, [x, y + height / 2, z], colour)
  surface.cylinder({ radius: radius * 1.25, height: 0.05 }, [x, y + height - 0.025, z], colour)
  surface.sphere([radius * 1.35, radius * 1.35, radius * 1.35], [x, y + height + radius, z], colour)
}
