import type { ApartmentSurface } from './apartmentDetailSurface'

/** Plain upholstered seating from the local apartment plan, without inferred ornament. */
export function dressApartmentSeat(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, 0.15, d], [0, 0.32, 0], 0x6a5845)
  surface.box([w - 0.12, 0.14, d - 0.16], [0, 0.46, 0], 0x6b7363)
  surface.box([w, h - 0.3, 0.14], [0, (h + 0.3) / 2, -d / 2 + 0.07], 0x6b7363)
  for (const x of [-1, 1]) {
    surface.box([0.12, 0.3, d], [x * (w / 2 - 0.06), 0.48, 0], 0x6b7363)
    for (const z of [-1, 1])
      surface.box([0.08, 0.24, 0.08], [x * (w / 2 - 0.1), 0.12, z * (d / 2 - 0.1)], 0x403a30)
  }
}
