import type { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentFurniture } from './apartmentFurniture'

/** Plain fittings: no carved state chair, mantel, gilding, nursery or royal insignia. */
export function dressQueenApartmentFurniture(surface: ApartmentSurface): void {
  if (surface.structure.id.includes('-partition-')) {
    surface.box(
      [surface.width, surface.structure.height, surface.depth],
      [0, surface.structure.height / 2, 0],
      0xc7c2b5,
    )
    return
  }
  dressApartmentFurniture(surface)
  if (surface.structure.id.endsWith('-phone-table')) telephone(surface)
  if (surface.structure.id.endsWith('-tea-table')) teaService(surface)
}

function telephone(surface: ApartmentSurface): void {
  const h = surface.structure.height
  surface.box([0.28, 0.065, 0.2], [0, h + 0.04, 0], 0x333331)
  surface.box([0.3, 0.045, 0.055], [0, h + 0.12, -0.04], 0x252624)
  for (const x of [-0.11, 0.11]) surface.sphere([0.055, 0.045, 0.06], [x, h + 0.1, -0.04], 0x252624)
  for (const x of [-0.05, 0, 0.05])
    for (const z of [-0.025, 0.025])
      surface.box([0.025, 0.008, 0.025], [x, h + 0.077, z + 0.025], 0xb5b4a9)
  surface.curve(
    [
      [0.12, h + 0.1, -0.04],
      [0.22, h - 0.08, 0],
      [0.14, h + 0.05, 0.06],
    ],
    0.009,
    0x252624,
  )
}

function teaService(surface: ApartmentSurface): void {
  const h = surface.structure.height
  surface.box([0.48, 0.018, 0.29], [0, h + 0.022, 0], 0x9c927a)
  surface.sphere([0.09, 0.1, 0.09], [-0.08, h + 0.12, 0], 0xd1cec3)
  surface.cylinder({ radius: 0.035, height: 0.018 }, [-0.08, h + 0.22, 0], 0xd1cec3)
  surface.curve(
    [
      [-0.02, h + 0.14, 0],
      [0.04, h + 0.14, 0],
      [0.06, h + 0.19, 0],
    ],
    0.023,
    0xd1cec3,
  )
  surface.cylinder({ radius: 0.066, height: 0.012 }, [0.13, h + 0.04, 0], 0xd1cec3)
  surface.cylinder({ radius: 0.04, height: 0.07 }, [0.13, h + 0.08, 0], 0xd1cec3)
}
