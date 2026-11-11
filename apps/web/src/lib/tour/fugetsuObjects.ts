import type { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentFurniture } from './apartmentFurniture'

const PAPER = 0xe4dfd0,
  DARK = 0x4a564e,
  TRIM = 0xaa9b7f
const SEGMENTS: Readonly<Record<string, readonly number[]>> = {
  '0': [0, 1, 2, 3, 4, 5],
  '1': [1, 2],
  '2': [0, 1, 6, 4, 3],
  '7': [0, 1, 2],
}
const STROKES = [
  [0, 0.055, 0.05, 0.008],
  [0.027, 0.028, 0.008, 0.045],
  [0.027, -0.028, 0.008, 0.045],
  [0, -0.055, 0.05, 0.008],
  [-0.027, -0.028, 0.008, 0.045],
  [-0.027, 0.028, 0.008, 0.045],
  [0, 0, 0.05, 0.008],
] as const

function digit(
  surface: ApartmentSurface,
  options: { character: string; x: number; y: number },
): void {
  for (const index of SEGMENTS[options.character]) {
    const [dx, dy, w, h] = STROKES[index]
    surface.box([w, h, 0.006], [options.x + dx, options.y + dy, 0.092], DARK)
  }
}

/** The inspected clock reproduces the panel's 01:27 display; it is not a live ship clock. */
export function dressFugetsuClock(surface: ApartmentSurface): void {
  dressApartmentFurniture(surface)
  const h = surface.structure.height
  surface.box([0.5, 0.24, 0.16], [0, h + 0.13, 0], 0xb4b5a8)
  surface.box([0.45, 0.18, 0.012], [0, h + 0.14, 0.087], 0xd3d6c7)
  for (const [character, x] of [
    ['0', -0.165],
    ['1', -0.085],
    ['2', 0.055],
    ['7', 0.135],
  ] as const)
    digit(surface, { character, x, y: h + 0.14 })
  for (const y of [h + 0.115, h + 0.165])
    surface.box([0.009, 0.009, 0.006], [-0.016, y, 0.096], DARK)
  surface.box([0.14, 0.015, 0.025], [0, h + 0.255, 0], TRIM)
}

function photograph(surface: ApartmentSurface, at: { x: number; z: number }): void {
  surface.box([0.16, 0.006, 0.2], [at.x, 0.013, at.z], PAPER)
  surface.box([0.13, 0.005, 0.15], [at.x, 0.019, at.z], 0x9bada0)
  for (const side of [-1, 1]) {
    surface.sphere([0.021, 0.003, 0.022], [at.x + side * 0.033, 0.023, at.z - 0.025], DARK)
    surface.box([0.035, 0.005, 0.05], [at.x + side * 0.033, 0.024, at.z + 0.015], DARK)
  }
}

/** Ch. 366 p. 3: albums, loose photographs and a tissue box lie on the covers. */
export function dressFugetsuKeepsakes(surface: ApartmentSurface): void {
  surface.box([0.33, 0.025, 0.27], [-0.16, 0.026, -0.12], 0x8d8a79)
  surface.box([0.29, 0.015, 0.24], [-0.16, 0.046, -0.12], PAPER)
  for (const x of [-0.23, -0.1]) surface.box([0.095, 0.006, 0.14], [x, 0.057, -0.12], 0x758375)
  surface.box([0.27, 0.026, 0.23], [0.08, 0.025, 0.37], 0x8d8a79)
  surface.box([0.24, 0.012, 0.2], [0.08, 0.045, 0.37], PAPER)
  surface.box([0.23, 0.12, 0.14], [0.23, 0.07, -0.11], 0xb9b1a0)
  surface.sphere([0.055, 0.055, 0.018], [0.23, 0.16, -0.11], PAPER)
  photograph(surface, { x: -0.18, z: 0.17 })
  photograph(surface, { x: 0.06, z: 0.18 })
}

export function dressFugetsuWardrobe(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, h, d], [0, h / 2, 0], 0x8b7c65)
  for (const side of [-1, 1]) {
    const x = side * w * 0.245
    surface.box([w * 0.44, h * 0.61, 0.035], [x, h * 0.66, d / 2 + 0.02], 0xaab2a8)
    surface.box([w * 0.44, h * 0.26, 0.035], [x, h * 0.19, d / 2 + 0.02], 0xbaad90)
    surface.sphere([0.028, 0.028, 0.025], [side * 0.08, h * 0.42, d / 2 + 0.06], TRIM)
    surface.box([0.022, h * 0.61, 0.02], [x, h * 0.66, d / 2 + 0.05], TRIM)
    for (const y of [0.57, 0.76])
      surface.box([w * 0.44, 0.025, 0.02], [x, h * y, d / 2 + 0.05], TRIM)
    surface.curve(
      [
        [x - w * 0.17, h * 0.66, d / 2 + 0.05],
        [x, h * 0.9, d / 2 + 0.05],
        [x + w * 0.17, h * 0.66, d / 2 + 0.05],
        [x, h * 0.43, d / 2 + 0.05],
        [x - w * 0.17, h * 0.66, d / 2 + 0.05],
      ],
      0.015,
      TRIM,
    )
    surface.ring(0.13, [x, h * 0.19, d / 2 + 0.06], TRIM)
  }
  surface.curve(
    [
      [-w / 2, h, 0],
      [0, h + 0.12, 0],
      [w / 2, h, 0],
    ],
    0.035,
    TRIM,
  )
}
