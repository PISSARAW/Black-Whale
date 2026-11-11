import { dressZhangLeiTableObjects } from './zhangLeiTableObjects'
import {
  ZHANG_LEI_BRONZE,
  ZHANG_LEI_GOLD,
  ZHANG_LEI_STONE,
  ZHANG_LEI_VELVET,
  ZHANG_LEI_WOOD,
  ZhangLeiSurface,
} from './zhangLeiDetailSurface'

function stateDiningTable(surface: ZhangLeiSurface): void {
  const { width: w, depth: d, structure } = surface
  const topY = structure.height

  // Main thick carved mahogany tabletop with stepped molded edge
  surface.box([w, 0.065, d], [0, topY - 0.032, 0], ZHANG_LEI_WOOD)
  surface.box([w + 0.03, 0.02, d + 0.03], [0, topY - 0.01, 0], ZHANG_LEI_GOLD)
  surface.box([w * 0.96, 0.015, d * 0.94], [0, topY + 0.005, 0], 0x482d1c)

  // Ch. 365 p. 16: curved carved corner legs and a moulded apron.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const legX = sx * (w / 2 - 0.25)
      const legZ = sz * (d / 2 - 0.25)
      surface.curve(
        [
          [legX, topY - 0.08, legZ],
          [legX + sx * 0.07, 0.53, legZ + sz * 0.04],
          [legX - sx * 0.09, 0.3, legZ - sz * 0.07],
          [legX, 0.08, legZ],
        ],
        0.075,
        ZHANG_LEI_WOOD,
      )
      surface.sphere([0.12, 0.1, 0.1], [legX, 0.59, legZ], ZHANG_LEI_GOLD)
    }
  }
  for (const side of [-1, 1]) {
    const z = side * (d / 2 - 0.07)
    surface.box([w - 0.3, 0.14, 0.08], [0, topY - 0.13, z], ZHANG_LEI_WOOD)
    for (let i = 0; i < 9; i++) {
      const x = ((i - 4) * (w - 0.65)) / 9
      surface.curve(
        [
          [x - 0.1, 0.64, z],
          [x, 0.58, z + side * 0.04],
          [x + 0.1, 0.66, z],
        ],
        0.018,
        ZHANG_LEI_GOLD,
      )
    }
  }

  // Cross stretcher bars and central carved vase finial
  surface.box([w - 0.5, 0.04, 0.06], [0, 0.12, 0], ZHANG_LEI_WOOD)
  surface.box([0.06, 0.04, d - 0.5], [0, 0.12, 0], ZHANG_LEI_WOOD)
  surface.sphere([0.07, 0.1, 0.07], [0, 0.18, 0], ZHANG_LEI_GOLD)
}

function chairBackrest(surface: ZhangLeiSurface, dim: { w: number; d: number; h: number }): void {
  const { w, d } = dim
  const h = dim.h - 0.22
  const backY = 0.45 + (h - 0.45) / 2
  const backZ = -d * 0.38
  const backH = h - 0.45

  // High wooden backrest frame with molded borders
  surface.box([w * 0.88, backH, 0.09], [0, backY, backZ], ZHANG_LEI_WOOD)
  surface.box([w * 0.82, backH * 0.94, 0.1], [0, backY, backZ], ZHANG_LEI_GOLD)

  // Rich padded velvet backrest cushion
  surface.sphere([w * 0.36, backH * 0.44, 0.08], [0, backY, backZ + 0.04], ZHANG_LEI_VELVET)

  // Sculpted baroque top crest and royal finial
  surface.sphere([w * 0.3, 0.14, 0.08], [0, h + 0.06, backZ], ZHANG_LEI_WOOD)
  surface.sphere([w * 0.16, 0.09, 0.06], [0, h + 0.08, backZ + 0.03], ZHANG_LEI_GOLD)
  surface.sphere([0.05, 0.08, 0.05], [0, h + 0.14, backZ], ZHANG_LEI_GOLD)
}

function highBackedChair(surface: ZhangLeiSurface): void {
  const { width: w, depth: d, structure } = surface
  const h = structure.height

  // Seat frame & molded trim
  surface.box([w * 0.92, 0.1, d * 0.88], [0, 0.4, 0], ZHANG_LEI_WOOD)
  surface.box([w * 0.94, 0.03, d * 0.9], [0, 0.43, 0], ZHANG_LEI_GOLD)
  surface.sphere([w * 0.42, 0.12, d * 0.4], [0, 0.48, 0.02], ZHANG_LEI_VELVET)

  // Backrest & crest
  chairBackrest(surface, { w, d, h })

  // Armrests with padded velvet rests and carved scrolled consoles
  for (const side of [-1, 1]) {
    const x = side * w * 0.43
    surface.box([0.08, 0.24, d * 0.62], [x, 0.58, 0], ZHANG_LEI_WOOD)
    surface.sphere([0.055, 0.06, d * 0.28], [x, 0.71, 0], ZHANG_LEI_VELVET)
    surface.sphere([0.05, 0.05, 0.05], [x, 0.71, d * 0.3], ZHANG_LEI_GOLD)

    // Turned front and back legs with gilded sabots
    for (const z of [-d * 0.35, d * 0.35]) {
      surface.cylinder({ radius: 0.038, height: 0.38 }, [x, 0.2, z], ZHANG_LEI_WOOD)
      surface.sphere([0.045, 0.05, 0.045], [x, 0.05, z], ZHANG_LEI_GOLD)
    }
  }
}

function credenza(surface: ZhangLeiSurface): void {
  const { width: w, depth: d, structure } = surface
  const h = structure.height

  // Base plinth and main wooden body
  surface.box([w, 0.08, d], [0, 0.05, 0], ZHANG_LEI_WOOD)
  surface.box([w * 0.96, h - 0.14, d * 0.94], [0, (h - 0.06) / 2 + 0.04, 0], ZHANG_LEI_WOOD)

  // Molded top slab with bevelled lip
  surface.box([w + 0.04, 0.05, d + 0.03], [0, h, 0], ZHANG_LEI_WOOD)
  surface.box([w + 0.02, 0.015, d + 0.02], [0, h - 0.025, 0], ZHANG_LEI_GOLD)

  // 4 Recessed door panels with gold molded moldings
  for (let i = 0; i < 4; i++) {
    const panelX = -w * 0.36 + (i * w * 0.72) / 3
    surface.box([w * 0.21, h * 0.62, 0.02], [panelX, h * 0.44, d / 2 + 0.01], 0x472d1d)
    surface.box([w * 0.18, h * 0.58, 0.025], [panelX, h * 0.44, d / 2 + 0.012], ZHANG_LEI_GOLD)
    surface.sphere([0.02, 0.02, 0.02], [panelX, h * 0.52, d / 2 + 0.03], ZHANG_LEI_BRONZE)
  }
}

function statueAndStand(surface: ZhangLeiSurface): void {
  const { width: w, structure } = surface
  const h = structure.height
  const r = (w * 0.85) / 2
  const standH = h * 0.48

  // Octagonal wooden pedestal with tiered base and capital moldings
  surface.cylinder({ radius: r, height: 0.1, sides: 8 }, [0, 0.05, 0], ZHANG_LEI_WOOD)
  surface.cylinder({ radius: r * 0.9, height: 0.04, sides: 8 }, [0, 0.12, 0], ZHANG_LEI_GOLD)
  surface.cylinder(
    { radius: r * 0.75, height: standH - 0.24, sides: 8 },
    [0, standH / 2, 0],
    ZHANG_LEI_WOOD,
  )
  surface.ring(r * 0.76, [0, standH * 0.5, 0], ZHANG_LEI_GOLD)
  surface.cylinder(
    { radius: r * 0.9, height: 0.05, sides: 8 },
    [0, standH - 0.06, 0],
    ZHANG_LEI_GOLD,
  )
  surface.cylinder({ radius: r, height: 0.08, sides: 8 }, [0, standH, 0], ZHANG_LEI_WOOD)

  // A complete standing figure is visible in ch. 365 p. 16, not just a bust.
  const y = standH + 0.08
  for (const side of [-1, 1]) {
    surface.cylinder({ radius: 0.045, height: 0.3 }, [side * 0.055, y + 0.15, 0], ZHANG_LEI_STONE)
    surface.sphere([0.035, 0.13, 0.04], [side * 0.14, y + 0.43, 0], ZHANG_LEI_STONE)
  }
  surface.sphere([0.11, 0.18, 0.07], [0, y + 0.43, 0], ZHANG_LEI_STONE)
  surface.sphere([0.065, 0.085, 0.06], [0, y + 0.68, 0], ZHANG_LEI_STONE)
}

function pedestalTable(surface: ZhangLeiSurface): void {
  const { width: w, structure } = surface
  const topY = structure.height
  const r = (w * 0.9) / 2

  // Molded circular tabletop with brass edge
  surface.cylinder({ radius: r, height: 0.04, sides: 24 }, [0, topY, 0], ZHANG_LEI_WOOD)
  surface.ring(r, [0, topY + 0.015, 0], ZHANG_LEI_GOLD)
  surface.cylinder({ radius: r * 0.85, height: 0.01, sides: 24 }, [0, topY + 0.022, 0], 0x482d1c)

  // Turned central baluster & tripod arched base
  surface.cylinder({ radius: 0.055, height: topY - 0.14 }, [0, topY / 2, 0], ZHANG_LEI_WOOD)
  surface.sphere([0.08, 0.08, 0.08], [0, topY * 0.32, 0], ZHANG_LEI_GOLD)
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3
    surface.curve(
      [
        [0, topY * 0.25, 0],
        [Math.cos(angle) * r * 0.5, topY * 0.15, Math.sin(angle) * r * 0.5],
        [Math.cos(angle) * r * 0.85, 0.03, Math.sin(angle) * r * 0.85],
      ],
      0.03,
      ZHANG_LEI_WOOD,
    )
  }

  // Silver greeting tray / salver on top
  surface.cylinder({ radius: 0.12, height: 0.015, sides: 16 }, [0, topY + 0.03, 0], 0xd5dce0)
  surface.ring(0.12, [0, topY + 0.04, 0], ZHANG_LEI_GOLD)
}

export function dressZhangLeiFurniture(surface: ZhangLeiSurface): void {
  const { id } = surface.structure
  if (id.includes('table-07')) stateDiningTable(surface)
  else if (id.includes('chair')) highBackedChair(surface)
  else if (id.includes('credenza')) credenza(surface)
  else if (id.includes('statue-stand')) statueAndStand(surface)
  else if (id.includes('pedestal-table')) pedestalTable(surface)
  else dressZhangLeiTableObjects(surface)
}
