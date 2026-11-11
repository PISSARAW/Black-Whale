import type { ApartmentSurface } from './apartmentDetailSurface'

type Stroke = readonly (readonly [number, number])[]
const INK = 0x434b43,
  FRAME = 0x8e9389,
  PAPER = 0xe0dfd1
// Original marker strokes reproduce the density of the panels, without asserting readable equations.
const GLYPHS: readonly Stroke[] = [
  [
    [0, 0],
    [0.45, 0.7],
    [0.9, 0],
    [0.65, 0.32],
    [0.2, 0.32],
  ],
  [
    [0, 0.65],
    [0.5, 0],
    [0.9, 0.7],
  ],
  [
    [0, 0.25],
    [0.9, 0.25],
    [0.4, 0.3],
    [0.4, 0.7],
    [0.4, 0],
  ],
  [
    [0, 0.55],
    [0.9, 0.55],
    [0.9, 0.2],
    [0, 0.2],
  ],
  [
    [0.9, 0.7],
    [0, 0.7],
    [0.5, 0.4],
    [0, 0],
    [0.9, 0],
  ],
  [
    [0.2, 0],
    [0.2, 0.7],
    [0.8, 0.7],
    [0.2, 0.36],
    [0.7, 0],
  ],
  [
    [0.1, 0.1],
    [0.2, 0.6],
    [0.65, 0.65],
    [0.85, 0.4],
    [0.65, 0.1],
    [0.1, 0.1],
  ],
  [
    [0.1, 0.7],
    [0.8, 0.7],
    [0.1, 0],
    [0.85, 0],
  ],
  [
    [0.6, 0.8],
    [0.3, 0.65],
    [0.4, 0.3],
    [0.2, 0],
    [0, -0.1],
  ],
]

function markerRow(
  surface: ApartmentSurface,
  row: { x: number; y: number; z: number; width: number; seed: number; small?: boolean },
): void {
  const pitch = row.small ? 0.032 : 0.075,
    height = row.small ? 0.035 : 0.082
  const count = Math.floor(row.width / pitch)
  for (let i = 0; i < count; i++) {
    const glyph = GLYPHS[(i * 7 + row.seed * 3) % GLYPHS.length]
    surface.curve(
      glyph.map(([x, y]) => [row.x + i * pitch + x * pitch * 0.7, row.y + y * height, row.z]),
      row.small ? 0.0017 : 0.0025,
      INK,
    )
  }
}

function whiteboard(surface: ApartmentSurface): void {
  const w = surface.width,
    h = surface.structure.height,
    z = surface.depth / 2
  surface.box([w, h, surface.depth], [0, h / 2, 0], FRAME)
  surface.box([w - 0.055, h - 0.055, 0.014], [0, h / 2, z + 0.009], 0xf2f2ea)
  for (let row = 0; row < 12; row++)
    markerRow(surface, {
      x: -w / 2 + 0.1,
      y: h - 0.15 - row * 0.115,
      z: z + 0.02,
      width: w - 0.2,
      seed: row,
    })
  surface.box([w - 0.04, 0.025, 0.12], [0, 0.015, z + 0.04], FRAME)
  surface.box([0.12, 0.018, 0.018], [w * 0.22, 0.04, z + 0.055], INK)
}

function noticeboard(surface: ApartmentSurface): void {
  const w = surface.width,
    h = surface.structure.height,
    z = surface.depth / 2
  surface.box([w, h, surface.depth], [0, h / 2, 0], FRAME)
  surface.box([w - 0.05, h - 0.05, 0.015], [0, h / 2, z + 0.01], 0xc3c0b1)
  for (let i = 0; i < 17; i++) {
    const x = -w * 0.38 + (i % 5) * w * 0.18 + ((i * 3) % 7) * 0.012
    const y = 0.22 + Math.floor(i / 5) * 0.36 + (i % 3) * 0.035
    const pw = i % 4 === 0 ? 0.35 : 0.23,
      ph = i % 3 === 0 ? 0.27 : 0.2
    const front = z + 0.024 + i * 0.0005
    surface.box([pw, ph, 0.008], [x, y, front], PAPER)
    surface.sphere([0.013, 0.013, 0.006], [x + pw * 0.22, y + ph * 0.36, front + 0.009], 0x6c6f60)
    for (let row = 0; row < 3; row++)
      markerRow(surface, {
        x: x - pw * 0.42,
        y: y + ph * 0.16 - row * 0.045,
        z: front + 0.008,
        width: pw * 0.85,
        seed: i + row,
        small: true,
      })
  }
}

export function dressTubeppaBoard(surface: ApartmentSurface): void {
  if (surface.structure.id.endsWith('-noticeboard')) noticeboard(surface)
  else whiteboard(surface)
}
