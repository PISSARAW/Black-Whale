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

export const ARMY_CEILING_GRID = 0x22252a
export const ARMY_CEILING_TILE = 0xd8dbe0
export const ARMY_HVAC_SLAT = 0x3e4249
export const ARMY_CARPET_DARK = 0x1b1e22
export const ARMY_CARPET_BORDER = 0x2e333b
export const ARMY_INLAY_BRASS = 0xb28938
export const ARMY_GOLD_CREST = 0xcfa438
export const ARMY_ALERT_RED = 0xc0392b
export const ARMY_EMERGENCY_GREEN = 0x27ae60
export const ARMY_PROJECTOR_LENS = 0x4a9eff
export const ARMY_SCREEN_TACTICAL_BLUE = 0x1f4e79
export const ARMY_SCREEN_TACTICAL_CYAN = 0x2980b9
export const ARMY_SCREEN_TACTICAL_ACCENT = 0xe67e22
export const ARMY_BLOTTER_LEATHER = 0x1a1c1e
export const ARMY_NAMEPLATE_BRASS = 0xb8860b

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
    colourOrOptions: number | { colour: number; glow?: boolean },
  ): void {
    const colour = typeof colourOrOptions === 'number' ? colourOrOptions : colourOrOptions.colour
    const glow = typeof colourOrOptions === 'object' ? colourOrOptions.glow ?? false : false
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
    colourOrOptions: number | { colour: number; glow?: boolean },
  ): void {
    const colour = typeof colourOrOptions === 'number' ? colourOrOptions : colourOrOptions.colour
    const glow = typeof colourOrOptions === 'object' ? colourOrOptions.glow ?? false : false
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
    colourOrOptions: number | { colour: number; rotation?: Point3 },
  ): void {
    const colour = typeof colourOrOptions === 'number' ? colourOrOptions : colourOrOptions.colour
    const rotation: Point3 =
      typeof colourOrOptions === 'object' && colourOrOptions.rotation
        ? colourOrOptions.rotation
        : [0, this.angle, 0]
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
  surface.box([0.025, 0.01, 0.025], [x, y + 0.03, z + 0.02], { colour: ARMY_MIC_LED, glow: true })
  // Gooseneck stem
  surface.cylinder({ radius: 0.006, height: 0.22, sides: 8 }, [x, y + 0.12, z - 0.01], ARMY_MIC_STEM)
  // Microphone head capsule
  surface.cylinder({ radius: 0.012, height: 0.04, sides: 10 }, [x, y + 0.24, z - 0.02], ARMY_STEEL)
  // Light ring at mic head
  surface.sphere([0.014, 0.005, 0.014], [x, y + 0.23, z - 0.02], { colour: ARMY_MIC_LED, glow: true })
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
    { colour: ARMY_CHROME, rotation: [Math.PI / 2, 0, 0] },
  )
}

/** Helper to draw an official brass/wood triangular desk nameplate. */
export function drawDelegateNameplate(
  surface: RoyalArmyConferenceSurface,
  at: Point3,
  width = 0.22,
): void {
  const [x, y, z] = at
  // Triangular wood wedge base
  surface.box([width, 0.035, 0.04], [x, y + 0.018, z], ARMY_TABLE_WOOD)
  // Slanted brass faceplate
  surface.box([width - 0.02, 0.028, 0.008], [x, y + 0.018, z + 0.018], ARMY_NAMEPLATE_BRASS)
  // Subtle name label strip
  surface.box([width - 0.06, 0.012, 0.004], [x, y + 0.018, z + 0.023], ARMY_PAPER)
}

/** Helper to draw a tactical colored magnetic push-pin on a chart board. */
export function drawTacticalPin(
  surface: RoyalArmyConferenceSurface,
  at: Point3,
  colour: number,
): void {
  const [x, y, z] = at
  // Flat magnetic disc
  surface.cylinder({ radius: 0.022, height: 0.008, sides: 12 }, [x, y, z], { colour, rotation: [Math.PI / 2, 0, 0] })
  // Tapered grip pin
  surface.cylinder(
    { radius: 0.012, height: 0.02, sides: 10 },
    [x, y, z + 0.012],
    { colour: ARMY_CHROME, rotation: [Math.PI / 2, 0, 0] },
  )
}

/** Helper to draw a confidential top-secret military folder with red diagonal stripe. */
export function drawDossierWithStripe(
  surface: RoyalArmyConferenceSurface,
  at: Point3,
): void {
  const [x, y, z] = at
  // Charcoal/black heavy cardboard folder
  surface.box([0.32, 0.012, 0.24], [x, y + 0.006, z], ARMY_STEEL)
  // Interior paper sheets peek
  surface.box([0.3, 0.006, 0.22], [x + 0.01, y + 0.01, z], ARMY_PAPER)
  // Diagonal warning stripe in red
  surface.box([0.31, 0.008, 0.04], [x, y + 0.012, z], ARMY_ALERT_RED)
  // Kakin military seal stamp
  surface.cylinder(
    { radius: 0.02, height: 0.004, sides: 10 },
    [x + 0.08, y + 0.015, z],
    { colour: ARMY_GOLD_CREST, rotation: [0, 0, 0] },
  )
}

