import { ApartmentSurface } from './apartmentDetailSurface'

interface BedPalette {
  wood: number
  edge: number
  linen: number
  textile: number
  accent: number
}

const TEXTILES: Readonly<Record<number, readonly [number, number]>> = {
  1001: [0x6f2d32, 0xb08b4f],
  1002: [0x753747, 0xc59b69],
  1003: [0x596044, 0xb29859],
  1004: [0x3e3a3a, 0x9c7d58],
  1005: [0x3f6664, 0x9caa91],
  1006: [0x8a5967, 0xc4a066],
  1007: [0x5e465e, 0xad8d5d],
  1008: [0x6f4938, 0xc39455],
  1009: [0x394e68, 0xb29257],
  1010: [0x49665a, 0xb59b68],
  1011: [0x596584, 0xaaa4c2],
  1012: [0x815760, 0xc4a76d],
  1013: [0x64837b, 0xb9a574],
  1014: [0x8a8069, 0xc5a75f],
}

export function princeNumberOf(id: string): number | null {
  const match = id.match(/room-(10(?:0[1-9]|1[0-4]))-bedroom/)
  return match ? Number(match[1]) : null
}

export function princeBedPalette(id: string): BedPalette | null {
  const number = princeNumberOf(id)
  if (!number) return null
  const [textile, accent] = TEXTILES[number]
  return { wood: 0x5a4434, edge: 0x332a24, linen: 0xd9d2c2, textile, accent }
}

function legs(surface: ApartmentSurface, palette: BedPalette): void {
  const x = surface.width / 2 - 0.09
  const z = surface.depth / 2 - 0.1
  for (const sideX of [-1, 1]) {
    for (const sideZ of [-1, 1]) {
      surface.box([0.075, 0.2, 0.075], [sideX * x, 0.1, sideZ * z], palette.edge)
      surface.sphere([0.055, 0.055, 0.055], [sideX * x, 0.22, sideZ * z], palette.accent)
    }
  }
}

function headboard(surface: ApartmentSurface, palette: BedPalette, top: number): void {
  const w = surface.width,
    d = surface.depth
  surface.box([w + 0.08, top, 0.11], [0, top / 2, -d / 2 + 0.04], palette.wood)
  surface.box([w - 0.12, top - 0.2, 0.055], [0, top / 2, -d / 2 + 0.11], palette.textile)
  const columns = w > 2.8 ? 5 : 3
  for (let index = 1; index < columns; index++) {
    const x = (index / columns - 0.5) * (w - 0.14)
    surface.box([0.025, top - 0.24, 0.025], [x, top / 2, -d / 2 + 0.145], palette.accent)
  }
  for (const x of [-w * 0.24, 0, w * 0.24]) {
    surface.sphere([0.025, 0.025, 0.018], [x, top * 0.56, -d / 2 + 0.17], palette.accent)
  }
  surface.box([w + 0.16, 0.07, 0.14], [0, top - 0.035, -d / 2 + 0.04], palette.accent)
  surface.ring(0.11, [0, top + 0.07, -d / 2 + 0.1], palette.accent)
}

function bedding(surface: ApartmentSurface, palette: BedPalette, mattressY: number): void {
  const w = surface.width,
    d = surface.depth
  surface.box([w - 0.08, 0.21, d - 0.08], [0, mattressY, 0], palette.linen)
  surface.box([w - 0.14, 0.045, d * 0.69], [0, mattressY + 0.13, d * 0.13], palette.textile)
  surface.box([w - 0.15, 0.13, 0.05], [0, mattressY + 0.08, d * 0.46], palette.textile)
  surface.box([w - 0.2, 0.025, d * 0.18], [0, mattressY + 0.165, d * 0.25], palette.accent)
  const pillowCount = w > 2.8 ? 4 : 2
  for (let index = 0; index < pillowCount; index++) {
    const x = (index - (pillowCount - 1) / 2) * Math.min(0.55, w / pillowCount)
    surface.sphere(
      [Math.min(0.27, w / pillowCount / 2.2), 0.08, 0.21],
      [x, mattressY + 0.18, -d * 0.3],
      palette.linen,
    )
  }
}

function footboard(surface: ApartmentSurface, palette: BedPalette): void {
  const w = surface.width,
    d = surface.depth
  surface.box([w + 0.02, 0.38, 0.09], [0, 0.3, d / 2 - 0.045], palette.wood)
  surface.box([w - 0.16, 0.19, 0.035], [0, 0.31, d / 2 + 0.01], palette.textile)
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    surface.sphere([0.07, 0.07, 0.07], [x, 0.56, d / 2 - 0.045], palette.accent)
  }
}

/** Chs. 366–368: Momoze's bed has four tall posts, a canopy and gathered curtains. */
function canopy(surface: ApartmentSurface, palette: BedPalette): void {
  const w = surface.width,
    d = surface.depth,
    top = 2.45
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    for (const z of [-d / 2 + 0.06, d / 2 - 0.06]) {
      surface.box([0.075, top, 0.075], [x, top / 2, z], palette.wood)
      surface.sphere([0.065, 0.065, 0.065], [x, top + 0.05, z], palette.accent)
    }
  }
  surface.box([w, 0.08, 0.08], [0, top, -d / 2 + 0.06], palette.accent)
  surface.box([w, 0.08, 0.08], [0, top, d / 2 - 0.06], palette.accent)
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    surface.box([0.08, 0.08, d], [x, top, 0], palette.accent)
    surface.box([0.12, 1.15, d * 0.3], [x, top - 0.66, -d * 0.31], palette.textile)
  }
  surface.box([w - 0.12, 0.16, d - 0.12], [0, top - 0.06, 0], palette.linen)
}

/** Royal bed reconstructed from the ch. 363 plan, with panel-specific variants where shown. */
export function dressPrinceBedroomBed(surface: ApartmentSurface): boolean {
  const palette = princeBedPalette(surface.structure.id)
  if (!palette || !surface.structure.id.endsWith('-bedroom-bed-01')) return false
  const h = surface.structure.height
  const frameY = Math.max(0.26, h * 0.48)
  const mattressY = frameY + 0.14
  legs(surface, palette)
  surface.box([surface.width, 0.2, surface.depth], [0, frameY, 0], palette.wood)
  headboard(surface, palette, Math.max(1.02, mattressY + 0.58))
  bedding(surface, palette, mattressY)
  footboard(surface, palette)
  if (princeNumberOf(surface.structure.id) === 1012) canopy(surface, palette)
  return true
}
