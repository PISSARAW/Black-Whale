import type { Structure } from './types'
import {
  SCREENING_SEAT_VELVET,
  SCREENING_SEAT_FRAME,
  SCREENING_WOOD_TRIM,
  type ScreeningRoomSurface,
} from './screeningRoomDetailSurface'

interface SeatsContext {
  surface: ScreeningRoomSurface
  floor: number
  structures: Structure[]
}

/** Rows face the stage at -X. All seating stays inside the walked seating banks. */
export function dressScreeningRoomSeats({ surface, floor, structures }: SeatsContext): void {
  for (const bank of structures.filter((s) => s.kind === 'seat')) {
    const rows = Math.max(1, Math.floor(bank.size[0] / 1.4)),
      count = Math.max(1, Math.floor(bank.size[1] / 1.05))
    for (let row = 0; row < rows; row++) {
      const x = bank.at[0] - bank.size[0] / 2 + ((row + 0.5) * bank.size[0]) / rows
      for (let seat = 0; seat < count; seat++) {
        const z = bank.at[1] - bank.size[1] / 2 + ((seat + 0.5) * bank.size[1]) / count,
          y = floor + bank.base
        surface.box([0.45, 0.32, 0.42], [x, y + 0.16, z], SCREENING_SEAT_FRAME)
        surface.box([0.65, 0.12, 0.64], [x - 0.02, y + 0.42, z], SCREENING_SEAT_VELVET)
        surface.box([0.12, 0.53, 0.65], [x + 0.26, y + 0.7, z], SCREENING_SEAT_VELVET)
        surface.box([0.14, 0.045, 0.68], [x + 0.26, y + 0.98, z], SCREENING_WOOD_TRIM)
        for (const side of [-1, 1])
          surface.box([0.61, 0.07, 0.07], [x, y + 0.6, z + side * 0.36], SCREENING_WOOD_TRIM)
      }
    }
  }
}
