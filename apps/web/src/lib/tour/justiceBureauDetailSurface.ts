import type * as Three from 'three'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

export const JUSTICE_WOOD = 0x3d2d22
export const JUSTICE_OAK = 0x6e5842
export const JUSTICE_BRASS = 0xc2a65d
export const JUSTICE_LEATHER_DARK = 0x222a24
export const JUSTICE_LEATHER_GREEN = 0x2e3d32
export const JUSTICE_STEEL = 0x606970
export const JUSTICE_GLASS = 0x88b5c4
export const JUSTICE_PAPER = 0xd5cebe
export const JUSTICE_STONE = 0xbab2a2
export const JUSTICE_GOLD = 0xd4af37

export class JusticeBureauSurface {
  readonly width: number
  readonly depth: number
  readonly angle: number

  constructor(
    readonly into: BanquetDetailBuilder,
    readonly structure: Structure,
    readonly floor: number,
  ) {
    const wallFacing = structure.kind === 'cabinet' || structure.kind === 'painting'
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

/** Draws a tight row of bound legal tomes and archives on a shelf */
export function dressBookRow(
  surface: JusticeBureauSurface,
  options: { width: number; y: number; z: number; count?: number; height?: number },
): void {
  const { width, y, z, count = 12, height = 0.3 } = options
  const bookWidth = width / count
  const colors = [0x542323, 0x24392b, 0x262f4d, 0x3d2f26, JUSTICE_PAPER, 0x42382c]

  for (let index = 0; index < count; index++) {
    const x = -width / 2 + (index + 0.5) * bookWidth
    const colour = colors[index % colors.length]
    const bookHeight = height * (0.88 + (index % 3) * 0.06)
    const bookDepth = 0.22 - (index % 4) * 0.015
    surface.box([bookWidth * 0.9, bookHeight, bookDepth], [x, y + bookHeight / 2, z], colour)
    if (index % 2 === 0) {
      // Golden title band on spine
      surface.box(
        [bookWidth * 0.92, 0.025, 0.005],
        [x, y + bookHeight * 0.72, z + bookDepth / 2 + 0.002],
        JUSTICE_GOLD,
      )
    }
  }
}

/** Dossier de procédure judiciaire relié d'un ruban */
export function dressFileDossier(surface: JusticeBureauSurface, at: Point3): void {
  const [x, y, z] = at
  surface.box([0.24, 0.04, 0.32], [x, y + 0.02, z], JUSTICE_PAPER)
  surface.box([0.02, 0.042, 0.325], [x - 0.11, y + 0.02, z], 0x8b2525)
  // Red seal
  surface.cylinder({ radius: 0.025, height: 0.006 }, [x + 0.05, y + 0.043, z], 0x991b1b)
}
