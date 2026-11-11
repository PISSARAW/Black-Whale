import {
  QueenUnmaSurface,
  UNMA_FABRIC_PALE,
  UNMA_GOLD,
  UNMA_LIGHT_WOOD,
  UNMA_STONE,
  UNMA_VELVET,
  UNMA_WOOD,
} from './queenUnmaDetailSurface'
import { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentFurniture } from './apartmentFurniture'
import { dressUnmaNursery } from './queenUnmaNursery'

function royalArmchair(surface: QueenUnmaSurface): void {
  const { width: w, depth: d, structure } = surface
  const h = structure.height

  // Seat frame & cushion
  surface.box([w * 0.94, 0.12, d * 0.88], [0, 0.38, 0], UNMA_WOOD)
  surface.box([w * 0.96, 0.04, d * 0.9], [0, 0.42, 0], UNMA_GOLD)
  surface.box([w * 0.92, 0.03, d * 0.86], [0, 0.32, 0], UNMA_GOLD)
  surface.sphere([w * 0.44, 0.14, d * 0.42], [0, 0.48, 0.02], UNMA_VELVET)

  // Lumbar cushion in silk brocade
  surface.sphere([w * 0.32, 0.09, 0.1], [0, 0.54, -d * 0.18], 0xd4c090)
  surface.sphere([0.02, 0.02, 0.02], [0, 0.54, -d * 0.18 + 0.08], UNMA_VELVET)

  // Tall arched backrest with sculpted crest and winged ears
  armchairBackrest(surface, { w, d, h })

  // Scrolled armrests and cabriole legs
  armchairArmrestsAndLegs(surface, { w, d, h })
}

function armchairBackrest(
  surface: QueenUnmaSurface,
  dim: { w: number; d: number; h: number },
): void {
  const { w, d, h } = dim
  const backY = 0.42 + (h - 0.42) / 2
  const backZ = -d * 0.34
  const backH = h - 0.42

  surface.sphere([w * 0.46, backH * 0.53, 0.09], [0, backY, backZ], UNMA_WOOD)
  surface.sphere([w * 0.38, backH * 0.44, 0.1], [0, backY, backZ + 0.05], UNMA_VELVET)

  // Sculpted top crest: shell rocaille & finial
  surface.sphere([w * 0.32, 0.16, 0.1], [0, h + 0.06, backZ], UNMA_WOOD)
  surface.sphere([w * 0.18, 0.11, 0.08], [0, h + 0.08, backZ + 0.04], UNMA_GOLD)
  surface.sphere([0.08, 0.1, 0.08], [0, h + 0.16, backZ], UNMA_GOLD)
}

function armchairArmrestsAndLegs(
  surface: QueenUnmaSurface,
  dim: { w: number; d: number; h: number },
): void {
  const { w, d } = dim
  for (const side of [-1, 1]) {
    const x = side * w * 0.44
    // Armrest rail, acanthus scroll & velvet arm-pad
    surface.box([0.1, 0.26, d * 0.65], [x, 0.58, 0], UNMA_WOOD)
    surface.sphere([0.065, 0.07, d * 0.3], [x, 0.72, 0], UNMA_VELVET)
    surface.sphere([0.07, 0.07, 0.07], [x, 0.72, d * 0.32], UNMA_GOLD)
    surface.ring(0.045, [x, 0.62, d * 0.33], UNMA_GOLD)

    // 4 cabriole legs with gilded acanthus knees and feet
    for (const z of [-d * 0.35, d * 0.35]) {
      surface.cylinder({ radius: 0.045, height: 0.36 }, [x, 0.19, z], UNMA_WOOD)
      surface.sphere([0.055, 0.06, 0.055], [x, 0.32, z], UNMA_GOLD)
      surface.sphere([0.05, 0.05, 0.05], [x, 0.06, z], UNMA_GOLD)
    }
  }
}

function legs(s: QueenUnmaSurface): void {
  const { width: w, depth: d, structure } = s,
    h = structure.height
  for (const x of [-w * 0.38, w * 0.38])
    for (const z of [-d * 0.33, d * 0.33])
      s.curve(
        [
          [x, 0.035, z],
          [x * 1.08, h * 0.65, z * 1.05],
          [x, h - 0.05, z],
        ],
        0.035,
        UNMA_WOOD,
      )
}
function table(s: QueenUnmaSurface): void {
  const { width: w, depth: d, structure } = s,
    h = structure.height
  legs(s)
  if (structure.id.endsWith('-coffee-table'))
    s.sphere([w * 0.5, 0.035, d * 0.5], [0, h, 0], UNMA_STONE)
  else s.box([w, 0.055, d], [0, h - 0.02, 0], UNMA_WOOD)
  if (structure.id.endsWith('-coffee-table'))
    s.cylinder({ radius: w * 0.41, height: 0.12 }, [0, h - 0.12, 0], UNMA_LIGHT_WOOD)
  else s.box([w * 0.85, 0.12, d * 0.8], [0, h - 0.12, 0], UNMA_LIGHT_WOOD)
  if (structure.id.endsWith('-side-table-port')) telephone(s, h)
  else if (structure.id.endsWith('-side-table-starboard')) tea(s, h)
  else if (structure.id.endsWith('-coffee-table')) bouquet(s, h)
  else if (structure.id.endsWith('-guest-table')) {
    s.cylinder({ radius: 0.2, height: 0.04 }, [0, h + 0.035, 0], UNMA_STONE)
    for (const x of [-0.09, 0, 0.09]) s.sphere([0.035, 0.035, 0.035], [x, h + 0.075, 0], UNMA_GOLD)
  }
}
function telephone(s: QueenUnmaSurface, y: number): void {
  s.sphere([0.21, 0.04, 0.15], [0, y + 0.05, 0], UNMA_WOOD)
  s.sphere([0.08, 0.025, 0.07], [0, y + 0.085, 0], UNMA_GOLD)
  s.curve(
    [
      [-0.19, y + 0.15, 0],
      [-0.13, y + 0.22, 0],
      [0.13, y + 0.22, 0],
      [0.19, y + 0.15, 0],
    ],
    0.035,
    UNMA_WOOD,
  )
  for (const x of [-0.19, 0.19]) s.sphere([0.055, 0.035, 0.07], [x, y + 0.15, 0], UNMA_WOOD)
  s.curve(
    [
      [0.18, y + 0.13, 0.03],
      [0.26, y + 0.03, 0.04],
      [0.2, y - 0.18, 0.08],
      [0.1, y - 0.08, 0.12],
    ],
    0.009,
    UNMA_WOOD,
  )
}
function tea(s: QueenUnmaSurface, y: number): void {
  s.cylinder({ radius: 0.13, bottom: 0.1, height: 0.19 }, [0.1, y + 0.12, 0], UNMA_STONE)
  s.sphere([0.13, 0.035, 0.13], [0.1, y + 0.23, 0], UNMA_STONE)
  s.curve(
    [
      [0.2, y + 0.17, 0],
      [0.3, y + 0.17, 0],
      [0.27, y + 0.06, 0],
      [0.2, y + 0.08, 0],
    ],
    0.015,
    UNMA_GOLD,
  )
  s.curve(
    [
      [0, y + 0.09, 0],
      [-0.1, y + 0.14, 0],
      [-0.12, y + 0.22, 0],
    ],
    0.025,
    UNMA_STONE,
  )
  s.cylinder({ radius: 0.09, height: 0.012 }, [-0.18, y + 0.018, 0.15], UNMA_STONE)
  s.cylinder({ radius: 0.05, height: 0.06 }, [-0.18, y + 0.05, 0.15], UNMA_STONE)
}
function bouquet(s: QueenUnmaSurface, y: number): void {
  s.cylinder({ radius: 0.16, bottom: 0.1, height: 0.3 }, [0, y + 0.16, 0], UNMA_STONE)
  s.sphere([0.19, 0.16, 0.16], [0, y + 0.22, 0], UNMA_STONE)
  for (let n = 0; n < 11; n++) {
    const a = n * 2.4,
      x = Math.cos(a) * 0.29,
      z = Math.sin(a) * 0.21,
      h = y + 0.6 + (n % 3) * 0.08
    s.curve(
      [
        [0, y + 0.3, 0],
        [x * 0.5, y + 0.48, z * 0.5],
        [x, h, z],
      ],
      0.01,
      0x68705a,
    )
    s.sphere([0.105, 0.095, 0.095], [x, h, z], n % 2 ? UNMA_FABRIC_PALE : 0xac8e85)
  }
}
function mantel(s: QueenUnmaSurface): void {
  const { width: w, depth: d, structure } = s,
    h = structure.height
  s.box([w, 0.1, d], [0, h, 0], UNMA_STONE)
  s.box([w * 0.8, 0.12, d], [0, 0.06, 0], UNMA_STONE)
  s.box([w * 0.58, h * 0.75, 0.02], [0, h * 0.45, d * 0.4], 0x242723)
  s.sphere([w * 0.29, h * 0.33, 0.02], [0, h * 0.66, d * 0.4], 0x242723)
  for (const x of [-w * 0.4, w * 0.4]) {
    s.box([w * 0.16, h - 0.12, d], [x, h * 0.48, 0], UNMA_STONE)
    s.sphere([0.08, 0.14, 0.08], [x, h + 0.2, 0], UNMA_GOLD)
  }
}
function partition(s: QueenUnmaSurface): void {
  const { structure } = s,
    [w, d] = structure.size
  s.into.box([w, structure.height, Math.min(d, 0.18)], {
    at: [structure.at[0], s.floor + structure.base + structure.height / 2, structure.at[1]],
    colour: 0xc1bbab,
  })
}
export function dressQueenUnmaFurniture(s: QueenUnmaSurface): void {
  const { id, kind } = s.structure
  if (id.includes('-partition-')) partition(s)
  else if (id.endsWith('-mantel')) mantel(s)
  else if (kind === 'seat') royalArmchair(s)
  else if (kind === 'table') table(s)
  else if (id.endsWith('-crib') || kind === 'mobile') dressUnmaNursery(s)
  else if (id.endsWith('-bed'))
    dressApartmentFurniture(new ApartmentSurface(s.into, s.structure, s.floor))
}
