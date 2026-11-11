import type * as Three from 'three'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

export const SALON_STONE = 0xd8cdb8
export const SALON_GOLD = 0xc5a25f
export const SALON_WOOD = 0x39251e
export const SALON_FABRIC = 0x642f35

/** Local +Z faces the room; structure rotations are degrees in the ground plane. */
export class SalonSurface {
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
    const cos = Math.cos(this.angle),
      sin = Math.sin(this.angle)
    return [
      this.structure.at[0] + x * cos + z * sin,
      this.floor + this.structure.base + y,
      this.structure.at[1] - x * sin + z * cos,
    ]
  }

  box(size: Point3, at: Point3, colour: number): void {
    this.into.box(size, { at: this.point(at), rotation: [0, this.angle, 0], colour })
  }

  glowBox(size: Point3, placement: { at: Point3; colour: number }): void {
    this.into.box(size, {
      at: this.point(placement.at),
      rotation: [0, this.angle, 0],
      colour: placement.colour,
      glow: true,
    })
  }

  sphere(size: Point3, at: Point3, colour: number): void {
    this.into.sphere(size, { at: this.point(at), rotation: [0, this.angle, 0], colour })
  }

  cylinder(
    size: { radius: number; height: number; bottom?: number },
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
      points.map((point) => this.point(point)),
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

export function salonFrame(
  surface: SalonSurface,
  panel: {
    width: number
    height: number
    y: number
    z: number
    trim?: number
  },
): void {
  const { width, height, y, z, trim = 0.07 } = panel
  for (const side of [-1, 1]) {
    surface.box([width, trim, 0.055], [0, y + (side * height) / 2, z], SALON_GOLD)
    surface.box([trim, height, 0.055], [(side * width) / 2, y, z], SALON_GOLD)
  }
}

/** A simplified turned vessel, rather than an unidentifiable cabinet-sized block. */
export function salonVase(surface: SalonSurface, at: Point3, scale = 1): void {
  surface.into.profile(
    [
      [0.1, 0],
      [0.12, 0.04],
      [0.09, 0.08],
      [0.17, 0.22],
      [0.14, 0.32],
      [0.06, 0.38],
      [0.055, 0.46],
      [0.09, 0.48],
    ].map(([radius, y]): [number, number] => [radius * scale, y * scale]),
    {
      at: surface.point(at),
      colour: SALON_GOLD,
    },
  )
}

/** Dense flower heads keep the side furniture rich without narrowing the walkable aisle. */
export function salonBouquet(surface: SalonSurface, at: Point3, scale = 1): void {
  const [x, y, z] = at
  salonVase(surface, at, scale * 0.72)
  const stemTop = y + 0.82 * scale
  for (const [offset, colour] of [
    [-0.22, 0x7c2637],
    [-0.11, 0xe2c9b2],
    [0, 0x9c3550],
    [0.12, 0xe8ddd0],
    [0.23, 0x6e2938],
  ] as const) {
    surface.curve(
      [
        [x, y + 0.36 * scale, z],
        [x + offset * 0.45 * scale, y + 0.6 * scale, z],
        [x + offset * scale, stemTop - Math.abs(offset) * scale, z],
      ],
      0.012 * scale,
      0x405b36,
    )
    surface.sphere(
      [0.1 * scale, 0.12 * scale, 0.08 * scale],
      [x + offset * scale, stemTop - Math.abs(offset) * scale, z],
      colour,
    )
  }
}
