import type { ApartmentSurface } from './apartmentDetailSurface'

const WOOD = 0x91816a,
  TRIM = 0xb9ad91,
  PALE = 0xd8d1c1

/** Ch. 366 p. 1: full-height table with a carved apron, not a low play table. */
export function dressMarayamMealTable(s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth,
    h = s.structure.height
  s.box([w, 0.07, d], [0, h - 0.035, 0], TRIM)
  s.box([w - 0.14, 0.018, d - 0.14], [0, h + 0.005, 0], PALE)
  for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) {
    for (const z of [-d / 2 + 0.1, d / 2 - 0.1]) {
      s.box([0.1, h - 0.07, 0.1], [x, (h - 0.07) / 2, z], WOOD)
      s.sphere([0.07, 0.05, 0.07], [x, 0.1, z], TRIM)
    }
  }
  for (const side of [-1, 1]) {
    const z = side * (d / 2 - 0.055)
    s.box([w - 0.12, 0.14, 0.06], [0, h - 0.12, z], WOOD)
    for (let x = -w / 2 + 0.22; x < w / 2 - 0.12; x += 0.2)
      s.curve(
        [
          [x - 0.06, h - 0.14, z + side * 0.035],
          [x, h - 0.06, z + side * 0.035],
          [x + 0.06, h - 0.14, z + side * 0.035],
        ],
        0.012,
        TRIM,
      )
  }
  for (const x of [-w * 0.23, w * 0.12])
    s.flatRing({ radius: 0.13, tube: 0.012 }, [x, h + 0.025, 0], PALE)
  s.cylinder({ radius: 0.055, height: 0.13 }, [-w * 0.34, h + 0.08, -0.22], PALE)
  // The small rectangular tabletop container is simplified and empty.
  s.box([0.45, 0.05, 0.3], [w * 0.34, h + 0.035, 0], WOOD)
  for (let x = -0.18; x < 0.22; x += 0.06)
    s.box([0.014, 0.23, 0.014], [w * 0.34 + x, h + 0.16, 0.13], TRIM)
  s.box([0.45, 0.025, 0.3], [w * 0.34, h + 0.28, 0], TRIM)
}

/** Ch. 366 p. 1: tall arched backs with a pale field and closely spaced vertical strokes. */
export function dressMarayamDiningChair(s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth,
    h = s.structure.height
  s.box([w, 0.1, d], [0, 0.43, 0], WOOD)
  s.sphere([w * 0.43, 0.08, d * 0.43], [0, 0.5, 0], PALE)
  s.box([w * 0.86, h - 0.7, 0.08], [0, (h + 0.3) / 2, -d * 0.4], PALE)
  s.curve(
    [
      [-w * 0.47, 0.45, -d * 0.4],
      [-w * 0.47, h - 0.22, -d * 0.4],
      [0, h, -d * 0.4],
      [w * 0.47, h - 0.22, -d * 0.4],
      [w * 0.47, 0.45, -d * 0.4],
    ],
    0.04,
    TRIM,
  )
  for (let x = -w * 0.36; x < w * 0.4; x += 0.055)
    s.box([0.012, h - 0.88, 0.018], [x, (h + 0.27) / 2, -d * 0.4 + 0.05], 0x938e7b)
  for (const x of [-w * 0.4, w * 0.4]) {
    for (const z of [-d * 0.38, d * 0.38]) s.box([0.055, 0.4, 0.055], [x, 0.2, z], WOOD)
  }
}

export function dressMarayamSideboard(s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth,
    h = s.structure.height
  s.box([w, h, d], [0, h / 2, 0], WOOD)
  s.box([w + 0.05, 0.05, d + 0.05], [0, h, 0], TRIM)
  for (const side of [-1, 1]) {
    s.box([w * 0.46, h - 0.12, 0.025], [side * w * 0.25, h / 2, d / 2 + 0.015], PALE)
    s.box([0.025, 0.11, 0.025], [side * 0.06, h * 0.6, d / 2 + 0.04], WOOD)
  }
  s.cylinder({ radius: 0.09, bottom: 0.12, height: 0.35 }, [-w * 0.3, h + 0.18, 0], PALE)
  for (let y = h + 0.05; y < h + 0.35; y += 0.04)
    s.flatRing({ radius: 0.095, tube: 0.008 }, [-w * 0.3, y, 0], WOOD)
}

/** Monochrome view through glazing is deliberately abstract; no invented outside vista. */
export function dressMarayamGlazing(s: ApartmentSurface): void {
  const w = s.width,
    h = s.structure.height,
    d = s.depth
  s.box([w, h, d], [0, h / 2, 0], TRIM)
  s.box([w - 0.12, h - 0.12, 0.025], [0, h / 2, d / 2 + 0.02], 0xaeb8af)
  s.box([0.055, h, 0.035], [0, h / 2, d / 2 + 0.04], WOOD)
  s.box([w, 0.045, 0.035], [0, h * 0.54, d / 2 + 0.04], WOOD)
  for (const x of [-w * 0.25, w * 0.25])
    s.curve(
      [
        [x - 0.15, h * 0.2, d / 2 + 0.055],
        [x + 0.15, h * 0.4, d / 2 + 0.055],
      ],
      0.012,
      PALE,
    )
}
