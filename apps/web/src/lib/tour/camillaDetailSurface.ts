import type * as Three from 'three'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'

export const CAMILLA_CARPET = 0x541424
export const CAMILLA_CARPET_BORDER = 0xc8a251
export const CAMILLA_GOLD = 0xc8a251
export const CAMILLA_WOOD = 0x3a241b
export const CAMILLA_LIGHT_WOOD = 0x8a6a4d
export const CAMILLA_VELVET = 0x801e4a
export const CAMILLA_SILK = 0xf2ece4
export const UNTOUCHABLE_CUSHION = 0x242429
export const DUAZUL_VELVET = 0x48293d
export const MUSSE_WOOD = 0x44352b
export const MUSSE_METAL = 0x5a5c61
export const MUSSE_PAPER = 0xdad5ca
export const CAMILLA_PORCELAIN = 0xeeebe6
export const CAMILLA_SILVER = 0xd8dbe2
export const CAMILLA_TAPESTRY_BLUE = 0x2b3848

export interface PostOptions {
  at: Point3
  height: number
  radius?: number
  colour?: number
}

export interface FrameOptions {
  width: number
  height: number
  at: Point3
  trim?: number
  colour?: number
}

export interface CamillaSurfaceContext {
  floor: number
  angle?: number
}

/** Local coordinate system for Camilla's apartment suite. */
export class CamillaSurface {
  readonly floor: number
  readonly angle: number

  constructor(
    readonly into: BanquetDetailBuilder,
    readonly origin: Point3,
    context: CamillaSurfaceContext,
  ) {
    this.floor = context.floor
    this.angle = context.angle ?? 0
  }

  point([x, y, z]: Point3): Point3 {
    const cos = Math.cos(this.angle)
    const sin = Math.sin(this.angle)
    return [
      this.origin[0] + x * cos + z * sin,
      this.floor + this.origin[1] + y,
      this.origin[2] - x * sin + z * cos,
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
    colourOrOptions: number | { colour: number; rotation?: Point3 },
  ): void {
    const isNum = typeof colourOrOptions === 'number'
    const colour = isNum ? colourOrOptions : colourOrOptions.colour
    const rotation = (!isNum && colourOrOptions.rotation) ? colourOrOptions.rotation : ([0, this.angle, 0] as Point3)
    this.into.cylinder(size, { at: this.point(at), rotation, colour })
  }

  ring(radius: number, at: Point3, colour: number): void {
    this.into.ring(
      { radius, tube: 0.016 },
      { at: this.point(at), rotation: [0, this.angle, 0], colour },
    )
  }

  add(geometry: Three.BufferGeometry, at: Point3, colour: number): void {
    this.into.add(geometry, { at: this.point(at), rotation: [0, this.angle, 0], colour })
  }
}

export function camillaMouldedPost(surface: CamillaSurface, options: PostOptions): void {
  const { at, height, radius = 0.035, colour = CAMILLA_WOOD } = options
  const [x, y, z] = at

  surface.box([radius * 2.2, height * 0.15, radius * 2.2], [x, y + height * 0.075, z], colour)
  surface.cylinder(
    { radius, height: height * 0.65, sides: 12 },
    [x, y + height * 0.475, z],
    colour,
  )
  surface.sphere([radius * 1.3, height * 0.08, radius * 1.3], [x, y + height * 0.84, z], CAMILLA_GOLD)
  surface.box([radius * 2.2, height * 0.12, radius * 2.2], [x, y + height * 0.94, z], colour)
}

export function camillaCarvedLeg(
  surface: CamillaSurface,
  options: { at: Point3; height: number; colour?: number },
): void {
  const { at, height, colour = CAMILLA_WOOD } = options
  const [x, y, z] = at
  surface.cylinder({ radius: 0.04, bottom: 0.02, height, sides: 10 }, [x, y + height / 2, z], colour)
  surface.sphere([0.035, 0.025, 0.035], [x, y + 0.02, z], CAMILLA_GOLD)
}

export function camillaPanelFrame(surface: CamillaSurface, options: FrameOptions): void {
  const { width, height, at, trim = 0.05, colour = CAMILLA_GOLD } = options
  const [x, y, z] = at
  for (const side of [-1, 1]) {
    surface.box([width, trim, 0.03], [x, y + (side * height) / 2, z], colour)
    surface.box([trim, height, 0.03], [x + (side * width) / 2, y, z], colour)
  }
}
