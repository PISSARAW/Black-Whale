import { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentSeat } from './apartmentSeating'

const WOOD = 0x6a5845,
  EDGE = 0x403a30,
  LINEN = 0xcac7b9,
  FABRIC = 0x6b7363

function bed(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, 0.14, d], [0, h - 0.2, 0], WOOD)
  surface.box([w - 0.05, 0.18, d - 0.06], [0, h - 0.04, 0], LINEN)
  surface.box([w, h + 0.22, 0.07], [0, (h + 0.22) / 2, -d / 2 + 0.035], WOOD)
  surface.box([w - 0.04, 0.025, d * 0.62], [0, h + 0.065, d * 0.16], FABRIC)
  for (const side of [-1, 1]) {
    surface.box([0.025, 0.13, d * 0.62], [side * (w / 2 - 0.02), h, d * 0.16], FABRIC)
    for (const z of [-1, 1]) {
      surface.box(
        [0.06, h - 0.25, 0.06],
        [side * (w / 2 - 0.07), (h - 0.25) / 2, z * (d / 2 - 0.09)],
        EDGE,
      )
    }
  }
  const pillows = w > 1.4 ? [-w * 0.23, w * 0.23] : [0]
  for (const x of pillows)
    surface.sphere([Math.min(w * 0.38, 0.34), 0.075, 0.19], [x, h + 0.09, -d * 0.31], LINEN)
}

function cabinet(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, h - 0.08, d], [0, (h + 0.08) / 2, 0], WOOD)
  surface.box([w - 0.05, 0.08, d - 0.04], [0, 0.04, 0], EDGE)
  const doors = h > 1 ? Math.max(2, Math.round(w / 0.6)) : 1
  const pitch = w / doors
  for (let i = 0; i < doors; i++) {
    const x = (i + 0.5) * pitch - w / 2
    surface.box([pitch - 0.025, h - 0.18, 0.025], [x, h / 2 + 0.04, d / 2 + 0.005], 0x8b7960)
    surface.box([0.025, 0.1, 0.025], [x + pitch * 0.24, h * 0.53, d / 2 + 0.028], 0x9c927a)
  }
}

function table(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, 0.07, d], [0, h - 0.035, 0], WOOD)
  surface.box([w - 0.06, 0.015, d - 0.06], [0, h + 0.007, 0], 0xa28d6e)
  for (const x of [-1, 1]) {
    for (const z of [-1, 1])
      surface.box(
        [0.075, h - 0.07, 0.075],
        [x * (w / 2 - 0.1), (h - 0.07) / 2, z * (d / 2 - 0.1)],
        WOOD,
      )
  }
}

export function dressApartmentFurniture(surface: ApartmentSurface): void {
  if (surface.structure.kind === 'seat') dressApartmentSeat(surface)
  if (surface.structure.kind === 'bed') bed(surface)
  if (surface.structure.kind === 'cabinet') cabinet(surface)
  if (surface.structure.kind === 'table') table(surface)
}
