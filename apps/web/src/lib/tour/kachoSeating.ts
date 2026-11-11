import type { ApartmentSurface } from './apartmentDetailSurface'

const WOOD = 0x8f826d,
  TRIM = 0xb5aa8f,
  LINEN = 0xd1cabb

/** Ch. 376 pp. 10–11: tall rounded upholstered study chair, with visible wooden arm supports. */
export function dressKachoChair(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w - 0.05, 0.11, d - 0.04], [0, 0.4, 0], WOOD)
  surface.sphere([w * 0.42, 0.09, d * 0.41], [0, 0.48, 0.025], LINEN)
  surface.box([w * 0.84, h - 0.52, 0.08], [0, (h + 0.45) / 2, -d * 0.38], WOOD)
  surface.sphere([w * 0.38, (h - 0.55) / 2, 0.07], [0, (h + 0.43) / 2, -d * 0.38 + 0.045], LINEN)
  surface.curve(
    [
      [-w * 0.43, h - 0.16, -d * 0.38],
      [0, h, -d * 0.38],
      [w * 0.43, h - 0.16, -d * 0.38],
    ],
    0.035,
    TRIM,
  )
  for (const side of [-1, 1]) {
    const x = side * (w / 2 - 0.07)
    surface.box([0.055, 0.25, 0.055], [x, 0.58, d * 0.26], WOOD)
    surface.curve(
      [
        [x, 0.71, -d * 0.32],
        [x, 0.72, d * 0.1],
        [x, 0.66, d * 0.4],
      ],
      0.035,
      TRIM,
    )
    for (const z of [-d * 0.33, d * 0.33])
      surface.curve(
        [
          [x, 0.37, z],
          [x + side * 0.025, 0.2, z],
          [x, 0.035, z + 0.025],
        ],
        0.028,
        WOOD,
      )
  }
}
