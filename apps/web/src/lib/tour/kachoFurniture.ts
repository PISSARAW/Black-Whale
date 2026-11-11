import type { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentFurniture } from './apartmentFurniture'
import { dressKachoKitchen } from './kachoKitchen'
import { dressKachoChair } from './kachoSeating'
import { dressKachoStudyTable, dressKachoDiningTable } from './kachoTables'

function upperFrame(surface: ApartmentSurface): void {
  const w = surface.width,
    h = surface.structure.height,
    d = surface.depth
  surface.box([w, h, d], [0, h / 2, 0], 0x8a7f68)
  surface.box([w - 0.09, h - 0.09, 0.025], [0, h / 2, d / 2 + 0.02], 0xd5ceba)
  for (const side of [-1, 1]) {
    surface.curve(
      [
        [side * w * 0.32, h * 0.3, d / 2 + 0.04],
        [side * w * 0.2, h * 0.65, d / 2 + 0.04],
        [side * w * 0.06, h * 0.4, d / 2 + 0.04],
      ],
      0.016,
      0x777f68,
    )
  }
}

export function dressKachoFurniture(surface: ApartmentSurface): void {
  const { id, kind } = surface.structure
  if (id.includes('-kitchen-')) dressKachoKitchen(surface)
  else if (kind === 'painting') upperFrame(surface)
  else if (kind === 'seat') dressKachoChair(surface)
  else if (id.endsWith('-study-desk')) dressKachoStudyTable(surface)
  else if (id.endsWith('-dining-table-07')) dressKachoDiningTable(surface)
  else dressApartmentFurniture(surface)
}
