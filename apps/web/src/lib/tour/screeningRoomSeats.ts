import {
  SCREENING_CARPET,
  SCREENING_GOLD_LEAF,
  SCREENING_SEAT_FRAME,
  SCREENING_SEAT_VELVET,
  SCREENING_WARM_GLOW,
  SCREENING_WOOD_MAHOGANY,
  SCREENING_WOOD_TRIM,
  type ScreeningRoomSurface,
} from './screeningRoomDetailSurface'

export interface SeatsContext {
  surface: ScreeningRoomSurface
  floor: number
}

interface SeatingBlockDef {
  x: number
  z: number
  elevation: number
  blockIndex: number
}

function singleAuditoriumSeat(
  surface: ScreeningRoomSurface,
  at: [number, number, number],
  isRowEnd: boolean,
): void {
  const [x, y, z] = at

  // Cast iron pedestal support
  surface.box([0.08, 0.38, 0.08], [x, y + 0.19, z], SCREENING_SEAT_FRAME)
  surface.box([0.34, 0.04, 0.14], [x, y + 0.02, z], SCREENING_SEAT_FRAME)

  // Folded velvet seat cushion
  surface.box([0.46, 0.1, 0.44], [x - 0.04, y + 0.44, z], SCREENING_SEAT_VELVET)

  // Padded crimson velvet backrest with wooden top cap
  surface.box([0.1, 0.52, 0.46], [x - 0.18, y + 0.62, z], SCREENING_SEAT_VELVET)
  surface.box([0.12, 0.04, 0.48], [x - 0.18, y + 0.89, z], SCREENING_WOOD_TRIM)

  // Armrests with brass fittings
  for (const dz of [-0.25, 0.25]) {
    surface.box([0.38, 0.18, 0.05], [x, y + 0.52, z + dz], SCREENING_SEAT_FRAME)
    surface.box([0.39, 0.03, 0.06], [x, y + 0.61, z + dz], SCREENING_WOOD_TRIM)
  }

  // Row end courtesy marker light
  if (isRowEnd) {
    surface.glowingSphere([0.025, 0.025, 0.025], [x, y + 0.28, z + 0.28], SCREENING_WARM_GLOW)
  }
}

function seatRowSpan(
  surface: ScreeningRoomSurface,
  rowOrigin: [number, number, number],
  count: number,
): void {
  const [rx, ry, rzStart] = rowOrigin
  const seatPitchZ = 1.1

  for (let i = 0; i < count; i++) {
    const seatZ = rzStart + i * seatPitchZ
    const isEnd = i === 0 || i === count - 1
    singleAuditoriumSeat(surface, [rx, ry, seatZ], isEnd)
  }
}

function dressSeatingBlock(
  surface: ScreeningRoomSurface,
  block: SeatingBlockDef,
  baseFloor: number,
): void {
  const { x, z, elevation } = block
  const blockW = 5.0
  const blockL = 30.0
  const platformY = baseFloor + elevation

  // Raked riser platform (carpeted top, mahogany fascia skirt)
  surface.box(
    [blockW, elevation + 0.04, blockL],
    [x, baseFloor + (elevation + 0.04) / 2, z],
    SCREENING_CARPET,
  )
  surface.box(
    [0.1, elevation + 0.04, blockL + 0.04],
    [x + blockW / 2 + 0.04, baseFloor + (elevation + 0.04) / 2, z],
    SCREENING_WOOD_MAHOGANY,
  )
  surface.box([blockW + 0.04, 0.04, blockL + 0.04], [x, platformY + 0.02, z], SCREENING_WOOD_TRIM)

  // 3 rows of seats per block, divided by the central 2m aisle into port and starboard banks
  const rowCount = 3
  const rowStepX = 1.45
  const seatsPerBank = 10

  for (let r = 0; r < rowCount; r++) {
    const rowX = x - blockW / 2 + 1.0 + r * rowStepX
    const subElevation = platformY + r * 0.06

    // Port bank (Z from z - 13.0 to z - 1.2)
    const portStart = z - 1.2 - (seatsPerBank - 1) * 1.1
    seatRowSpan(surface, [rowX, subElevation, portStart], seatsPerBank)

    // Starboard bank (Z from z + 1.2 to z + 13.0)
    const starStart = z + 1.2
    seatRowSpan(surface, [rowX, subElevation, starStart], seatsPerBank)
  }
}

function dressAisleRunners(surface: ScreeningRoomSurface, floor: number): void {
  const runnerCol = SCREENING_SEAT_VELVET
  const borderCol = SCREENING_GOLD_LEAF
  const y = floor + 0.01

  // Central axial aisle runner from stage apron to rear promenade
  const centralLen = 60.0
  const centralX = -43.25
  const centralZ = 29.75
  const centralW = 2.0
  surface.box([centralLen, 0.015, centralW], [centralX, y, centralZ], runnerCol)
  for (const dz of [-centralW / 2, centralW / 2]) {
    surface.box([centralLen, 0.02, 0.05], [centralX, y + 0.005, centralZ + dz], borderCol)
  }

  // Cross-aisle runner connecting North and South exit doors (at X = -43.75)
  const crossLen = 45.0
  const crossZ = 29.75
  const crossW = 2.4
  surface.box([crossW, 0.015, crossLen], [-43.75, y, crossZ], runnerCol)
  for (const dx of [-crossW / 2, crossW / 2]) {
    surface.box([0.05, 0.02, crossLen], [-43.75 + dx, y + 0.005, crossZ], borderCol)
  }

  // Front stage apron cross-aisle runner
  surface.box([2.0, 0.015, 38.0], [-74.2, y, centralZ], runnerCol)
  // Rear distribution cross-aisle runner
  surface.box([2.4, 0.015, 38.0], [-12.2, y, centralZ], runnerCol)
}

/** Complete stalls seating blocks of the Tier 2 Screening Room. */
export function dressScreeningRoomSeats(context: SeatsContext): void {
  const { surface, floor } = context

  // 1. Processional carpet runners along central and cross aisles
  dressAisleRunners(surface, floor)

  // 2. 6 canon seating blocks from blueprint.json with progressive raked sightline risers
  const blocks: readonly SeatingBlockDef[] = [
    { x: -70, z: 29.75, elevation: 0.08, blockIndex: 1 },
    { x: -60, z: 29.75, elevation: 0.24, blockIndex: 2 },
    { x: -49.25, z: 29.75, elevation: 0.42, blockIndex: 3 },
    { x: -38.25, z: 29.75, elevation: 0.6, blockIndex: 4 },
    { x: -27.25, z: 29.75, elevation: 0.78, blockIndex: 5 },
    { x: -16.25, z: 29.75, elevation: 0.96, blockIndex: 6 },
  ]

  for (const block of blocks) {
    dressSeatingBlock(surface, block, floor)
  }
}
