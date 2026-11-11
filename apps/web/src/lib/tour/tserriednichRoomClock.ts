import type { TserriednichRoomSurface } from './tserriednichRoomDetailSurface'

/** Ch. 385 p. 7: ornate triangular mantel clock on a separate low cabinet. */
export function dressTserriednichClock(surface: TserriednichRoomSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height,
    front = d / 2 - 0.025
  surface.box([w, 0.06, d], [0, 0.03, 0], 0x736551)
  surface.box([w * 0.94, 0.035, d * 0.9], [0, 0.085, 0], 0xab9871)
  for (const side of [-1, 1]) {
    surface.curve(
      [
        [side * w * 0.45, 0.12, front],
        [side * w * 0.35, 0.22, front],
        [side * w * 0.15, h * 0.73, front],
      ],
      0.035,
      0xab9871,
    )
  }
  surface.sphere([w * 0.23, h * 0.29, 0.07], [0, h * 0.58, front - 0.04], 0x736551)
  surface.sphere([w * 0.18, h * 0.24, 0.012], [0, h * 0.58, front + 0.035], 0xe1d9c4)
  for (let tick = 0; tick < 12; tick++) {
    const a = (tick * Math.PI) / 6
    surface.sphere(
      [0.008, 0.008, 0.006],
      [Math.sin(a) * w * 0.15, h * 0.58 + Math.cos(a) * h * 0.2, front + 0.05],
      0x413c32,
    )
  }
  // A neutral reading; no claim about an exact second of Theta's attempt.
  surface.box([0.01, h * 0.17, 0.01], [0, h * 0.65, front + 0.054], 0x413c32)
  surface.box([w * 0.15, 0.01, 0.01], [w * 0.065, h * 0.58, front + 0.054], 0x413c32)
}
