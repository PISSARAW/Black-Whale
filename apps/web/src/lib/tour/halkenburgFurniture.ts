import type * as Three from 'three'
import type { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentFurniture } from './apartmentFurniture'
import { dressHalkenburgBed } from './halkenburgBed'

const WOOD = 0x7c705d,
  TRIM = 0xb4a88c,
  METAL = 0x92978e

/** Ch. 386 p. 13: thin tubular frame, flat seat and open space below the back panel. */
function foldingChair(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth
  surface.box([w - 0.08, 0.045, d * 0.7], [0, 0.45, 0], 0xaaa99c)
  surface.box([w - 0.1, 0.2, 0.035], [0, 0.81, -d * 0.38], 0xa7aaa0)
  for (const side of [-1, 1]) {
    const x = side * (w / 2 - 0.04)
    surface.curve(
      [
        [x, 0.025, d * 0.43],
        [x, 0.48, 0],
        [x, 0.92, -d * 0.4],
      ],
      0.018,
      METAL,
    )
    surface.curve(
      [
        [x, 0.025, -d * 0.44],
        [x, 0.48, d * 0.22],
      ],
      0.018,
      METAL,
    )
    surface.sphere([0.026, 0.026, 0.026], [x, 0.46, 0], 0x6a706b)
  }
  surface.box([w - 0.04, 0.025, 0.025], [0, 0.91, -d * 0.4], METAL)
}

function bookcase(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, h, 0.045], [0, h / 2, -d / 2 + 0.025], WOOD)
  for (const side of [-1, 1]) surface.box([0.07, h, d], [side * (w / 2 - 0.035), h / 2, 0], WOOD)
  for (let row = 0; row < 5; row++) {
    const y = 0.12 + (row * (h - 0.3)) / 5
    surface.box([w, 0.055, d], [0, y, 0], TRIM)
    for (let i = 0; i < 11; i++) {
      const x = ((i + 0.5) * (w - 0.16)) / 11 - (w - 0.16) / 2,
        height = 0.22 + ((i + row * 3) % 4) * 0.025
      surface.box(
        [0.065, height, d * 0.65],
        [x, y + height / 2 + 0.03, 0],
        (i + row) % 2 ? 0xa8a28b : 0x626e63,
      )
      surface.box([0.04, 0.012, 0.008], [x, y + height * 0.75, d * 0.33], TRIM)
    }
  }
  surface.box([w + 0.08, 0.1, d + 0.04], [0, h - 0.05, 0], TRIM)
  surface.curve(
    [
      [-w / 2, h, 0],
      [0, h + 0.12, 0],
      [w / 2, h, 0],
    ],
    0.04,
    WOOD,
  )
}

/** The dark centre in ch. 382 p. 11 is partly obscured; no fire, clock or extra doorway is inferred. */
function centralPanel(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, h - 0.5, d], [0, (h - 0.5) / 2, 0], 0xb7b09d)
  surface.box([w - 0.28, h - 0.8, 0.035], [0, (h - 0.8) / 2 + 0.12, d / 2 + 0.025], 0xa39d8c)
  for (const side of [-1, 1])
    surface.box([0.11, h - 0.35, d + 0.04], [side * (w / 2 - 0.055), (h - 0.35) / 2, 0], TRIM)
  surface.box([w + 0.1, 0.11, d + 0.1], [0, h - 0.42, 0], TRIM)
  const arch = []
  for (let i = 0; i <= 16; i++) {
    const a = (Math.PI * i) / 16
    arch.push([Math.cos(a) * (w * 0.46), h - 0.35 + Math.sin(a) * 0.52, d / 2] as const)
  }
  surface.curve(arch, 0.055, TRIM)
  for (const x of [-w * 0.25, 0, w * 0.25])
    surface.box([0.03, 0.3, 0.035], [x, h - 0.18, d / 2], WOOD)
}

export function dressHalkenburgFurniture(THREE: typeof Three, surface: ApartmentSurface): void {
  const { id, kind } = surface.structure
  if (kind === 'bed') dressHalkenburgBed(THREE, surface)
  else if (id.includes('-circle-chair-')) foldingChair(surface)
  else if (id.includes('-bookcase-')) bookcase(surface)
  else if (id.endsWith('-mantel')) centralPanel(surface)
  else dressApartmentFurniture(surface)
}
