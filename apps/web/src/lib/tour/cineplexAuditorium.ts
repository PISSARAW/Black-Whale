import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Space } from './types'
import {
  CINE_WOOD,
  CINE_CARPET,
  CINE_SCREEN_SURFACE,
  CINE_SCREEN_BORDER,
  CINE_SCREEN_GLOW,
  CINE_SEAT_FABRIC,
  CINE_SEAT_FRAME,
  CINE_ACOUSTIC_FABRIC,
  CINE_NEON_BLUE,
  CINE_VELVET,
  CINE_BRASS,
} from './cineplexDetailSurface'
import { dressEmergencyExitDoor } from './cineplexWalls'

interface AuditoriumContext {
  into: BanquetDetailBuilder
  centerX: number
  floor: number
}

/** Giant projection screen at the north end of the auditorium */
function dressAuditoriumScreen(context: AuditoriumContext): void {
  const { into, centerX, floor } = context
  const screenZ = 36.8
  const screenW = 5.6
  const screenH = 3.2
  const screenY = floor + 2.3

  // Stage dais at the front of the screen
  into.box([screenW + 0.8, 0.45, 1.6], {
    at: [centerX, floor + 0.22, screenZ - 0.7],
    colour: CINE_WOOD,
  })

  // Velvet black acoustic masking surround
  into.box([screenW + 0.6, screenH + 0.6, 0.12], {
    at: [centerX, screenY, screenZ],
    colour: CINE_SCREEN_BORDER,
  })

  // Silver matte curved screen canvas
  into.box([screenW, screenH, 0.1], {
    at: [centerX, screenY, screenZ - 0.02],
    colour: CINE_SCREEN_SURFACE,
  })

  // Screen ambient illumination glow
  into.box([screenW * 0.95, screenH * 0.95, 0.05], {
    at: [centerX, screenY, screenZ - 0.06],
    colour: CINE_SCREEN_GLOW,
    glow: true,
  })

  // Front sub-stage speaker baffles
  for (const side of [-1, 1]) {
    into.box([0.7, 0.5, 0.4], {
      at: [centerX + side * (screenW / 2 - 0.3), floor + 0.25, screenZ - 0.3],
      colour: 0x141416,
    })
  }
}

/** Single row of velvet cinema armchairs with armrests and cup holders */
function dressSeatRow(
  into: BanquetDetailBuilder,
  options: { centerX: number; z: number; y: number },
): void {
  const { centerX, z, y } = options
  const seatWidth = 0.58
  const seatCount = 6
  const totalW = seatCount * seatWidth
  const startX = centerX - totalW / 2 + seatWidth / 2

  for (let i = 0; i < seatCount; i++) {
    const sx = startX + i * seatWidth
    // Steel chair leg frame
    into.box([0.04, 0.45, 0.4], { at: [sx, y + 0.22, z], colour: CINE_SEAT_FRAME })
    // Velvet upholstered seat cushion
    into.box([0.48, 0.12, 0.46], { at: [sx, y + 0.44, z - 0.04], colour: CINE_SEAT_FABRIC })
    // Velvet upholstered seat backrest
    into.box([0.46, 0.58, 0.12], { at: [sx, y + 0.72, z + 0.16], colour: CINE_SEAT_FABRIC })
    // Armrest with cup holder
    into.box([0.06, 0.06, 0.36], { at: [sx - 0.26, y + 0.56, z - 0.02], colour: CINE_SEAT_FRAME })
    into.cylinder({ radius: 0.04, height: 0.08, sides: 8 }, { at: [sx - 0.26, y + 0.6, z - 0.16], colour: 0x2a2a2e })
  }
}

/** Tiered / raked seating risers with carpet and LED step markers */
function dressRakedSeating(context: AuditoriumContext): void {
  const { into, centerX, floor } = context
  const rows = [
    { z: 32.5, y: floor, riser: 0 },
    { z: 30.5, y: floor + 0.32, riser: 0.32 },
    { z: 28.5, y: floor + 0.64, riser: 0.32 },
    { z: 26.5, y: floor + 0.96, riser: 0.32 },
    { z: 24.5, y: floor + 1.28, riser: 0.32 },
    { z: 22.5, y: floor + 1.6, riser: 0.32 },
  ]

  for (const row of rows) {
    // Riser platform slab
    into.box([6.4, 0.32, 1.95], {
      at: [centerX, row.y - 0.16, row.z],
      colour: CINE_CARPET,
    })
    // Front edge trim and LED step guide
    into.box([6.4, 0.03, 0.04], {
      at: [centerX, row.y, row.z - 0.98],
      colour: CINE_BRASS,
    })
    into.box([6.2, 0.015, 0.02], {
      at: [centerX, row.y + 0.01, row.z - 0.96],
      colour: CINE_NEON_BLUE,
      glow: true,
    })
    // Row of seats
    dressSeatRow(into, { centerX, z: row.z, y: row.y })
  }

  // Back access walkway at rear
  into.box([6.4, 0.02, 3.5], {
    at: [centerX, floor + 0.01, 19.5],
    colour: CINE_CARPET,
  })
}

/** Projection booth window and projection beam port on rear wall */
function dressProjectionBooth(context: AuditoriumContext): void {
  const { into, centerX, floor } = context
  const boothZ = 17.6
  const boothY = floor + 4.2
  // Outer booth window frame
  into.box([1.4, 0.8, 0.12], { at: [centerX, boothY, boothZ], colour: 0x18181c })
  // Glazed projection port
  into.box([1.2, 0.6, 0.08], { at: [centerX, boothY, boothZ + 0.02], colour: 0x7da8b8 })
  // Glowing projector lens aperture
  into.cylinder(
    { radius: 0.12, height: 0.06, sides: 12 },
    { at: [centerX, boothY, boothZ + 0.04], rotation: [Math.PI / 2, 0, 0], colour: 0xffffff, glow: true },
  )
}

/** Acoustic pleated side wall drapes and safety exit */
function dressAuditoriumWalls(context: AuditoriumContext): void {
  const { into, centerX, floor } = context
  const halfW = 3.4
  // Side acoustic fabric panels
  for (const side of [-1, 1]) {
    const wx = centerX + side * halfW
    into.box([0.08, 5.0, 18.0], {
      at: [wx, floor + 2.5, 27.5],
      colour: CINE_ACOUSTIC_FABRIC,
    })
    // Low level dimmer wall lights along sidewalls
    for (const z of [22.0, 26.0, 30.0, 34.0]) {
      into.box([0.06, 0.18, 0.14], {
        at: [wx - side * 0.05, floor + 1.6, z],
        colour: CINE_BRASS,
      })
      into.box([0.04, 0.1, 0.08], {
        at: [wx - side * 0.08, floor + 1.6, z],
        colour: 0xcc8a3b,
        glow: true,
      })
    }
  }

  // Emergency exit door at front east corner
  dressEmergencyExitDoor(
    into,
    [centerX + halfW - 0.15, floor, 34.5],
    [0, -Math.PI / 2, 0],
  )

  // Velvet acoustic entrance door curtain
  into.box([1.8, 2.8, 0.18], {
    at: [centerX, floor + 1.4, 18.2],
    colour: CINE_VELVET,
  })
}

/** Complete Cinema Auditorium interior dressing for screens 1 through 8 */
export function dressCinemaAuditorium(into: BanquetDetailBuilder, space: Space, floor: number): void {
  // Determine center X of auditorium from its footprint
  const xs = space.footprint.map(([x]) => x)
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2
  const context: AuditoriumContext = { into, centerX, floor }

  dressAuditoriumScreen(context)
  dressRakedSeating(context)
  dressProjectionBooth(context)
  dressAuditoriumWalls(context)
}
