import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { CineplexFormat } from './cineplexFormats'
import { CINE_SEAT_FABRIC, CINE_SEAT_FRAME } from './cineplexDetailSurface'

interface SeatOptions {
  into: BanquetDetailBuilder
  x: number
  y: number
  z: number
  width: number
}

interface SeatRowOptions {
  into: BanquetDetailBuilder
  centerX: number
  y: number
  z: number
  format: CineplexFormat
}

function dressSeatFrame(options: SeatOptions): void {
  const { into, x, y, z } = options
  into.box([0.08, 0.42, 0.42], { at: [x, y + 0.21, z], colour: CINE_SEAT_FRAME })
}

function dressSeat(options: SeatOptions): void {
  const { into, x, y, z, width } = options
  dressSeatFrame(options)

  into.box([width * 0.76, 0.15, 0.52], {
    at: [x, y + 0.48, z + 0.04],
    colour: CINE_SEAT_FABRIC,
  })
  into.box([width * 0.8, 0.64, 0.16], {
    at: [x, y + 0.8, z - 0.28],
    rotation: [-0.06, 0, 0],
    colour: CINE_SEAT_FABRIC,
  })
  into.box([width * 0.42, 0.11, 0.12], {
    at: [x, y + 1.16, z - 0.3],
    colour: CINE_SEAT_FABRIC,
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
      })
    }
  }
}
