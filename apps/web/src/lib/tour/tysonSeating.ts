import type { ApartmentSurface } from './apartmentDetailSurface'

const WOOD = 0x96836c,
  CLOTH = 0xc3b9a7,
  TRIM = 0xb29e78

function cushionFlower(surface: ApartmentSurface, at: { x: number; y: number; z: number }): void {
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5
    surface.sphere(
      [0.038, 0.045, 0.014],
      [at.x + Math.cos(a) * 0.045, at.y + Math.sin(a) * 0.045, at.z],
      0x8d8b73,
    )
  }
  surface.sphere([0.022, 0.022, 0.016], [at.x, at.y, at.z + 0.006], 0xb59b85)
}

/** Ch. 375 p. 1: upholstered salon seating with rounded arms and patterned cushions. */
export function dressTysonSeat(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth
  surface.box([w - 0.08, 0.13, d - 0.05], [0, 0.3, 0], WOOD)
  const count = Math.max(1, Math.round(w / 0.8)),
    pitch = (w - 0.25) / count
  for (let i = 0; i < count; i++) {
    const x = (i + 0.5) * pitch - (w - 0.25) / 2
    surface.sphere([pitch * 0.5, 0.11, d * 0.43], [x, 0.43, 0.02], CLOTH)
    surface.sphere([pitch * 0.5, 0.28, 0.1], [x, 0.71, -d * 0.38], CLOTH)
    cushionFlower(surface, { x, y: 0.75, z: -d * 0.38 + 0.095 })
  }
  for (const side of [-1, 1]) {
    const x = side * (w / 2 - 0.1)
    surface.sphere([0.12, 0.14, d * 0.47], [x, 0.58, 0], CLOTH)
    surface.curve(
      [
        [x, 0.55, d * 0.4],
        [x, 0.78, d * 0.25],
        [x, 0.8, -d * 0.15],
        [x, 0.7, -d * 0.4],
      ],
      0.035,
      TRIM,
    )
    for (const z of [-d * 0.34, d * 0.34])
      surface.curve(
        [
          [x, 0.3, z],
          [x - side * 0.035, 0.17, z],
          [x, 0.035, z + 0.03],
        ],
        0.033,
        WOOD,
      )
  }
}
