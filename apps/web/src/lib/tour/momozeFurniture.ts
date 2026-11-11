import type * as Three from 'three'
import type { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentFurniture } from './apartmentFurniture'
import { dressMomozeBed } from './momozeBed'
import {
  dressMomozeChair,
  dressMomozeTable,
  dressMomozePalm,
  dressMomozeBasket,
} from './momozeLiving'

function grille(s: ApartmentSurface): void {
  const w = s.width,
    h = s.structure.height
  s.box([w, h, 0.07], [0, h / 2, 0], 0x73776b)
  s.box([w - 0.07, h - 0.07, 0.02], [0, h / 2, 0.045], 0x252b27)
  s.box([0.025, h - 0.05, 0.025], [0, h / 2, 0.065], 0xb1b2a2)
  for (let y = 0.065; y < h - 0.04; y += 0.07)
    s.box([w - 0.08, 0.022, 0.04], [0, y, 0.065], 0xb1b2a2)
}

export function dressMomozeFurniture(THREE: typeof Three, surface: ApartmentSurface): void {
  const { id, kind } = surface.structure
  if (kind === 'bed') dressMomozeBed(THREE, surface)
  else if (kind === 'vent') grille(surface)
  else if (id.endsWith('-living-table-05')) dressMomozeTable(surface)
  else if (kind === 'seat') dressMomozeChair(surface)
  else if (id.endsWith('-living-palm')) dressMomozePalm(surface)
  else if (id.endsWith('-living-basket')) dressMomozeBasket(surface)
  else dressApartmentFurniture(surface)
}
