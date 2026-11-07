import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  ARCHIVE_BOX,
  BLANKET_CHARCOAL,
  BLANKET_OLIVE,
  BRASS_ACCENT,
  BUNK_STEEL_TUBE,
  CCTV_GLOW_BLUE,
  CCTV_GLOW_GREEN,
  CCTV_SCREEN_FRAME,
  CHROME_BRIGHT,
  CRATE_WOOD,
  EMBLEM_BORDER,
  EMBLEM_BRONZE,
  EMBLEM_GOLD,
  EMBLEM_LACQUER_DARK,
  LED_RECORDING_RED,
  MATTRESS_FOAM,
  MONITOR_HOUSING,
  OFFICE_DESK_MAHOGANY,
  OFFICE_WOOD_DARK,
  PILLOW_WHITE,
  RACK_CABINET,
  SHELF_WOOD,
  SPOTLIGHT_WARM,
  STEEL_DARK,
  STEEL_GRAPHITE,
} from './chaROfficeDetailSurface'
import type { Vec2 } from './types'

export interface FurniturePlacement {
  into: BanquetDetailBuilder
  floor: number
  at: Vec2
}

/** The large Cha-R clan wall emblem plaque mounted on the north wall. */
export function dressChaREmblem(placement: FurniturePlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at
  const cy = floor + 2.2

  // Dark lacquered backing panel with mahogany trim
  into.box([4.8, 2.2, 0.08], { at: [x, cy, z], colour: EMBLEM_LACQUER_DARK })
  into.box([5.0, 0.1, 0.12], { at: [x, cy + 1.1, z], colour: EMBLEM_BORDER })
  into.box([5.0, 0.1, 0.12], { at: [x, cy - 1.1, z], colour: EMBLEM_BORDER })
  into.box([0.1, 2.3, 0.12], { at: [x - 2.45, cy, z], colour: EMBLEM_BORDER })
  into.box([0.1, 2.3, 0.12], { at: [x + 2.45, cy, z], colour: EMBLEM_BORDER })

  // Raised central diamond medallion representing the Cha-R clan crest
  into.box([1.4, 1.4, 0.06], {
    at: [x, cy, z - 0.04],
    colour: EMBLEM_BRONZE,
    rotation: [0, 0, Math.PI / 4],
  })
  into.box([1.0, 1.0, 0.08], {
    at: [x, cy, z - 0.06],
    colour: EMBLEM_GOLD,
    rotation: [0, 0, Math.PI / 4],
  })

  // Stylized character relief bars inside the crest
  into.box([0.65, 0.12, 0.1], { at: [x, cy + 0.22, z - 0.07], colour: EMBLEM_LACQUER_DARK })
  into.box([0.12, 0.55, 0.1], { at: [x, cy - 0.08, z - 0.07], colour: EMBLEM_LACQUER_DARK })
  into.box([0.48, 0.1, 0.1], { at: [x, cy - 0.28, z - 0.07], colour: EMBLEM_LACQUER_DARK })

  // Overhead spotlight casting a golden cone onto the emblem
  into.cylinder(
    { radius: 0.14, height: 0.16, sides: 12 },
    { at: [x, floor + 3.75, z - 0.45], colour: STEEL_DARK, rotation: [0.35, 0, 0] },
  )
  into.sphere([0.09, 0.09, 0.09], {
    at: [x, floor + 3.68, z - 0.42],
    colour: SPOTLIGHT_WARM,
    glow: true,
  })
}

/** The mafia executive command desk with paperwork, telephone and chairs. */
export function dressCommandDesk(placement: FurniturePlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Heavy mahogany tabletop & pedestals
  into.box([2.4, 0.08, 1.1], { at: [x, floor + 0.74, z], colour: OFFICE_DESK_MAHOGANY })
  into.box([0.5, 0.7, 1.0], { at: [x - 0.85, floor + 0.35, z], colour: OFFICE_WOOD_DARK })
  into.box([0.5, 0.7, 1.0], { at: [x + 0.85, floor + 0.35, z], colour: OFFICE_WOOD_DARK })
  into.box([1.2, 0.55, 0.04], { at: [x, floor + 0.42, z - 0.45], colour: OFFICE_WOOD_DARK })

  // Dark leather desk blotter
  into.box([1.1, 0.02, 0.65], { at: [x, floor + 0.79, z], colour: STEEL_GRAPHITE })

  // Rotary telephone and dossiers
  into.box([0.22, 0.08, 0.22], { at: [x - 0.75, floor + 0.82, z + 0.15], colour: STEEL_DARK })
  into.cylinder(
    { radius: 0.04, height: 0.24, sides: 8 },
    { at: [x - 0.75, floor + 0.88, z + 0.15], colour: STEEL_DARK, rotation: [0, 0, Math.PI / 2] },
  )
  into.box([0.32, 0.04, 0.42], { at: [x + 0.55, floor + 0.8, z + 0.1], colour: ARCHIVE_BOX })
  into.box([0.3, 0.03, 0.4], { at: [x + 0.52, floor + 0.84, z + 0.08], colour: CRATE_WOOD })

  // Gooseneck desk lamp
  into.cylinder(
    { radius: 0.08, height: 0.03, sides: 12 },
    { at: [x - 0.85, floor + 0.8, z - 0.25], colour: BRASS_ACCENT },
  )
  into.box([0.15, 0.12, 0.18], {
    at: [x - 0.75, floor + 1.1, z - 0.22],
    colour: BRASS_ACCENT,
    rotation: [0.3, 0.2, 0],
  })
  into.sphere([0.04, 0.04, 0.04], {
    at: [x - 0.73, floor + 1.05, z - 0.2],
    colour: SPOTLIGHT_WARM,
    glow: true,
  })

  // Executive high-back armchair behind the desk
  into.box([0.65, 0.08, 0.6], { at: [x, floor + 0.45, z + 0.8], colour: STEEL_DARK })
  into.box([0.6, 0.75, 0.1], { at: [x, floor + 0.85, z + 1.05], colour: STEEL_DARK })
  into.cylinder(
    { radius: 0.04, height: 0.4, sides: 8 },
    { at: [x, floor + 0.2, z + 0.8], colour: CHROME_BRIGHT },
  )

  // Two visitor armchairs facing the desk
  for (const vx of [x - 0.65, x + 0.65]) {
    into.box([0.52, 0.06, 0.5], { at: [vx, floor + 0.42, z - 0.95], colour: STEEL_GRAPHITE })
    into.box([0.5, 0.5, 0.08], { at: [vx, floor + 0.7, z - 1.18], colour: STEEL_GRAPHITE })
    into.box([0.05, 0.4, 0.05], { at: [vx - 0.22, floor + 0.2, z - 1.15], colour: OFFICE_WOOD_DARK })
    into.box([0.05, 0.4, 0.05], { at: [vx + 0.22, floor + 0.2, z - 1.15], colour: OFFICE_WOOD_DARK })
    into.box([0.05, 0.4, 0.05], { at: [vx - 0.22, floor + 0.2, z - 0.75], colour: OFFICE_WOOD_DARK })
    into.box([0.05, 0.4, 0.05], { at: [vx + 0.22, floor + 0.2, z - 0.75], colour: OFFICE_WOOD_DARK })
  }
}

/** Industrial steel double bunk bed with safety guardrail and mattress. */
export function dressBunkBed(placement: FurniturePlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Four vertical steel corner posts
  for (const dx of [-0.65, 0.65]) {
    for (const dz of [-0.95, 0.95]) {
      into.cylinder(
        { radius: 0.03, height: 2.1, sides: 8 },
        { at: [x + dx, floor + 1.05, z + dz], colour: BUNK_STEEL_TUBE },
      )
    }
  }

  // Lower bunk: bed frame, foam mattress, folded charcoal blanket, pillow
  into.box([1.3, 0.08, 1.9], { at: [x, floor + 0.38, z], colour: BUNK_STEEL_TUBE })
  into.box([1.2, 0.14, 1.8], { at: [x, floor + 0.49, z], colour: MATTRESS_FOAM })
  into.box([1.18, 0.06, 1.1], { at: [x, floor + 0.58, z - 0.3], colour: BLANKET_CHARCOAL })
  into.box([0.55, 0.1, 0.35], { at: [x, floor + 0.6, z + 0.65], colour: PILLOW_WHITE })

  // Upper bunk: bed frame, foam mattress, olive military blanket, pillow (Feitan's perch)
  into.box([1.3, 0.08, 1.9], { at: [x, floor + 1.45, z], colour: BUNK_STEEL_TUBE })
  into.box([1.2, 0.14, 1.8], { at: [x, floor + 1.56, z], colour: MATTRESS_FOAM })
  into.box([1.18, 0.08, 1.2], { at: [x, floor + 1.66, z - 0.25], colour: BLANKET_OLIVE })
  into.box([0.55, 0.1, 0.35], { at: [x, floor + 1.68, z + 0.65], colour: PILLOW_WHITE })

  // Upper safety guardrails along both sides
  into.box([0.03, 0.28, 1.5], { at: [x - 0.65, floor + 1.65, z - 0.15], colour: BUNK_STEEL_TUBE })
  into.box([0.03, 0.28, 1.5], { at: [x + 0.65, floor + 1.65, z - 0.15], colour: BUNK_STEEL_TUBE })

  // End ladder rungs for climbing to top bunk
  for (let rung = 0; rung < 4; rung++) {
    const ry = floor + 0.55 + rung * 0.35
    into.cylinder(
      { radius: 0.02, height: 0.5, sides: 8 },
      { at: [x, ry, z + 0.95], colour: BUNK_STEEL_TUBE, rotation: [0, 0, Math.PI / 2] },
    )
  }
}

/** Tall industrial shelving units loaded with archive boxes and cargo files. */
export function dressStorageShelves(placement: FurniturePlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Shelving framework (four tiers)
  into.box([0.75, 2.2, 4.4], { at: [x, floor + 1.1, z], colour: STEEL_DARK })
  for (let s = 0; s < 4; s++) {
    const sy = floor + 0.15 + s * 0.65
    into.box([0.72, 0.04, 4.35], { at: [x, sy, z], colour: SHELF_WOOD })

    // Stock on each shelf: archive boxes, cargo crates and binders
    for (let c = -1.7; c <= 1.7; c += 0.85) {
      const boxColor = (s + Math.floor(c * 2)) % 2 === 0 ? ARCHIVE_BOX : CRATE_WOOD
      into.box([0.5, 0.42, 0.65], { at: [x, sy + 0.23, z + c], colour: boxColor })
    }
  }
}

/** The extensive multi-screen CCTV surveillance bank covering Tier 5. */
export function dressCCTVMonitorBank(placement: FurniturePlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Large equipment rack casing (8m wide, 2.1m high)
  into.box([8.0, 2.1, 0.8], { at: [x, floor + 1.05, z], colour: RACK_CABINET })

  // 12 surveillance CRT screens in a 4-column x 3-row grid
  const cols = 4
  const rows = 3
  const colW = 1.75
  const rowH = 0.58
  const startX = x - ((cols - 1) * colW) / 2
  const startY = floor + 0.45

  for (let r = 0; r < rows; r++) {
    const my = startY + r * rowH
    for (let c = 0; c < cols; c++) {
      const mx = startX + c * colW
      // Monitor bezel
      into.box([1.55, 0.48, 0.08], { at: [mx, my, z + 0.42], colour: CCTV_SCREEN_FRAME })
      // Glowing phosphor surveillance screen (alternating green and blue tints)
      const glowColour = (r + c) % 2 === 0 ? CCTV_GLOW_GREEN : CCTV_GLOW_BLUE
      into.box([1.4, 0.38, 0.02], { at: [mx, my, z + 0.47], colour: glowColour, glow: true })
      // Blinking recording tally LED
      into.sphere([0.015, 0.015, 0.015], {
        at: [mx + 0.65, my - 0.18, z + 0.48],
        colour: LED_RECORDING_RED,
        glow: true,
      })
    }
  }

  // Under-monitor rack drawers / VCR tape recorder decks
  for (let b = -3; b <= 3; b += 2) {
    into.box([1.6, 0.25, 0.7], { at: [x + b, floor + 0.18, z + 0.05], colour: MONITOR_HOUSING })
  }
}

/** Operator surveillance watch desk with control console and monitors. */
export function dressWatchDesk(placement: FurniturePlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Operator desk table
  into.box([5.0, 0.08, 1.1], { at: [x, floor + 0.74, z], colour: STEEL_GRAPHITE })
  into.box([0.1, 0.7, 0.95], { at: [x - 2.35, floor + 0.35, z], colour: STEEL_DARK })
  into.box([0.1, 0.7, 0.95], { at: [x + 2.35, floor + 0.35, z], colour: STEEL_DARK })

  // Two operator desktop monitors angled toward the seat
  into.box([0.7, 0.45, 0.08], {
    at: [x - 0.8, floor + 1.05, z - 0.25],
    colour: CCTV_SCREEN_FRAME,
    rotation: [0, 0.18, 0],
  })
  into.box([0.62, 0.38, 0.02], {
    at: [x - 0.8, floor + 1.05, z - 0.21],
    colour: CCTV_GLOW_BLUE,
    rotation: [0, 0.18, 0],
    glow: true,
  })

  into.box([0.7, 0.45, 0.08], {
    at: [x + 0.8, floor + 1.05, z - 0.25],
    colour: CCTV_SCREEN_FRAME,
    rotation: [0, -0.18, 0],
  })
  into.box([0.62, 0.38, 0.02], {
    at: [x + 0.8, floor + 1.05, z - 0.21],
    colour: CCTV_GLOW_GREEN,
    rotation: [0, -0.18, 0],
    glow: true,
  })

  // Switcher keyboard & PTZ joystick unit
  into.box([0.85, 0.04, 0.25], { at: [x, floor + 0.8, z], colour: STEEL_DARK })
  into.box([0.22, 0.06, 0.18], { at: [x + 0.65, floor + 0.81, z], colour: STEEL_DARK })
  into.cylinder(
    { radius: 0.015, height: 0.12, sides: 6 },
    { at: [x + 0.65, floor + 0.89, z], colour: CHROME_BRIGHT },
  )

  // Swivel operator chair
  into.box([0.5, 0.06, 0.48], { at: [x, floor + 0.45, z + 0.65], colour: STEEL_GRAPHITE })
  into.box([0.48, 0.55, 0.08], { at: [x, floor + 0.72, z + 0.88], colour: STEEL_GRAPHITE })
  into.cylinder(
    { radius: 0.04, height: 0.4, sides: 8 },
    { at: [x, floor + 0.2, z + 0.65], colour: CHROME_BRIGHT },
  )
}
