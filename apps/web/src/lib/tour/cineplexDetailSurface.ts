import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

export const CINE_CARPET = 0x241218
export const CINE_HALL_CARPET = 0x5a2738
export const CINE_WOOD = 0x604638
export const CINE_DARK_PANEL = 0x383331
export const CINE_MARBLE = 0x55555e
export const CINE_BRASS = 0xd4af37
export const CINE_STEEL = 0x768088
export const CINE_GLASS = 0x88c0d0
export const CINE_POPCORN_GLOW = 0xf5d77f
export const CINE_POPCORN_RED = 0xcc292b
export const CINE_POPCORN_WHITE = 0xf2f2ee
export const CINE_POSTER_FRAME = 0x18181c
export const CINE_POSTER_ART = 0x3b6978
export const CINE_POSTER_GOLD = 0xcca652
export const CINE_NEON_AMBER = 0xec9d41
export const CINE_NEON_BLUE = 0x3d7499
export const CINE_VELVET = 0x851724
export const CINE_SCREEN_GLOW = 0x90a8b4
export const CINE_SCREEN_SURFACE = 0xe4ebf2
export const CINE_SCREEN_BORDER = 0x0a0a0c
export const CINE_EXIT_GREEN = 0x22c55e
export const CINE_SEAT_FABRIC = 0x6d1522
export const CINE_SEAT_FRAME = 0x1c1c20
export const CINE_GOLD_ACCENT = 0xd4af37
export const CINE_DUCT_STEEL = 0x5a636c
export const CINE_ACOUSTIC_FABRIC = 0x221a20
export const CINE_HALL_ACOUSTIC_FABRIC = 0x4b3742
export const CINE_CARPET_GOLD = 0xb5934e
export const CINE_SPEAKER_BLACK = 0x18181c

export interface PosterOptions {
  into: BanquetDetailBuilder
  at: Point3
  size: [number, number]
  rotation?: [number, number, number]
  artColour?: number
}

export interface StanchionOptions {
  into: BanquetDetailBuilder
  from: Point3
  to: Point3
  count: number
}

export class CineplexSurface {
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
}

/** Backlit framed movie poster for walls and concourse pillars */
export function dressMoviePosterLightbox(options: PosterOptions): void {
  const { into, at, size, rotation = [0, 0, 0], artColour = CINE_POSTER_ART } = options
  const [w, h] = size
  const frameThickness = 0.08
  into.box([w + frameThickness * 2, h + frameThickness * 2, 0.06], {
    at,
    rotation,
    colour: CINE_POSTER_FRAME,
  })
  into.box([w, h, 0.08], {
    at: [at[0], at[1], at[2] + 0.01],
    rotation,
    colour: artColour,
  })
  into.box([w * 0.8, 0.04, 0.09], {
    at: [at[0], at[1] - h * 0.42, at[2] + 0.015],
    rotation,
    colour: CINE_POSTER_GOLD,
  })
}

/** Brass stanchion post with heavy base and ball top */
function dressSingleStanchion(into: BanquetDetailBuilder, at: Point3): void {
  into.cylinder(
    { radius: 0.16, height: 0.04, sides: 12 },
    { at: [at[0], at[1] + 0.02, at[2]], colour: CINE_BRASS },
  )
  into.cylinder(
    { radius: 0.03, height: 0.9, sides: 8 },
    { at: [at[0], at[1] + 0.47, at[2]], colour: CINE_BRASS },
  )
  into.sphere([0.06, 0.06, 0.06], { at: [at[0], at[1] + 0.94, at[2]], colour: CINE_BRASS })
}

/** Velvet rope between two stanchions */
function dressVelvetRope(into: BanquetDetailBuilder, from: Point3, to: Point3): void {
  const midX = (from[0] + to[0]) / 2
  const midZ = (from[2] + to[2]) / 2
  const length = Math.hypot(to[0] - from[0], to[2] - from[2])
  const angle = Math.atan2(to[0] - from[0], to[2] - from[2])
  into.box([0.05, 0.05, length * 0.95], {
    at: [midX, from[1] + 0.78, midZ],
    rotation: [0, angle, 0],
    colour: CINE_VELVET,
  })
}

/** Queue guidance line with brass stanchions and velvet ropes */
export function dressStanchionLine(options: StanchionOptions): void {
  const { into, from, to, count } = options
  const posts: Point3[] = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const at: Point3 = [
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t,
    ]
    posts.push(at)
    dressSingleStanchion(into, at)
  }
  for (let i = 0; i < posts.length - 1; i++) {
    dressVelvetRope(into, posts[i], posts[i + 1])
  }
}

/** Illuminated green emergency EXIT sign box */
export function dressExitLightBox(
  into: BanquetDetailBuilder,
  at: Point3,
  rotation: [number, number, number] = [0, 0, 0],
): void {
  // Dark box casing
  into.box([0.55, 0.22, 0.12], { at, rotation, colour: CINE_POSTER_FRAME })
  // Glowing green lens
  into.box([0.5, 0.18, 0.13], { at, rotation, colour: CINE_EXIT_GREEN, glow: true })
}

/** Screen portal illuminated room number header box (e.g. SCREEN 1) */
export function dressScreenPortalSign(
  into: BanquetDetailBuilder,
  at: Point3,
  accent = CINE_NEON_AMBER,
): void {
  const rotation: [number, number, number] = [0, 0, 0]
  // Beveled outer casing
  into.box([1.4, 0.35, 0.15], { at, rotation, colour: CINE_POSTER_FRAME })
  // Backlit screen number plate
  into.box([1.3, 0.28, 0.16], { at, rotation, colour: accent, glow: true })
}
