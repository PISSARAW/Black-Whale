import type { ApartmentSurface } from './apartmentDetailSurface'

const WOOD = 0x9a8b72,
  PALE = 0xd2cebd,
  TRIM = 0x7f826f

/** Ch. 367 p. 1: straight counter and bottles; no central island or unseen hob asserted. */
export function dressWobleCounter(s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth,
    h = s.structure.height
  s.box([w, h - 0.05, d], [0, (h - 0.05) / 2, 0], WOOD)
  s.box([w, 0.05, d], [0, h - 0.025, 0], PALE)
  const count = 6,
    pitch = w / count
  for (let i = 0; i < count; i++) {
    const x = (i + 0.5) * pitch - w / 2
    s.box([pitch - 0.04, h - 0.2, 0.025], [x, h / 2, d / 2 + 0.015], PALE)
    s.box([0.15, 0.02, 0.025], [x, h - 0.14, d / 2 + 0.04], TRIM)
  }
  for (let i = 0; i < 4; i++) {
    const x = -w * 0.25 + i * 0.2
    s.box(
      [0.11, 0.22 + (i % 2) * 0.07, 0.1],
      [x, h + 0.12 + (i % 2) * 0.035, 0],
      i % 2 ? TRIM : PALE,
    )
    s.box([0.05, 0.055, 0.05], [x, h + 0.27 + (i % 2) * 0.07, 0], WOOD)
  }
}

/** Upper glazed cabinets, clearly above the worktop in ch. 367. */
export function dressWobleUpperCabinets(s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth,
    h = s.structure.height,
    pitch = w / 6
  s.box([w, h, d], [0, h / 2, 0], WOOD)
  for (let i = 0; i < 6; i++) {
    const x = (i + 0.5) * pitch - w / 2
    s.box([pitch - 0.08, h - 0.12, 0.025], [x, h / 2, d / 2 + 0.02], 0xaab4a7)
    s.box([pitch - 0.08, 0.025, 0.03], [x, h * 0.5, d / 2 + 0.045], PALE)
    s.box([0.025, 0.12, 0.025], [x + pitch * 0.32, h * 0.32, d / 2 + 0.05], TRIM)
  }
}
