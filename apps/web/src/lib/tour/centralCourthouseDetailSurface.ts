import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

/** Interpretive, restrained tones; the chapter 359 panel establishes no paint colours. */
export const COURTHOUSE = {
  wall: 0xc8c1b0,
  panel: 0xb2aa97,
  trim: 0x766b58,
  frieze: 0xa3977f,
  ceiling: 0xd4cdbd,
  floor: 0xbcb7ab,
  joint: 0x6f6a60,
  wood: 0x79674e,
  woodLight: 0xa08c6d,
  woodDark: 0x544636,
  fabric: 0xc5b9a3,
  binding: 0x665b48,
} as const

/** Furniture is dressed inside the same envelope that navigation collides with. */
export class CentralCourthouseSurface {
  readonly angle: number

  constructor(
    readonly into: BanquetDetailBuilder,
    readonly structure: Structure,
    readonly floor: number,
  ) {
    this.angle = -(structure.rotation * Math.PI) / 180
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

  cylinder(size: { radius: number; height: number }, at: Point3, colour: number): void {
    this.into.cylinder(size, { at: this.point(at), colour })
  }
}
