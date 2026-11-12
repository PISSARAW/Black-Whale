import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import {
  CINE_WOOD,
  CINE_VELVET,
  CINE_HALL_CARPET,
  CINE_POSTER_FRAME,
  CINE_NEON_AMBER,
  CINE_NEON_BLUE,
  CINE_STEEL,
  dressScreenPortalSign,
  dressExitLightBox,
} from './cineplexDetailSurface'
import { dressEmergencyExitDoor } from './cineplexWalls'
import { CINEPLEX_FORMATS, type CineplexFormat } from './cineplexFormats'

const SCREEN_POSITIONS = CINEPLEX_FORMATS.map((format) => ({
  format,
  x: -24.5 + (format.number - 1) * 7,
}))

interface ScreenPortalOptions {
  into: BanquetDetailBuilder
  format: CineplexFormat
  x: number
  floor: number
}

/** Architectural portal around an auditorium entrance with illuminated sign and velvet curtains */
function dressScreenPortal(options: ScreenPortalOptions): void {
  const { into, format, x, floor } = options
  const doorZ = 17.45
  const portalW = 2.4
  const portalH = 2.8

  // Outer beveled mahogany architrave
  into.box([portalW + 0.3, 0.2, 0.15], {
    at: [x, floor + portalH + 0.1, doorZ],
    colour: CINE_WOOD,
  })
  for (const side of [-1, 1]) {
    into.box([0.18, portalH, 0.15], {
      at: [x + (side * portalW) / 2, floor + portalH / 2, doorZ],
      colour: CINE_WOOD,
    })
    // Velvet door drape panel on sides
    into.box([0.28, portalH - 0.2, 0.18], {
      at: [x + side * (portalW / 2 - 0.2), floor + portalH / 2 - 0.1, doorZ],
      colour: CINE_VELVET,
    })
  }

  // Overhead illuminated screen sign ("SCREEN X")
  dressScreenPortalSign(into, [x, floor + portalH + 0.35, doorZ + 0.05], format.accent)

  // Mini digital "Now Showing" poster box beside the door
  into.box([0.7, 1.0, 0.08], {
    at: [x - portalW / 2 - 0.55, floor + 1.8, doorZ],
    colour: CINE_POSTER_FRAME,
  })
  into.box([0.62, 0.9, 0.09], {
    at: [x - portalW / 2 - 0.55, floor + 1.8, doorZ + 0.01],
    colour: format.accent,
  })
  into.box([0.5, 0.08, 0.11], {
    at: [x - portalW / 2 - 0.55, floor + 1.25, doorZ + 0.02],
    colour: CINE_NEON_AMBER,
    glow: true,
  })
  into.box([portalW - 0.28, 0.055, 0.2], {
    at: [x, floor + 0.08, doorZ + 0.04],
    colour: format.accent,
    glow: true,
  })
}

/** Suspended directional signs along the screens hall */
function dressScreensHallSignage(into: BanquetDetailBuilder, floor: number): void {
  const signY = floor + 4.2
  // Center crossway toward ramp: "RAMPE / SORTIE CONCOURSE ↑"
  into.box([3.2, 0.45, 0.15], { at: [0, signY, 13.5], colour: CINE_POSTER_FRAME })
  into.box([3.0, 0.36, 0.17], { at: [0, signY, 13.5], colour: CINE_NEON_AMBER, glow: true })

  // West branch: "← SALLES 1 - 4"
  into.box([2.8, 0.4, 0.15], { at: [-14.0, signY, 15.0], colour: CINE_POSTER_FRAME })
  into.box([2.6, 0.32, 0.17], { at: [-14.0, signY, 15.0], colour: CINE_NEON_BLUE, glow: true })

  // East branch: "SALLES 5 - 8 →"
  into.box([2.8, 0.4, 0.15], { at: [14.0, signY, 15.0], colour: CINE_POSTER_FRAME })
  into.box([2.6, 0.32, 0.17], { at: [14.0, signY, 15.0], colour: CINE_NEON_BLUE, glow: true })
}

/** Waste and recycling stations in the lower screens hall */
function dressScreensHallAmenities(into: BanquetDetailBuilder, floor: number): void {
  for (const x of [-27.0, 27.0]) {
    // Emergency exit door at both lateral ends
    const at: Point3 = [x, floor, 15.0]
    const rotation: [number, number, number] = [0, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]
    dressEmergencyExitDoor(into, at, rotation)
  }

  // Waste and recycling bin clusters
  for (const x of [-16.0, 16.0]) {
    into.box([1.1, 0.9, 0.5], { at: [x, floor + 0.45, 13.0], colour: 0x222226 })
    into.box([0.3, 0.04, 0.35], { at: [x - 0.3, floor + 0.92, 13.0], colour: CINE_STEEL })
    into.box([0.3, 0.04, 0.35], { at: [x + 0.3, floor + 0.92, 13.0], colour: CINE_STEEL })
  }
}

/** Complete Screens Hall (distribution hall for auditoriums 1 through 8) */
export function dressScreensHallConcourse(into: BanquetDetailBuilder, floor: number): void {
  // Main corridor carpet runner
  into.box([55.0, 0.015, 4.4], {
    at: [0, floor + 0.008, 15.0],
    colour: CINE_HALL_CARPET,
  })

  // Transverse glowing step markers along the corridor
  for (let x = -26.0; x <= 26.0; x += 3.5) {
    into.box([0.08, 0.008, 4.2], {
      at: [x, floor + 0.012, 15.0],
      colour: CINE_NEON_BLUE,
    })
  }

  // Dress the 8 individual screening portals
  for (const screen of SCREEN_POSITIONS) {
    dressScreenPortal({ into, format: screen.format, x: screen.x, floor })
  }

  // Signage and amenities
  dressScreensHallSignage(into, floor)
  dressScreensHallAmenities(into, floor)

  // Overhead exit signs
  dressExitLightBox(into, [0, floor + 3.2, 12.6])
}
