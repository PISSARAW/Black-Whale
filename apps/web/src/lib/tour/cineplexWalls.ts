import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import {
  CINE_WOOD,
  CINE_BRASS,
  CINE_GOLD_ACCENT,
  CINE_STEEL,
  CINE_POSTER_ART,
  dressMoviePosterLightbox,
  dressExitLightBox,
} from './cineplexDetailSurface'

export interface WallSpanOptions {
  into: BanquetDetailBuilder
  from: [number, number]
  to: [number, number]
  floor: number
  ceiling: number
}

interface SconceOptions {
  into: BanquetDetailBuilder
  at: Point3
  rotation: [number, number, number]
}

/** Art-deco brass wall sconce with dual up/down warm illumination */
export function dressCinemaWallSconce(options: SconceOptions): void {
  const { into, at, rotation } = options
  // Central brass mounting bracket
  into.box([0.14, 0.26, 0.08], { at, rotation, colour: CINE_BRASS })
  // Upper flared luminaire cone
  into.cylinder(
    { radius: 0.08, bottom: 0.04, height: 0.16, sides: 8 },
    { at: [at[0], at[1] + 0.18, at[2]], rotation, colour: CINE_GOLD_ACCENT },
  )
  into.box([0.1, 0.03, 0.08], {
    at: [at[0], at[1] + 0.28, at[2]],
    rotation,
    colour: 0xffe8b3,
    glow: true,
  })
  // Lower flared luminaire cone
  into.cylinder(
    { radius: 0.04, bottom: 0.08, height: 0.16, sides: 8 },
    { at: [at[0], at[1] - 0.18, at[2]], rotation, colour: CINE_GOLD_ACCENT },
  )
  into.box([0.1, 0.03, 0.08], {
    at: [at[0], at[1] - 0.28, at[2]],
    rotation,
    colour: 0xffe8b3,
    glow: true,
  })
}

/** Emergency fire exit metal door with push bar and overhead illuminated EXIT sign */
export function dressEmergencyExitDoor(
  into: BanquetDetailBuilder,
  at: Point3,
  rotation: [number, number, number] = [0, 0, 0],
): void {
  const doorW = 1.3
  const doorH = 2.4
  // Dark steel door frame
  into.box([doorW + 0.16, doorH + 0.08, 0.1], {
    at: [at[0], at[1] + doorH / 2, at[2]],
    rotation,
    colour: 0x1a1a1c,
  })
  // Metal door leaf
  into.box([doorW, doorH, 0.06], {
    at: [at[0], at[1] + doorH / 2, at[2] + 0.01],
    rotation,
    colour: CINE_STEEL,
  })
  // Red panic crash bar
  into.box([doorW * 0.8, 0.06, 0.08], {
    at: [at[0], at[1] + 1.05, at[2] + 0.06],
    rotation,
    colour: 0xcc292b,
  })
  // Overhead illuminated green EXIT box
  dressExitLightBox(into, [at[0], at[1] + doorH + 0.2, at[2] + 0.04], rotation)
}

/** Linear wall stretch with baseboard plinth and crown moulding */
export function dressWallMouldings(options: WallSpanOptions): void {
  const { into, from, to, floor, ceiling } = options
  const length = Math.hypot(to[0] - from[0], to[1] - from[1])
  const angle = Math.atan2(to[0] - from[0], to[1] - from[1])
  const midX = (from[0] + to[0]) / 2
  const midZ = (from[1] + to[1]) / 2

  // Baseboard plinth in mahogany
  into.box([0.08, 0.22, length], {
    at: [midX, floor + 0.11, midZ],
    rotation: [0, angle, 0],
    colour: CINE_WOOD,
  })
  // Polished brass plinth cap
  into.box([0.09, 0.02, length], {
    at: [midX, floor + 0.22, midZ],
    rotation: [0, angle, 0],
    colour: CINE_GOLD_ACCENT,
  })

  // Ceiling crown moulding in mahogany
  into.box([0.1, 0.18, length], {
    at: [midX, ceiling - 0.09, midZ],
    rotation: [0, angle, 0],
    colour: CINE_WOOD,
  })
}

/** Acoustic fabric-wrapped wall panel bays with vertical pilasters and sconces */
export function dressAcousticWallBays(options: WallSpanOptions): void {
  const { into, from, to, floor, ceiling } = options
  const length = Math.hypot(to[0] - from[0], to[1] - from[1])
  const angle = Math.atan2(to[0] - from[0], to[1] - from[1])
  const normalAngle = angle + Math.PI / 2
  const height = ceiling - floor

  // Keep the baked wall exposed between bays so the sconces' calculated light
  // reaches the visible surface instead of being covered by a dark detail slab.

  // Vertical mahogany pilasters dividing acoustic bays
  const bayPitch = 3.6
  const count = Math.max(1, Math.floor(length / bayPitch))

  for (let i = 0; i <= count; i++) {
    const t = i / count
    const px = from[0] + (to[0] - from[0]) * t
    const pz = from[1] + (to[1] - from[1]) * t
    // Vertical wood pilaster
    into.box([0.12, height - 0.4, 0.16], {
      at: [px, floor + height / 2, pz],
      rotation: [0, angle, 0],
      colour: CINE_WOOD,
    })
    // Brass fluting strip
    into.box([0.14, height - 0.6, 0.04], {
      at: [px, floor + height / 2, pz],
      rotation: [0, angle, 0],
      colour: CINE_GOLD_ACCENT,
    })
    // Sconce mounted on alternate pilasters
    if (i > 0 && i < count && i % 2 === 1) {
      dressCinemaWallSconce({
        into,
        at: [px, floor + 2.2, pz],
        rotation: [0, normalAngle, 0],
      })
    }
  }
}

/** Complete concourse perimeter wall dressing with mouldings, panels, posters and exit */
export function dressConcourseWallSpan(options: WallSpanOptions): void {
  dressWallMouldings(options)
  dressAcousticWallBays(options)
}

/** Dressed movie poster array along a continuous wall run */
export function dressWallPosters(options: {
  into: BanquetDetailBuilder
  from: [number, number]
  to: [number, number]
  floor: number
}): void {
  const { into, from, to, floor } = options
  const length = Math.hypot(to[0] - from[0], to[1] - from[1])
  const angle = Math.atan2(to[0] - from[0], to[1] - from[1])
  const posterPitch = 4.2
  const count = Math.max(1, Math.floor(length / posterPitch))

  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count
    const px = from[0] + (to[0] - from[0]) * t
    const pz = from[1] + (to[1] - from[1]) * t
    dressMoviePosterLightbox({
      into,
      at: [px, floor + 2.1, pz],
      size: [1.3, 1.9],
      rotation: [0, angle, 0],
      artColour: i % 2 === 0 ? CINE_POSTER_ART : 0x8a3832,
    })
  }
}
