import type { ApartmentSurface } from './apartmentDetailSurface'

const WOOD = 0x81715b,
  TRIM = 0xb6a589,
  PAPER = 0xe1ddd0

function tableFrame(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, 0.07, d], [0, h - 0.035, 0], WOOD)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x = sx * (w / 2 - 0.1),
        z = sz * (d / 2 - 0.1)
      surface.curve(
        [
          [x, h - 0.08, z],
          [x + sx * 0.025, h * 0.48, z],
          [x, 0.04, z],
        ],
        0.04,
        WOOD,
      )
    }
  }
  for (const side of [-1, 1])
    surface.box([w - 0.1, 0.12, 0.045], [0, h - 0.13, side * (d / 2 - 0.06)], TRIM)
}

function openBook(surface: ApartmentSurface): void {
  const h = surface.structure.height
  for (const side of [-1, 1]) {
    surface.box([0.28, 0.025, 0.36], [side * 0.15, h + 0.025, 0], PAPER)
    for (let row = 0; row < 7; row++) {
      const z = -0.13 + row * 0.04
      surface.box([0.19 - (row % 3) * 0.02, 0.002, 0.004], [side * 0.15, h + 0.039, z], 0x8b8a7e)
    }
  }
  surface.box([0.014, 0.027, 0.36], [0, h + 0.03, 0], 0xb1ad99)
  surface.box([0.24, 0.008, 0.012], [0.1, h + 0.055, 0.18], 0x555d52)
}

/** Original abstract page marks; no manga text, message or calculation is transcribed. */
function calculator(surface: ApartmentSurface): void {
  const x = surface.width * 0.32,
    h = surface.structure.height
  surface.box([0.2, 0.035, 0.27], [x, h + 0.025, 0.08], 0xc2c1b2)
  surface.box([0.14, 0.004, 0.045], [x, h + 0.045, -0.005], 0x566258)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++)
      surface.box(
        [0.027, 0.009, 0.025],
        [x - 0.05 + col * 0.05, h + 0.048, 0.07 + row * 0.045],
        0x7f857a,
      )
  }
}

export function dressKachoStudyTable(surface: ApartmentSurface): void {
  tableFrame(surface)
  openBook(surface)
  calculator(surface)
  const h = surface.structure.height,
    x = -surface.width * 0.32
  surface.box([0.13, 0.25, 0.13], [x, h + 0.135, -0.2], 0xb5bfae)
  surface.box([0.065, 0.045, 0.065], [x, h + 0.282, -0.2], 0xe1ddd0)
  surface.box([0.135, 0.065, 0.135], [x, h + 0.12, -0.2], 0xd4d0bf)
}

/** Ch. 366 p. 4: broad rectangular meal table, inset border and carved apron. */
export function dressKachoDiningTable(surface: ApartmentSurface): void {
  tableFrame(surface)
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w - 0.16, 0.018, d - 0.16], [0, h + 0.009, 0], 0xd6d0bd)
  for (const side of [-1, 1]) {
    surface.box([w - 0.05, 0.025, 0.035], [0, h + 0.012, side * (d / 2 - 0.035)], TRIM)
    surface.box([0.035, 0.025, d - 0.05], [side * (w / 2 - 0.035), h + 0.012, 0], TRIM)
    for (let i = 0; i < 7; i++) {
      const x = (i - 3) * w * 0.12
      surface.sphere([0.035, 0.035, 0.015], [x, h - 0.13, side * (d / 2 - 0.03)], WOOD)
    }
  }
}
