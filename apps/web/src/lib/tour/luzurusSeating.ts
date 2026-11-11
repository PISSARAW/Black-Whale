import type { ApartmentSurface } from './apartmentDetailSurface'

/** Deep rolled arms and buttoned upholstery, rather than an angular programme-type bench. */
export function dressLuzurusSeat(surface: ApartmentSurface): void {
  const { width: w, depth: d, structure: s } = surface
  if (s.id.includes('-cushion-')) {
    surface.sphere([w / 2, 0.075, d / 2], [0, 0.08, 0], 0x8b8974)
    surface.box([w * 0.8, 0.018, d * 0.8], [0, 0.13, 0], 0xa69d80)
    return
  }
  const count = Math.max(1, Math.round(w / 0.8)),
    pitch = (w - 0.2) / count
  surface.box([w - 0.08, 0.18, d - 0.08], [0, 0.28, 0], 0x625846)
  surface.box([w - 0.16, 0.5, 0.16], [0, 0.68, -d * 0.38], 0x94917d)
  for (let i = 0; i < count; i++) {
    const x = (i + 0.5) * pitch - (w - 0.2) / 2
    surface.sphere([pitch * 0.5, 0.13, d * 0.43], [x, 0.46, 0.02], 0x94917d)
    surface.sphere([pitch * 0.53, 0.32, 0.14], [x, 0.72, -d * 0.36], 0xa29a82)
    for (const side of [-1, 1])
      surface.sphere(
        [0.018, 0.018, 0.012],
        [x + side * pitch * 0.24, 0.75, -d * 0.36 + 0.14],
        0x625e4b,
      )
  }
  for (const side of [-1, 1]) {
    const x = side * (w / 2 - 0.1)
    surface.sphere([0.15, 0.19, d * 0.47], [x, 0.61, 0], 0x9f9880)
    surface.sphere([0.11, 0.12, 0.055], [x, 0.63, d * 0.45], 0x77715e)
    for (const z of [-d * 0.34, d * 0.34]) surface.box([0.07, 0.22, 0.07], [x, 0.11, z], 0x625846)
  }
}
