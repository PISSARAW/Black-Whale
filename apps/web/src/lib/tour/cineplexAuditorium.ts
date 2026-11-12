import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Space } from './types'
import {
  CINE_ACOUSTIC_FABRIC,
  CINE_BRASS,
  CINE_CARPET,
  CINE_NEON_BLUE,
  CINE_SCREEN_BORDER,
  CINE_SCREEN_GLOW,
  CINE_SCREEN_SURFACE,
  CINE_VELVET,
  CINE_WOOD,
} from './cineplexDetailSurface'
import { cineplexFormatFor, type CineplexFormat } from './cineplexFormats'
import { dressCineplexSeatRow } from './cineplexSeats'
import { dressAuditoriumTechnology } from './cineplexAuditoriumTech'
import { dressEmergencyExitDoor } from './cineplexWalls'

interface AuditoriumContext {
  into: BanquetDetailBuilder
  centerX: number
  floor: number
  format: CineplexFormat
}

const ROWS = [20.2, 22.8, 25.4, 28.0, 30.6, 33.2] as const

function screenDimensions(format: CineplexFormat): { width: number; height: number; y: number } {
  if (format.screenKind === 'imax') return { width: 6.35, height: 4.65, y: 2.55 }
  if (format.screenKind === 'vision') return { width: 5.9, height: 3.35, y: 2.35 }
  if (format.screenKind === 'led') return { width: 5.8, height: 3.25, y: 2.35 }
  return { width: 5.65, height: 3.2, y: 2.3 }
}

function dressAuditoriumScreen(context: AuditoriumContext): void {
  const { into, centerX, floor, format } = context
  const screenZ = 36.92
  const dimensions = screenDimensions(format)
  const screenY = floor + dimensions.y
  const glow = format.screenKind === 'led' ? 0xc5f7ff : CINE_SCREEN_GLOW

  into.box([dimensions.width + 0.7, 0.36, 1.25], {
    at: [centerX, floor + 0.18, screenZ - 0.58],
    colour: CINE_WOOD,
  })
  into.box([dimensions.width + 0.28, dimensions.height + 0.28, 0.13], {
    at: [centerX, screenY, screenZ],
    colour: CINE_SCREEN_BORDER,
  })
  into.box([dimensions.width, dimensions.height, 0.1], {
    at: [centerX, screenY, screenZ - 0.04],
    colour: format.screenKind === 'led' ? glow : CINE_SCREEN_SURFACE,
    glow: format.screenKind === 'led',
  })
  if (format.screenKind !== 'led') {
    into.box([dimensions.width * 0.94, dimensions.height * 0.92, 0.045], {
      at: [centerX, screenY, screenZ - 0.1],
      colour: glow,
      glow: true,
    })
  } else {
    for (const offset of [-1.45, 0, 1.45]) {
      into.box([0.025, dimensions.height, 0.03], {
        at: [centerX + offset, screenY, screenZ - 0.11],
        colour: 0x17252b,
      })
    }
  }

  for (const side of [-1, 1]) {
    into.box([0.64, 0.48, 0.38], {
      at: [centerX + side * (dimensions.width / 2 - 0.35), floor + 0.24, screenZ - 0.32],
      colour: 0x111114,
    })
  }
}

function dressRakedSeating(context: AuditoriumContext): void {
  const { into, centerX, floor, format } = context
  for (let index = 0; index < ROWS.length; index++) {
    const z = ROWS[index]
    const height = 0.16 + (ROWS.length - 1 - index) * 0.24
    into.box([5.25, height, 2.6], {
      at: [centerX, floor + height / 2, z],
      colour: CINE_CARPET,
    })
    into.box([5.2, 0.028, 0.045], {
      at: [centerX, floor + height + 0.02, z + 1.21],
      colour: index % 2 === 0 ? format.accent : CINE_NEON_BLUE,
      glow: true,
    })
    dressCineplexSeatRow({ into, centerX, y: floor + height, z, format })
  }

  const rearHeight = 0.16 + (ROWS.length - 1) * 0.24
  for (let index = 0; index < 6; index++) {
    const height = (rearHeight * (index + 1)) / 6
    into.box([0.86, height, 0.23], {
      at: [centerX, floor + height / 2, 17.615 + index * 0.23],
      colour: CINE_CARPET,
    })
    into.box([0.78, 0.02, 0.03], {
      at: [centerX, floor + height + 0.015, 17.72 + index * 0.23],
      colour: format.accent,
      glow: true,
    })
  }
}

function dressProjectionBooth(context: AuditoriumContext): void {
  const { into, centerX, floor, format } = context
  into.box([1.65, 0.9, 0.13], {
    at: [centerX, floor + 4.05, 17.62],
    colour: 0x17171b,
  })
  into.box([1.4, 0.66, 0.09], {
    at: [centerX, floor + 4.05, 17.68],
    colour: 0x789cac,
    glass: true,
  })
  into.cylinder(
    { radius: 0.12, height: 0.08, sides: 12 },
    {
      at: [centerX, floor + 4.05, 17.76],
      rotation: [Math.PI / 2, 0, 0],
      colour: format.accent,
      glow: true,
    },
  )
}

function dressAuditoriumWalls(context: AuditoriumContext): void {
  const { into, centerX, floor, format } = context
  for (const side of [-1, 1]) {
    const x = centerX + side * 3.4
    into.box([0.08, 5.0, 19.7], {
      at: [x, floor + 2.5, 27.6],
      colour: CINE_ACOUSTIC_FABRIC,
    })
    for (const z of [21.0, 24.5, 28.0, 31.5, 35.0]) {
      into.box([0.055, 0.22, 0.18], {
        at: [x - side * 0.06, floor + 1.45, z],
        colour: CINE_BRASS,
      })
      into.box([0.04, 0.12, 0.1], {
        at: [x - side * 0.09, floor + 1.45, z],
        colour: format.accent,
        glow: true,
      })
    }
  }
  dressEmergencyExitDoor(into, [centerX + 3.18, floor, 35.1], [0, -Math.PI / 2, 0])
  into.box([1.55, 2.75, 0.16], {
    at: [centerX, floor + 1.38, 17.72],
    colour: CINE_VELVET,
  })
}

/** Eight distinct premium rooms fitted inside the eight envelopes established by the deck plan. */
export function dressCinemaAuditorium(
  into: BanquetDetailBuilder,
  space: Space,
  floor: number,
): void {
  const format = cineplexFormatFor(space.id)
  if (!format) return
  const xs = space.footprint.map(([x]) => x)
  const context: AuditoriumContext = {
    into,
    centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
    floor,
    format,
  }
  dressAuditoriumScreen(context)
  dressRakedSeating(context)
  dressProjectionBooth(context)
  dressAuditoriumWalls(context)
  dressAuditoriumTechnology(context)
}
