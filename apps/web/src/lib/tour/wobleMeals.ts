import type { ApartmentSurface } from './apartmentDetailSurface'

const WOOD = 0x93816a,
  TRIM = 0xbdb095,
  PALE = 0xd9d1c1

/** One continuous broad tabletop is visible in ch. 371 p. 5. A second separate table is not established by that panel. */
export function dressWobleMealTable(s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth,
    h = s.structure.height
  s.box([w, 0.075, d], [0, h - 0.035, 0], WOOD)
  s.box([w - 0.14, 0.018, d - 0.14], [0, h + 0.01, 0], PALE)
  for (const x of [-w / 2 + 0.1, w / 2 - 0.1])
    for (const z of [-d / 2 + 0.1, d / 2 - 0.1])
      s.box([0.1, h - 0.07, 0.1], [x, (h - 0.07) / 2, z], TRIM)
  for (const side of [-1, 1]) {
    s.box([w - 0.12, 0.14, 0.045], [0, h - 0.13, side * (d / 2 - 0.05)], WOOD)
    for (let x = -w / 2 + 0.22; x < w / 2 - 0.1; x += 0.2)
      s.curve(
        [
          [x - 0.06, h - 0.15, side * (d / 2 - 0.02)],
          [x, h - 0.07, side * (d / 2 - 0.02)],
          [x + 0.06, h - 0.15, side * (d / 2 - 0.02)],
        ],
        0.012,
        TRIM,
      )
    for (const x of [-w * 0.32, 0, w * 0.32]) tray(s, { x, z: side * d * 0.28 })
  }
  for (const x of [-w * 0.2, w * 0.2]) {
    s.cylinder({ radius: 0.09, bottom: 0.07, height: 0.13 }, [x, h + 0.08, 0], TRIM)
    for (let i = 0; i < 7; i++)
      s.sphere(
        [0.065, 0.055, 0.06],
        [
          x + Math.sin(i * 2.4) * 0.13,
          h + 0.22 + Math.cos(i * 1.8) * 0.05,
          Math.cos(i * 2.4) * 0.1,
        ],
        PALE,
      )
  }
}

function tray(s: ApartmentSurface, at: { x: number; z: number }): void {
  const y = s.structure.height
  s.box([0.68, 0.022, 0.45], [at.x, y + 0.03, at.z], TRIM)
  s.box([0.63, 0.012, 0.4], [at.x, y + 0.048, at.z], PALE)
  s.flatRing({ radius: 0.105, tube: 0.012 }, [at.x - 0.12, y + 0.065, at.z], 0xb8bcb0)
  s.sphere([0.09, 0.025, 0.09], [at.x - 0.12, y + 0.07, at.z], PALE)
  s.box([0.13, 0.025, 0.12], [at.x + 0.1, y + 0.065, at.z + 0.1], 0x8c947e)
  s.cylinder({ radius: 0.045, height: 0.1 }, [at.x + 0.15, y + 0.105, at.z - 0.1], PALE)
  s.box([0.012, 0.006, 0.2], [at.x + 0.27, y + 0.065, at.z], WOOD)
}
