import { dressRoyalSalonSeat } from './royalSalonSeating'
import {
  SALON_GOLD,
  SALON_STONE,
  SALON_WOOD,
  SalonSurface,
  salonBouquet,
  salonFrame,
  salonVase,
} from './royalSalonDetailSurface'
import type { Point3 } from './banquetDetailBuilder'

function clockAtRight(surface: SalonSurface, y: number): void {
  const original = surface.structure
  const at = surface.point([surface.width * 0.23, 0, 0])
  const clockSurface = new SalonSurface(
    surface.into,
    { ...original, at: [at[0], at[2]] },
    surface.floor,
  )
  clock(clockSurface, y)
}

function clock(surface: SalonSurface, y: number): void {
  surface.box([0.68, 0.08, 0.22], [0, y + 0.04, 0], SALON_WOOD)
  surface.sphere([0.29, 0.27, 0.1], [0, y + 0.29, 0], SALON_GOLD)
  surface.sphere([0.22, 0.22, 0.018], [0, y + 0.29, 0.1], 0xe1d9c2)
  surface.ring(0.23, [0, y + 0.29, 0.12], SALON_WOOD)
  surface.box([0.018, 0.12, 0.02], [0, y + 0.34, 0.13], SALON_WOOD)
  surface.box([0.1, 0.018, 0.02], [0.04, y + 0.29, 0.13], SALON_WOOD)
}

function photograph(surface: SalonSurface, at: Point3): void {
  const [x, y, z] = at
  surface.box([0.22, 0.3, 0.035], [x, y + 0.15, z], SALON_GOLD)
  surface.box([0.17, 0.25, 0.014], [x, y + 0.15, z + 0.027], 0x393c35)
  surface.sphere([0.04, 0.045, 0.01], [x, y + 0.2, z + 0.04], SALON_STONE)
  surface.sphere([0.065, 0.065, 0.01], [x, y + 0.105, z + 0.04], SALON_STONE)
}

function mantel(surface: SalonSurface): void {
  const { width: w, depth: d, structure } = surface
  const top = structure.height
  const z = d / 2 + 0.025
  surface.box([w * 0.6, top * 0.74, 0.035], [0, top * 0.43, z], 0x211f1b)
  for (const side of [-1, 1]) {
    surface.box([0.18, top * 0.8, 0.1], [side * w * 0.35, top * 0.45, z + 0.03], SALON_STONE)
    photograph(surface, [side * w * 0.23, top + 0.04, 0.12])
    photograph(surface, [side * w * 0.32, top + 0.04, 0.05])
    salonVase(surface, [side * w * 0.43, top + 0.04, 0], 0.85)
    surface.curve(
      [
        [side * w * 0.34, top * 0.85, z],
        [side * w * 0.4, top * 0.77, z + 0.05],
        [side * w * 0.37, top * 0.63, z + 0.02],
      ],
      0.035,
      SALON_GOLD,
    )
  }
  surface.box([w + 0.04, 0.075, d + 0.035], [0, top + 0.02, 0], SALON_STONE)
  surface.box([w * 0.9, 0.13, d], [0, 0.11, 0], SALON_WOOD)
  bust(surface, [-w * 0.1, top + 0.06, 0], 0.8)
  clockAtRight(surface, top + 0.06)
}

function speaker(surface: SalonSurface): void {
  surface.box(
    [surface.width, surface.structure.height, surface.depth],
    [0, surface.structure.height / 2, 0],
    SALON_WOOD,
  )
  const z = surface.depth / 2 + 0.025
  surface.box(
    [surface.width * 0.9, surface.structure.height * 0.96, 0.025],
    [0, surface.structure.height / 2, z],
    0x262927,
  )
  for (const [y, radius] of [
    [0.46, 0.21],
    [1.22, 0.19],
    [2.06, 0.1],
  ]) {
    surface.sphere([radius, radius, 0.022], [0, y, z + 0.02], 0x101615)
    surface.ring(radius, [0, y, z + 0.035], 0x6a6a60)
    surface.sphere([radius * 0.35, radius * 0.35, 0.035], [0, y, z + 0.045], 0x4c514a)
  }
}

function cabinet(surface: SalonSurface): void {
  const { width: w, depth: d, structure } = surface
  const y = structure.height
  surface.box([w, y * 0.85, d], [0, y * 0.55, 0], SALON_WOOD)
  for (const x of [-w * 0.38, w * 0.38])
    surface.box([0.07, y * 0.2, d * 0.75], [x, y * 0.1, 0], SALON_GOLD)
  surface.box([w + 0.025, 0.055, d + 0.025], [0, y + 0.015, 0], SALON_WOOD)
  salonFrame(surface, { width: w * 0.81, height: y * 0.65, y: y / 2, z: d / 2 + 0.03 })
  for (const side of [-1, 1]) {
    surface.sphere([0.035, 0.035, 0.04], [side * w * 0.15, y * 0.55, d / 2 + 0.06], SALON_GOLD)
  }
  if (structure.id.includes('-display-')) bust(surface, [0, y + 0.05, 0], 0.75)
  else salonBouquet(surface, [0, y + 0.05, 0], 0.9)
}

function bottle(surface: SalonSurface, at: Point3): void {
  const [x, y, z] = at
  surface.cylinder({ radius: 0.052, height: 0.22 }, [x, y + 0.11, z], 0x344439)
  surface.cylinder({ radius: 0.02, height: 0.13 }, [x, y + 0.28, z], 0x344439)
  surface.box([0.08, 0.07, 0.105], [x, y + 0.12, z], 0xcec6ab)
  surface.cylinder({ radius: 0.023, height: 0.03 }, [x, y + 0.35, z], SALON_GOLD)
}

function drinks(surface: SalonSurface): void {
  const { width: w, depth: d, structure } = surface
  const top = structure.height
  surface.box([w + 0.025, 0.02, d + 0.025], [0, top + 0.015, 0], 0xd3cbb6)
  for (const x of [-w * 0.38, w * 0.38])
    for (const z of [-d * 0.38, d * 0.38])
      surface.box([0.07, top - 0.06, 0.07], [x, (top - 0.06) / 2, z], SALON_WOOD)
  // Hem and folds stay on the current table, including after a Hatsu rebuild.
  for (const side of [-1, 1]) {
    for (let fold = 0; fold < 12; fold++) {
      surface.box(
        [w / 12, top * 0.75, 0.025],
        [((fold - 5.5) * w) / 12, top * 0.61, side * (d / 2 + 0.018)],
        fold % 2 ? 0xc4bca9 : 0xe1d9c4,
      )
    }
  }
  for (let index = 0; index < 5; index++) {
    bottle(surface, [(index - 2) * w * 0.14, top + 0.03, -d * 0.2])
    const x = (index - 2) * w * 0.14
    surface.cylinder({ radius: 0.035, height: 0.012 }, [x, top + 0.04, d * 0.22], SALON_GOLD)
    surface.cylinder({ radius: 0.007, height: 0.09 }, [x, top + 0.09, d * 0.22], SALON_GOLD)
    surface.cylinder(
      { radius: 0.04, bottom: 0.014, height: 0.06 },
      [x, top + 0.16, d * 0.22],
      0xc6d0bc,
    )
  }
}

function table(surface: SalonSurface): void {
  const { width: w, depth: d, structure } = surface
  surface.box([w + 0.035, 0.04, d + 0.035], [0, structure.height + 0.02, 0], SALON_WOOD)
  surface.box([w * 0.83, 0.012, d * 0.83], [0, structure.height + 0.047, 0], 0x7e806a)
  for (const x of [-w * 0.38, w * 0.38])
    for (const z of [-d * 0.38, d * 0.38]) {
      surface.box(
        [0.065, structure.height - 0.04, 0.065],
        [x, (structure.height - 0.04) / 2, z],
        SALON_WOOD,
      )
      surface.sphere([0.05, 0.035, 0.05], [x, 0.04, z], SALON_GOLD)
    }
  if (structure.id.endsWith('-long-table')) {
    for (const z of [-d * 0.14, d * 0.14]) salonVase(surface, [0, structure.height + 0.06, z], 0.5)
    surface.box([w * 0.35, 0.045, d * 0.25], [0, structure.height + 0.07, -d * 0.3], SALON_STONE)
  } else salonBouquet(surface, [0, structure.height + 0.06, 0], 0.55)
}

/** Simplified draped bust and stepped plinth visible among the mantel ornaments. */
function bust(s: SalonSurface, at: Point3, scale: number): void {
  const [x, y, z] = at
  s.box([0.42 * scale, 0.08 * scale, 0.3 * scale], [x, y + 0.04 * scale, z], SALON_STONE)
  s.cylinder(
    { radius: 0.14 * scale, bottom: 0.22 * scale, height: 0.35 * scale },
    [x, y + 0.25 * scale, z],
    SALON_STONE,
  )
  s.sphere([0.26 * scale, 0.16 * scale, 0.15 * scale], [x, y + 0.43 * scale, z], SALON_STONE)
  s.sphere([0.115 * scale, 0.15 * scale, 0.11 * scale], [x, y + 0.66 * scale, z], SALON_STONE)
  s.sphere(
    [0.045 * scale, 0.05 * scale, 0.055 * scale],
    [x, y + 0.67 * scale, z + 0.1 * scale],
    SALON_STONE,
  )
}

export function dressRoyalSalonFurniture(surface: SalonSurface): void {
  const { structure } = surface
  if (structure.kind === 'seat') dressRoyalSalonSeat(surface)
  else if (structure.id.endsWith('-mantel')) mantel(surface)
  else if (structure.id.includes('-floor-speaker')) speaker(surface)
  else if (structure.kind === 'cabinet') cabinet(surface)
  else if (structure.id.endsWith('-drinks-cart')) drinks(surface)
  else if (structure.kind === 'table') table(surface)
}
