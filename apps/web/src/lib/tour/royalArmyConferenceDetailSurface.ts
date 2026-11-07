import type * as Three from 'three'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

export const ARMY_STEEL = 0x2d3035
export const ARMY_LIGHT_STEEL = 0x5a5d64
export const ARMY_CHROME = 0x8d9096
export const ARMY_TABLE_WOOD = 0x3e352f
export const ARMY_TABLE_CHAMFER = 0x221d19
export const ARMY_SCREEN_WHITE = 0xeae8e1
export const ARMY_SCREEN_HOUSING = 0x33363b
export const ARMY_CHART_PALE = 0xdcd9d0
export const ARMY_CHART_GRID = 0x3d4f5d
export const ARMY_CHAIR_LEATHER = 0x232529
export const ARMY_CHAIR_CUSHION = 0x2c2f35
export const ARMY_PAPER = 0xe8e6df
export const ARMY_FOLDER = 0x7a6344
export const ARMY_MIC_STEM = 0x18191c
export const ARMY_MIC_LED = 0xbf3030
export const ARMY_GLASS = 0xb0c4de
export const ARMY_GLOW_LIGHT = 0xfffaee

export interface CylinderSize {
  radius: number
  height: number
  bottom?: number
  sides?: number
  open?: boolean
}

export interface SurfaceInitOptions {
  into: BanquetDetailBuilder
  origin?: Point3
  structure?: Structure
  floor?: number
  angle?: number
}

function resolveOrigin(options: SurfaceInitOptions): Point3 {
  if (options.origin) return options.origin
  if (options.structure) {
    const s = options.structure
    const f = options.floor ?? 0
    return [s.at[0], f + s.base, s.at[1]]
  }
  return [0, options.floor ?? 0, 0]
}

function resolveAngle(options: SurfaceInitOptions): number {
  if (options.angle !== undefined) return options.angle
  if (options.structure) {
    return -(options.structure.rotation * Math.PI) / 180
  }
  return 0
}

/** Local coordinate system for Royal Army conference room elements. */
export class RoyalArmyConferenceSurface {
  readonly into: BanquetDetailBuilder
  readonly origin: Point3
  readonly angle: number

  constructor(options: SurfaceInitOptions) {
    this.into = options.into
    this.origin = resolveOrigin(options)
    this.angle = resolveAngle(options)
  }

  point([x, y, z]: Point3): Point3 {
    const cos = Math.cos(this.angle)
    const sin = Math.sin(this.angle)
    return [
      this.origin[0] + x * cos + z * sin,
      this.origin[1] + y,
      this.origin[2] - x * sin + z * cos,
    ]
  }

  box(
    size: Point3,
    at: Point3,
    colour: number,
    glow = false,
  ): void {
    this.into.box(size, {
      at: this.point(at),
      rotation: [0, this.angle, 0],
      colour,
      glow,
    })
  }

  sphere(
    size: Point3,
    at: Point3,
    colour: number,
    glow = false,
  ): void {
    this.into.sphere(size, {
      at: this.point(at),
      rotation: [0, this.angle, 0],
      colour,
      glow,
    })
  }

  cylinder(
    size: CylinderSize,
    at: Point3,
    colour: number,
    rotation: Point3 = [0, this.angle, 0],
  ): void {
    this.into.cylinder(size, {
      at: this.point(at),
      rotation,
      colour,
    })
  }

  ring(radius: number, at: Point3, colour: number): void {
    this.into.ring(
      { radius, tube: 0.016 },
      { at: this.point(at), rotation: [0, this.angle, 0], colour },
    )
  }

  add(
    geometry: Three.BufferGeometry,
    at: Point3,
    colour: number,
  ): void {
    this.into.add(geometry, {
      at: this.point(at),
      rotation: [0, this.angle, 0],
      colour,
    })
  }
}

/** Helper to draw a conference delegate microphone (gooseneck + base). */
export function drawDeskMicrophone(
  surface: RoyalArmyConferenceSurface,
  at: Point3,
): void {
  const [x, y, z] = at
  // Base plate
  surface.box([0.12, 0.02, 0.12], [x, y + 0.01, z], ARMY_STEEL)
  surface.box([0.08, 0.015, 0.08], [x, y + 0.02, z], ARMY_LIGHT_STEEL)
  // Push-to-talk button
  surface.box([0.025, 0.01, 0.025], [x, y + 0.03, z + 0.02], ARMY_MIC_LED, true)
  // Gooseneck stem
  surface.cylinder({ radius: 0.006, height: 0.22, sides: 8 }, [x, y + 0.12, z - 0.01], ARMY_MIC_STEM)
  // Microphone head capsule
  surface.cylinder({ radius: 0.012, height: 0.04, sides: 10 }, [x, y + 0.24, z - 0.02], ARMY_STEEL)
  // Light ring at mic head
  surface.sphere([0.014, 0.005, 0.014], [x, y + 0.23, z - 0.02], ARMY_MIC_LED, true)
}

/** Helper to draw an attendee briefing notepad and pen. */
export function drawAttendeePaper(
  surface: RoyalArmyConferenceSurface,
  at: Point3,
): void {
  const [x, y, z] = at
  // Manila leather blotter / folder base
  surface.box([0.34, 0.008, 0.26], [x, y + 0.004, z], ARMY_FOLDER)
  // White notepad paper
  surface.box([0.28, 0.006, 0.2], [x, y + 0.01, z], ARMY_PAPER)
  // Metal pen
  surface.cylinder(
    { radius: 0.004, height: 0.14, sides: 6 },
    [x + 0.16, y + 0.01, z],
    ARMY_CHROME,
    [Math.PI / 2, 0, 0],
  )
}
