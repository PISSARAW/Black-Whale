import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { CineplexFormat, CineplexSeatKind } from './cineplexFormats'
import { CINE_SEAT_FABRIC, CINE_SEAT_FRAME, CINE_STEEL } from './cineplexDetailSurface'

interface SeatOptions {
  into: BanquetDetailBuilder
  x: number
  y: number
  z: number
  width: number
  kind: CineplexSeatKind
  accent: number
}

interface SeatRowOptions {
  into: BanquetDetailBuilder
  centerX: number
  y: number
  z: number
  format: CineplexFormat
}

function dressMotionBase(options: SeatOptions): void {
  const { into, x, y, z, width, kind, accent } = options
  if (kind === 'standard' || kind === 'recliner') {
    into.box([0.08, 0.42, 0.42], { at: [x, y + 0.21, z], colour: CINE_SEAT_FRAME })
    return
  }

  into.box([width * 0.68, 0.12, 0.5], {
    at: [x, y + 0.12, z - 0.02],
    colour: CINE_SEAT_FRAME,
  })
  for (const side of [-1, 1]) {
    into.cylinder(
      { radius: 0.055, height: 0.35, sides: 8 },
      {
        at: [x + side * width * 0.22, y + 0.27, z - 0.02],
        rotation: [0.12 * side, 0, 0],
        colour: CINE_STEEL,
      },
    )
  }
  into.box([width * 0.58, 0.045, 0.54], {
    at: [x, y + 0.2, z - 0.02],
    colour: kind === 'dbox' ? accent : CINE_STEEL,
  })
}

function dressSeat(options: SeatOptions): void {
  const { into, x, y, z, width, kind, accent } = options
  const reclined = kind === 'recliner'
  const fabric = kind === 'dbox' ? 0x68151b : CINE_SEAT_FABRIC
  dressMotionBase(options)

  into.box([width * 0.76, 0.15, reclined ? 0.62 : 0.52], {
    at: [x, y + 0.48, z + 0.04],
    rotation: [reclined ? -0.08 : 0, 0, 0],
    colour: fabric,
  })
  into.box([width * 0.8, reclined ? 0.7 : 0.64, 0.16], {
    at: [x, y + 0.8, z - 0.28],
    rotation: [reclined ? -0.16 : -0.06, 0, 0],
    colour: fabric,
  })
  into.box([width * 0.42, 0.11, 0.12], {
    at: [x, y + 1.16, z - 0.3],
    colour: fabric,
  })

  for (const side of [-1, 1]) {
    into.box([0.08, 0.1, 0.48], {
      at: [x + side * width * 0.47, y + 0.62, z - 0.02],
      colour: CINE_SEAT_FRAME,
    })
  }
  into.cylinder(
    { radius: 0.052, height: 0.055, sides: 10 },
    { at: [x + width * 0.47, y + 0.68, z + 0.12], colour: 0x09090b },
  )

  if (reclined) {
    into.box([width * 0.62, 0.1, 0.42], {
      at: [x, y + 0.37, z + 0.48],
      rotation: [-0.16, 0, 0],
      colour: fabric,
    })
  }
  if (kind === 'motion' || kind === 'dbox') {
    into.box([width * 0.5, 0.035, 0.04], {
      at: [x, y + 0.38, z - 0.34],
      colour: accent,
      glow: kind === 'motion',
    })
  }
}

/** Individually readable chairs with the back behind the spectator, facing the screen. */
export function dressCineplexSeatRow(options: SeatRowOptions): void {
  const { into, centerX, y, z, format } = options
  const count = format.seatsPerRow
  const pitch = count === 6 ? 0.78 : 1.08
  const width = pitch * 0.8
  const perBank = count / 2
  const bankWidth = (perBank - 1) * pitch + width
  const bankOffset = 0.43 + bankWidth / 2
  for (const side of [-1, 1]) {
    const startX = centerX + side * bankOffset - ((perBank - 1) * pitch) / 2
    for (let index = 0; index < perBank; index++) {
      dressSeat({
        into,
        x: startX + index * pitch,
        y,
        z,
        width,
        kind: format.seatKind,
        accent: format.accent,
      })
    }
  }
}
