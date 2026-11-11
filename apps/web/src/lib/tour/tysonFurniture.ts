import type { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentFurniture } from './apartmentFurniture'
import { dressTysonSeat } from './tysonSeating'
import { dressTysonTableObjects } from './tysonTableObjects'

function salonTable(surface: ApartmentSurface): void {
  dressApartmentFurniture(surface)
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  for (const side of [-1, 1]) {
    surface.box([w - 0.12, 0.012, 0.025], [0, h + 0.02, side * (d / 2 - 0.08)], 0xd0c3a4)
    surface.box([0.025, 0.012, d - 0.12], [side * (w / 2 - 0.08), h + 0.02, 0], 0xd0c3a4)
  }
  dressTysonTableObjects(surface)
}

function plant(surface: ApartmentSurface): void {
  surface.cylinder({ radius: 0.16, height: 0.32, bottom: 0.12 }, [0, 0.16, 0], 0x8b7a61)
  surface.cylinder({ radius: 0.018, height: 0.45 }, [0, 0.53, 0], 0x5c6249)
  for (let i = 0; i < 11; i++) {
    const a = (i * Math.PI * 2) / 11,
      x = Math.cos(a) * 0.17,
      z = Math.sin(a) * 0.17
    surface.sphere([0.11, 0.2, 0.11], [x, 0.94 + (i % 3) * 0.03, z], 0x697255)
  }
}

export function dressTysonFurniture(surface: ApartmentSurface): void {
  if (surface.structure.id.endsWith('-potted-plant')) plant(surface)
  else if (surface.structure.kind === 'seat') dressTysonSeat(surface)
  else if (surface.structure.kind === 'table') salonTable(surface)
  else dressApartmentFurniture(surface)
}
