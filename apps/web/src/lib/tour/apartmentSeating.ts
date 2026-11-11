import type { ApartmentSurface } from './apartmentDetailSurface'

/** Plain upholstered seating from the local apartment plan, without inferred ornament. */
export function dressApartmentSeat(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  const cushionCount = Math.max(1, Math.round(w / 0.72)),
    cushionWidth = (w - 0.16) / cushionCount
  surface.box([w, 0.16, d], [0, 0.31, 0], 0x6a5845)
  for (let index = 0; index < cushionCount; index++) {
    const x = (index + 0.5) * cushionWidth - (w - 0.16) / 2
    surface.box([cushionWidth - 0.025, 0.15, d - 0.18], [x, 0.46, 0.03], 0x6b7363)
    surface.box(
      [cushionWidth - 0.035, Math.max(0.34, h - 0.58), 0.13],
      [x, Math.max(0.68, h * 0.62), -d / 2 + 0.08],
      0x747b6b,
    )
  }
  for (const side of [-1, 1]) {
    surface.box([0.14, 0.34, d], [side * (w / 2 - 0.07), 0.5, 0], 0x6b7363)
    surface.box([0.18, 0.08, d - 0.05], [side * (w / 2 - 0.09), 0.69, 0], 0x796e5c)
    for (const z of [-1, 1]) {
      surface.box([0.075, 0.24, 0.075], [side * (w / 2 - 0.1), 0.12, z * (d / 2 - 0.1)], 0x403a30)
    }
  }
}
