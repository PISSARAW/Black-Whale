import type { ApartmentSurface } from './apartmentDetailSurface'
import { dressMarayamPainting } from './marayamLiving'

const WOOD = 0x93816a,
  TRIM = 0xbdb095,
  PALE = 0xd9d1c1

export { dressMarayamPainting as dressWoblePainting }

/** Ch. 360 p. 1: two small sculptures share a square display table. */
export function dressWobleDisplay(s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth,
    h = s.structure.height
  s.box([w, 0.07, d], [0, h - 0.035, 0], WOOD)
  s.box([w - 0.1, 0.02, d - 0.1], [0, h + 0.01, 0], TRIM)
  for (const x of [-w / 2 + 0.1, w / 2 - 0.1])
    for (const z of [-d / 2 + 0.1, d / 2 - 0.1])
      s.box([0.065, h - 0.07, 0.065], [x, (h - 0.07) / 2, z], WOOD)
  for (const x of [-w * 0.23, w * 0.23]) sculpture(s, { x, y: h + 0.04 })
}

function sculpture(s: ApartmentSurface, at: { x: number; y: number }): void {
  s.box([0.24, 0.035, 0.24], [at.x, at.y, 0], TRIM)
  s.cylinder({ radius: 0.12, bottom: 0.18, height: 0.23 }, [at.x, at.y + 0.14, 0], PALE)
  s.sphere([0.12, 0.15, 0.1], [at.x, at.y + 0.33, 0], PALE)
  s.sphere([0.07, 0.08, 0.065], [at.x, at.y + 0.51, 0], TRIM)
  for (const side of [-1, 1])
    s.curve(
      [
        [at.x + side * 0.08, at.y + 0.4, 0.03],
        [at.x + side * 0.16, at.y + 0.25, 0.06],
        [at.x + side * 0.07, at.y + 0.2, 0.09],
      ],
      0.025,
      PALE,
    )
}

/** Small draped bust on its own low pedestal, beside the display group. */
export function dressWoblePedestal(s: ApartmentSurface): void {
  const h = s.structure.height
  s.box([s.width, 0.06, s.depth], [0, 0.04, 0], WOOD)
  s.cylinder({ radius: 0.17, bottom: 0.22, height: h - 0.13 }, [0, h / 2, 0], TRIM)
  s.box([s.width, 0.05, s.depth], [0, h - 0.025, 0], WOOD)
  sculpture(s, { x: 0, y: h + 0.03 })
}

/** Ch. 360 p. 1: narrow vertical cane-like strokes and curved wooden arms. */
export function dressWobleCaneChair(s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth,
    h = s.structure.height
  s.box([w, 0.12, d], [0, 0.4, 0], WOOD)
  s.sphere([w * 0.43, 0.09, d * 0.42], [0, 0.48, 0], PALE)
  for (const side of [-1, 1]) {
    const x = side * w * 0.43
    s.curve(
      [
        [x, 0.5, -d * 0.38],
        [x, h - 0.12, -d * 0.38],
        [0, h, -d * 0.38],
      ],
      0.03,
      TRIM,
    )
    s.curve(
      [
        [x, 0.76, -d * 0.38],
        [x, 0.77, d * 0.18],
        [x, 0.56, d * 0.4],
      ],
      0.035,
      WOOD,
    )
    for (const z of [-d * 0.35, d * 0.35]) s.box([0.055, 0.35, 0.055], [x, 0.18, z], WOOD)
  }
  for (let x = -w * 0.35; x < w * 0.4; x += 0.06)
    s.box([0.012, h - 0.57, 0.018], [x, (h + 0.45) / 2, -d * 0.38], TRIM)
}

export function dressWobleCabinet(s: ApartmentSurface): void {
  const w = s.width,
    h = s.structure.height,
    d = s.depth
  s.box([w, h, d], [0, h / 2, 0], WOOD)
  for (const side of [-1, 1]) {
    s.box([w * 0.44, h - 0.3, 0.035], [side * w * 0.245, h / 2, d / 2 + 0.02], 0xa1aca1)
    for (const y of [h * 0.3, h * 0.65])
      s.box([w * 0.44, 0.035, 0.025], [side * w * 0.245, y, d / 2 + 0.045], TRIM)
    s.sphere([0.025, 0.025, 0.02], [side * 0.07, h * 0.48, d / 2 + 0.06], TRIM)
  }
}

/** Static wall telephone and hanging cord, ch. 360. */
export function dressWobleTelephone(s: ApartmentSurface): void {
  const h = s.structure.height
  s.box([0.25, h, 0.07], [0, h / 2, 0], PALE)
  s.box([0.085, h - 0.06, 0.1], [-0.12, h / 2, 0.055], WOOD)
  for (const y of [0.06, h - 0.06]) s.sphere([0.065, 0.06, 0.06], [-0.12, y, 0.06], WOOD)
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++)
      s.box([0.025, 0.025, 0.015], [0.015 + col * 0.045, 0.1 + row * 0.055, 0.05], TRIM)
  s.curve(
    [
      [-0.12, 0.05, 0.07],
      [-0.15, -0.2, 0.06],
      [0, -0.31, 0.04],
      [0.1, -0.15, 0.02],
    ],
    0.009,
    WOOD,
  )
}
