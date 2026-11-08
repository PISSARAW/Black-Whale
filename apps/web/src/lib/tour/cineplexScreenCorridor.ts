import {
  CineplexSurface,
  dressMoviePosterLightbox,
  CINE_BRASS,
  CINE_STEEL,
  CINE_WOOD,
  CINE_POSTER_FRAME,
  CINE_POSTER_ART,
  CINE_POSTER_GOLD,
  CINE_NEON_AMBER,
  CINE_NEON_BLUE,
  CINE_CARPET,
} from './cineplexDetailSurface'
import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'

/** Handrail along one side of the descending corridor ramp */
function dressRampHandrail(into: BanquetDetailBuilder, x: number, floor: number): void {
  const zStart = 1.0
  const zEnd = 12.0
  const postCount = 6
  // Vertical stanchion posts along the ramp edge
  for (let i = 0; i < postCount; i++) {
    const t = i / (postCount - 1)
    const z = zStart + (zEnd - zStart) * t
    const y = floor + 0.5 - t * 0.4
    into.cylinder({ radius: 0.035, height: 1.0, sides: 8 }, { at: [x, y, z], colour: CINE_BRASS })
  }
  // Top tubular handrail bar
  const midZ = (zStart + zEnd) / 2
  const midY = floor + 1.0 - 0.2
  const length = zEnd - zStart
  into.box([0.06, 0.06, length], {
    at: [x, midY, midZ],
    rotation: [0, 0, 0],
    colour: CINE_BRASS,
  })
  // Mid rail
  into.box([0.04, 0.04, length], {
    at: [x, midY - 0.45, midZ],
    rotation: [0, 0, 0],
    colour: CINE_STEEL,
  })
  // Floor curb with LED aisle light strip
  into.box([0.18, 0.1, length], {
    at: [x, floor + 0.05, midZ],
    rotation: [0, 0, 0],
    colour: CINE_WOOD,
  })
  into.box([0.08, 0.04, length * 0.98], {
    at: [x - (x > 0 ? 0.06 : -0.06), floor + 0.1, midZ],
    rotation: [0, 0, 0],
    colour: CINE_NEON_AMBER,
  })
}

/** Descending ramp surface with carpet runner and directional curbs */
export function dressDescendingRamp(into: BanquetDetailBuilder, floor: number): void {
  // Guardrails on both port (X = -6.5) and starboard (X = 6.5) edges
  dressRampHandrail(into, -6.5, floor)
  dressRampHandrail(into, 6.5, floor)

  // Central cinema carpet walkway leading down
  into.box([12.6, 0.02, 11.0], {
    at: [0, floor + 0.01, 6.5],
    rotation: [0, 0, 0],
    colour: CINE_CARPET,
  })

  // Transverse glowing aisle guide markers embedded in floor
  for (let z = 2.0; z <= 11.0; z += 2.2) {
    into.box([12.0, 0.01, 0.06], {
      at: [0, floor + 0.015, z],
      rotation: [0, 0, 0],
      colour: CINE_NEON_BLUE,
    })
  }
}

/** Giant overhead feature poster marquee "THE THING" (Ch. 393) */
export function dressFeaturePosterMarquee(surface: CineplexSurface): void {
  const [w, , h] = [surface.width, surface.depth, 2.2]
  // Marquee backboard and illuminated frame
  surface.box([w, h, 0.15], [0, h / 2, 0], CINE_POSTER_FRAME)
  surface.box([w + 0.3, 0.2, 0.25], [0, h + 0.1, 0], CINE_POSTER_GOLD)
  surface.box([w + 0.3, 0.2, 0.25], [0, -0.1, 0], CINE_POSTER_GOLD)

  // Giant title marquee text background ("THE THING")
  surface.box([w * 0.85, h * 0.65, 0.2], [0, h * 0.58, 0.02], 0x11161d)
  surface.box([w * 0.65, 0.45, 0.25], [0, h * 0.68, 0.05], 0xb82828)

  // Subtitle header: "SCREENS 1 - 8"
  surface.box([w * 0.4, 0.2, 0.22], [0, h * 0.22, 0.04], CINE_POSTER_GOLD)

  // Suspended illuminated screen arrow signs
  surface.box([2.4, 0.3, 0.12], [-2.8, -0.4, 0], 0x141e28)
  surface.box([2.2, 0.05, 0.14], [-2.8, -0.4, 0.02], CINE_NEON_AMBER)
  surface.box([2.4, 0.3, 0.12], [2.8, -0.4, 0], 0x141e28)
  surface.box([2.2, 0.05, 0.14], [2.8, -0.4, 0.02], CINE_NEON_AMBER)
}

/** Concourse massive central pillar with 4-sided movie poster lightboxes */
export function dressConcoursePillar(surface: CineplexSurface): void {
  const [w, d] = [surface.width, surface.depth]
  const pillarHeight = 6.0
  // Heavy stone pillar cladding
  surface.box([w, pillarHeight, d], [0, pillarHeight / 2, 0], 0x2e2f33)
  // Pillar base molding
  surface.box([w + 0.2, 0.4, d + 0.2], [0, 0.2, 0], CINE_WOOD)
  // Pillar crown molding
  surface.box([w + 0.2, 0.4, d + 0.2], [0, pillarHeight - 0.2, 0], CINE_WOOD)

  // Poster lightboxes on south (facing entrance) and north faces
  const posterSize: [number, number] = [w * 0.75, 1.8]
  const southAt: Point3 = [
    surface.structure.at[0],
    surface.floor + 2.2,
    surface.structure.at[1] - d / 2 - 0.05,
  ]
  dressMoviePosterLightbox({
    into: surface.into,
    at: southAt,
    size: posterSize,
    artColour: CINE_POSTER_ART,
  })

  const northAt: Point3 = [
    surface.structure.at[0],
    surface.floor + 2.2,
    surface.structure.at[1] + d / 2 + 0.05,
  ]
  dressMoviePosterLightbox({
    into: surface.into,
    at: northAt,
    size: posterSize,
    artColour: 0x8a3832,
  })
}
