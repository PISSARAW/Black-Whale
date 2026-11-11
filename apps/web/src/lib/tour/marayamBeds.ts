import type { ApartmentSurface } from './apartmentDetailSurface'

const WOOD = 0x91816a,
  PALE = 0xd8d1c2,
  TRIM = 0xb8ac91

/** Ch. 372 p. 16, ch. 375 p. 10: plain bunks with tall square posts, upper rails and a foot ladder. */
export function dressMarayamBunk(s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth
  for (const x of [-w / 2 + 0.04, w / 2 - 0.04]) {
    for (const z of [-d / 2 + 0.04, d / 2 - 0.04]) s.box([0.07, 2.35, 0.07], [x, 1.175, z], WOOD)
    for (const y of [1.94, 2.19]) s.box([0.045, 0.06, d], [x, y, 0], TRIM)
  }
  for (const y of [0.4, 1.6]) {
    s.box([w, 0.1, d], [0, y, 0], WOOD)
    s.box([w - 0.1, 0.13, d - 0.1], [0, y + 0.1, 0], PALE)
    s.box([w - 0.12, 0.035, d * 0.68], [0, y + 0.185, d * 0.1], 0xc4bcaa)
    s.sphere([w * 0.36, 0.07, 0.23], [0, y + 0.21, -d * 0.32], PALE)
  }
  for (const x of [-w * 0.24, w * 0.24]) s.box([0.045, 1.86, 0.05], [x, 0.94, d / 2 + 0.035], TRIM)
  for (let y = 0.24; y < 1.9; y += 0.26)
    s.box([w * 0.52, 0.035, 0.055], [0, y, d / 2 + 0.035], WOOD)
}

/** Ch. 375 p. 11: the child's bed has open vertical bars and square posts, rather than a toy chest. */
export function dressMarayamCrib(s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth,
    h = s.structure.height
  s.box([w, 0.12, d], [0, 0.34, 0], WOOD)
  s.box([w - 0.1, 0.11, d - 0.1], [0, 0.45, 0], PALE)
  s.sphere([w * 0.3, 0.06, 0.22], [0, 0.54, -d * 0.3], PALE)
  for (const x of [-w / 2 + 0.03, w / 2 - 0.03]) {
    for (const z of [-d / 2 + 0.03, d / 2 - 0.03]) s.box([0.065, h, 0.065], [x, h / 2, z], TRIM)
    s.box([0.055, 0.07, d], [x, h - 0.07, 0], WOOD)
    for (let z = -d / 2 + 0.17; z < d / 2 - 0.1; z += 0.17)
      s.box([0.028, h - 0.47, 0.028], [x, (h + 0.29) / 2, z], TRIM)
  }
  for (const z of [-d / 2 + 0.03, d / 2 - 0.03]) {
    s.box([w, 0.07, 0.055], [0, h - 0.07, z], WOOD)
    for (let x = -w / 2 + 0.17; x < w / 2 - 0.1; x += 0.17)
      s.box([0.028, h - 0.47, 0.028], [x, (h + 0.29) / 2, z], TRIM)
  }
}

/** Only a corner of the neighbouring adult bed is visible in ch. 375 p. 11; the rest remains reconstructed. */
export function dressMarayamAdultBed(s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth,
    h = s.structure.height
  s.box([w, 0.23, d], [0, 0.3, 0], WOOD)
  s.box([w - 0.08, 0.24, d - 0.08], [0, h - 0.08, 0], PALE)
  s.box([w + 0.06, 0.035, d * 0.8], [0, h + 0.06, d * 0.1], PALE)
  for (const side of [-1, 1]) {
    s.box([0.035, 0.3, d * 0.8], [(side * w) / 2, h - 0.1, d * 0.1], PALE)
    s.sphere([w * 0.2, 0.09, 0.25], [side * w * 0.24, h + 0.13, -d * 0.3], PALE)
    s.cylinder({ radius: 0.045, height: 1.32 }, [side * (w / 2 - 0.04), 0.69, -d / 2 + 0.05], WOOD)
    s.sphere([0.075, 0.075, 0.075], [side * (w / 2 - 0.04), 1.4, -d / 2 + 0.05], TRIM)
  }
  s.box([w - 0.08, 0.75, 0.09], [0, 0.85, -d / 2 + 0.05], PALE)
  s.curve(
    [
      [-w / 2, 1.2, -d / 2 + 0.1],
      [0, 1.38, -d / 2 + 0.1],
      [w / 2, 1.2, -d / 2 + 0.1],
    ],
    0.04,
    TRIM,
  )
}

/** Ch. 375 p. 10: small cabinet with paper stack and cup beside the bunk. */
export function dressMarayamStaffCabinet(s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth,
    h = s.structure.height
  s.box([w, h, d], [0, h / 2, 0], WOOD)
  for (let y = 0.2; y < h; y += 0.2) {
    s.box([w - 0.08, 0.17, 0.035], [0, y, d / 2 + 0.015], PALE)
    s.box([0.18, 0.025, 0.035], [0, y, d / 2 + 0.04], TRIM)
  }
  for (let i = 0; i < 4; i++)
    s.box([0.38, 0.04, 0.28], [-w * 0.22, h + 0.025 + i * 0.04, 0], i % 2 ? PALE : TRIM)
  s.cylinder({ radius: 0.055, height: 0.13 }, [w * 0.26, h + 0.08, 0], PALE)
}

/** Ch. 375 p. 10: wall calendar, with original grid marks rather than transcribed dates. */
export function dressMarayamCalendar(s: ApartmentSurface): void {
  const w = s.width,
    h = s.structure.height
  s.box([w, h, 0.035], [0, h / 2, 0], WOOD)
  s.box([w - 0.05, h - 0.05, 0.018], [0, h / 2, 0.025], PALE)
  s.box([w - 0.08, 0.06, 0.012], [0, h - 0.07, 0.045], WOOD)
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 7; col++)
      s.box([0.07, 0.018, 0.012], [(col - 3) * w * 0.12, 0.1 + row * 0.095, 0.045], WOOD)
}
