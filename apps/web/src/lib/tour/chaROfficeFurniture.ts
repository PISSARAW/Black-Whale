import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  ARCHIVE_BOX,
  ASH_TRAY_BRASS,
  BLANKET_CHARCOAL,
  BLANKET_OLIVE,
  BRASS_ACCENT,
  BUNK_STEEL_TUBE,
  CHROME_BRIGHT,
  CRATE_WOOD,
  DOSSIER_MANILA,
  EMBER_ORANGE,
  EMBLEM_BORDER,
  EMBLEM_BRONZE,
  EMBLEM_GOLD,
  EMBLEM_LACQUER_DARK,
  GLASS_CLEAR,
  LEATHER_DARK,
  LIQUOR_AMBER,
  LOCKER_STEEL,
  MATTRESS_FOAM,
  OFFICE_DESK_MAHOGANY,
  OFFICE_WOOD_DARK,
  PAPER_CREAM,
  PILLOW_WHITE,
  SHELF_WOOD,
  SPOTLIGHT_WARM,
  STEEL_BRUSHED,
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

  // Multi-tier dark lacquered backing panel with beveled perimeter framing
  into.box([5.0, 2.3, 0.08], { at: [x, cy, z], colour: EMBLEM_LACQUER_DARK })
  into.box([5.16, 0.1, 0.12], { at: [x, cy + 1.15, z], colour: EMBLEM_BORDER })
  into.box([5.16, 0.1, 0.12], { at: [x, cy - 1.15, z], colour: EMBLEM_BORDER })
  into.box([0.1, 2.4, 0.12], { at: [x - 2.53, cy, z], colour: EMBLEM_BORDER })
  into.box([0.1, 2.4, 0.12], { at: [x + 2.53, cy, z], colour: EMBLEM_BORDER })

  // Polished brass ornamental corner brackets
  for (const dx of [-2.45, 2.45]) {
    for (const dy of [-1.08, 1.08]) {
      into.box([0.22, 0.22, 0.13], { at: [x + dx, cy + dy, z], colour: BRASS_ACCENT })
    }
  }

  // Raised central diamond medallion representing the Cha-R clan crest
  into.box([1.45, 1.45, 0.06], {
    at: [x, cy, z - 0.04],
    colour: EMBLEM_BRONZE,
    rotation: [0, 0, Math.PI / 4],
  })
  into.box([1.05, 1.05, 0.08], {
    at: [x, cy, z - 0.06],
    colour: EMBLEM_GOLD,
    rotation: [0, 0, Math.PI / 4],
  })

  // Stylized character relief bars inside the crest
  into.box([0.7, 0.12, 0.1], { at: [x, cy + 0.22, z - 0.07], colour: EMBLEM_LACQUER_DARK })
  into.box([0.12, 0.58, 0.1], { at: [x, cy - 0.08, z - 0.07], colour: EMBLEM_LACQUER_DARK })
  into.box([0.5, 0.1, 0.1], { at: [x, cy - 0.28, z - 0.07], colour: EMBLEM_LACQUER_DARK })

  // Dual overhead spotlights casting golden light cones onto the emblem
  for (const sx of [-1.5, 1.5]) {
    into.cylinder(
      { radius: 0.14, height: 0.16, sides: 12 },
      { at: [x + sx, floor + 3.75, z - 0.45], colour: STEEL_DARK, rotation: [0.35, 0, 0] },
    )
    into.sphere([0.09, 0.09, 0.09], {
      at: [x + sx, floor + 3.68, z - 0.42],
      colour: SPOTLIGHT_WARM,
      glow: true,
    })
  }
}

function deskAccessories(into: BanquetDetailBuilder, top: { x: number; y: number; z: number }): void {
  const { x, y, z } = top

  // Dark stitched leather desk blotter
  into.box([1.2, 0.02, 0.7], { at: [x, y + 0.01, z], colour: LEATHER_DARK })
  into.box([1.24, 0.025, 0.03], { at: [x, y + 0.015, z - 0.35], colour: BRASS_ACCENT })

  // Heavy rotary telephone
  into.box([0.22, 0.08, 0.22], { at: [x - 0.78, y + 0.04, z + 0.15], colour: STEEL_DARK })
  into.cylinder(
    { radius: 0.04, height: 0.24, sides: 8 },
    { at: [x - 0.78, y + 0.1, z + 0.15], colour: STEEL_DARK, rotation: [0, 0, Math.PI / 2] },
  )

  // Paperwork and manila dossiers
  into.box([0.34, 0.04, 0.44], { at: [x + 0.62, y + 0.02, z + 0.1], colour: DOSSIER_MANILA })
  into.box([0.28, 0.02, 0.38], { at: [x + 0.6, y + 0.05, z + 0.08], colour: PAPER_CREAM })

  // Brass ashtray with lit cigarette and glowing ember
  into.cylinder({ radius: 0.065, height: 0.025, sides: 12 }, { at: [x - 0.42, y + 0.02, z - 0.22], colour: ASH_TRAY_BRASS })
  into.cylinder(
    { radius: 0.006, height: 0.06, sides: 6 },
    { at: [x - 0.42, y + 0.035, z - 0.22], colour: PAPER_CREAM, rotation: [0.2, 0, 0.3] },
  )
  into.sphere([0.008, 0.008, 0.008], { at: [x - 0.44, y + 0.045, z - 0.23], colour: EMBER_ORANGE, glow: true })

  // Whiskey decanter and lowball tumblers on silver tray
  into.box([0.42, 0.02, 0.28], { at: [x + 0.75, y + 0.02, z - 0.22], colour: CHROME_BRIGHT })
  into.box([0.12, 0.22, 0.12], { at: [x + 0.72, y + 0.13, z - 0.22], colour: GLASS_CLEAR })
  into.box([0.1, 0.12, 0.1], { at: [x + 0.72, y + 0.08, z - 0.22], colour: LIQUOR_AMBER })
  into.cylinder({ radius: 0.035, height: 0.07, sides: 8 }, { at: [x + 0.84, y + 0.05, z - 0.22], colour: GLASS_CLEAR })

  // Brass banker's desk lamp
  into.cylinder({ radius: 0.08, height: 0.03, sides: 12 }, { at: [x - 0.85, y + 0.02, z - 0.25], colour: BRASS_ACCENT })
  into.box([0.16, 0.12, 0.2], {
    at: [x - 0.75, y + 0.32, z - 0.22],
    colour: BRASS_ACCENT,
    rotation: [0.3, 0.2, 0],
  })
  into.sphere([0.045, 0.045, 0.045], { at: [x - 0.73, y + 0.28, z - 0.2], colour: SPOTLIGHT_WARM, glow: true })
}

function deskSeating(into: BanquetDetailBuilder, floor: number, at: Vec2): void {
  const [x, z] = at

  // Executive high-back tufted leather armchair
  into.box([0.68, 0.1, 0.62], { at: [x, floor + 0.46, z + 0.82], colour: LEATHER_DARK })
  into.box([0.64, 0.8, 0.12], { at: [x, floor + 0.88, z + 1.08], colour: LEATHER_DARK })
  into.box([0.08, 0.22, 0.48], { at: [x - 0.32, floor + 0.62, z + 0.82], colour: LEATHER_DARK })
  into.box([0.08, 0.22, 0.48], { at: [x + 0.32, floor + 0.62, z + 0.82], colour: LEATHER_DARK })
  into.cylinder({ radius: 0.045, height: 0.42, sides: 8 }, { at: [x, floor + 0.21, z + 0.82], colour: CHROME_BRIGHT })

  // Two visitor armchairs facing the command desk
  for (const vx of [x - 0.7, x + 0.7]) {
    into.box([0.54, 0.07, 0.52], { at: [vx, floor + 0.44, z - 0.98], colour: STEEL_GRAPHITE })
    into.box([0.52, 0.54, 0.09], { at: [vx, floor + 0.72, z - 1.22], colour: STEEL_GRAPHITE })
    for (const legX of [-0.23, 0.23]) {
      for (const legZ of [-1.18, -0.78]) {
        into.box([0.05, 0.42, 0.05], { at: [vx + legX, floor + 0.21, z + legZ], colour: OFFICE_WOOD_DARK })
      }
    }
  }
}

/** The mafia executive command desk with paperwork, telephone and seating. */
export function dressCommandDesk(placement: FurniturePlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Heavy mahogany tabletop (2.5m x 1.15m) & pedestals
  into.box([2.5, 0.08, 1.15], { at: [x, floor + 0.74, z], colour: OFFICE_DESK_MAHOGANY })
  into.box([0.54, 0.7, 1.05], { at: [x - 0.9, floor + 0.35, z], colour: OFFICE_WOOD_DARK })
  into.box([0.54, 0.7, 1.05], { at: [x + 0.9, floor + 0.35, z], colour: OFFICE_WOOD_DARK })
  into.box([1.26, 0.55, 0.04], { at: [x, floor + 0.42, z - 0.48], colour: OFFICE_WOOD_DARK })

  // Pedestal brass drawer handles
  for (const px of [x - 0.9, x + 0.9]) {
    for (let d = 0; d < 3; d++) {
      into.box([0.14, 0.03, 0.03], { at: [px, floor + 0.2 + d * 0.2, z + 0.54], colour: BRASS_ACCENT })
    }
  }

  deskAccessories(into, { x, y: floor + 0.78, z })
  deskSeating(into, floor, at)
}

/** Industrial steel double bunk bed with safety guardrail and mattress. */
export function dressBunkBed(placement: FurniturePlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Four vertical steel corner posts
  for (const dx of [-0.65, 0.65]) {
    for (const dz of [-0.98, 0.98]) {
      into.cylinder(
        { radius: 0.035, height: 2.15, sides: 8 },
        { at: [x + dx, floor + 1.075, z + dz], colour: BUNK_STEEL_TUBE },
      )
    }
  }

  // Lower bunk: bed frame, foam mattress, folded charcoal blanket, pillow
  into.box([1.32, 0.08, 1.96], { at: [x, floor + 0.38, z], colour: BUNK_STEEL_TUBE })
  into.box([1.22, 0.14, 1.84], { at: [x, floor + 0.49, z], colour: MATTRESS_FOAM })
  into.box([1.2, 0.06, 1.15], { at: [x, floor + 0.58, z - 0.3], colour: BLANKET_CHARCOAL })
  into.box([0.58, 0.1, 0.36], { at: [x, floor + 0.6, z + 0.65], colour: PILLOW_WHITE })

  // Upper bunk: bed frame, foam mattress, olive military blanket, pillow (Feitan's perch)
  into.box([1.32, 0.08, 1.96], { at: [x, floor + 1.48, z], colour: BUNK_STEEL_TUBE })
  into.box([1.22, 0.14, 1.84], { at: [x, floor + 1.59, z], colour: MATTRESS_FOAM })
  into.box([1.2, 0.08, 1.25], { at: [x, floor + 1.69, z - 0.25], colour: BLANKET_OLIVE })
  into.box([0.58, 0.1, 0.36], { at: [x, floor + 1.71, z + 0.65], colour: PILLOW_WHITE })

  // Upper safety guardrails along both sides
  into.box([0.03, 0.28, 1.55], { at: [x - 0.65, floor + 1.68, z - 0.15], colour: BUNK_STEEL_TUBE })
  into.box([0.03, 0.28, 1.55], { at: [x + 0.65, floor + 1.68, z - 0.15], colour: BUNK_STEEL_TUBE })

  // End ladder rungs for climbing to top bunk
  for (let rung = 0; rung < 4; rung++) {
    const ry = floor + 0.55 + rung * 0.35
    into.cylinder(
      { radius: 0.02, height: 0.52, sides: 8 },
      { at: [x, ry, z + 0.98], colour: BUNK_STEEL_TUBE, rotation: [0, 0, Math.PI / 2] },
    )
  }
}

/** Tall industrial shelving units loaded with archive boxes, crates and contraband. */
export function dressStorageShelves(placement: FurniturePlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Shelving framework (four tiers, 4.4m long)
  into.box([0.76, 2.3, 4.4], { at: [x, floor + 1.15, z], colour: STEEL_DARK })

  // Rear diagonal X-braces
  into.box([0.04, 2.2, 0.05], { at: [x - 0.36, floor + 1.15, z], colour: STEEL_BRUSHED, rotation: [0.45, 0, 0] })
  into.box([0.04, 2.2, 0.05], { at: [x - 0.36, floor + 1.15, z], colour: STEEL_BRUSHED, rotation: [-0.45, 0, 0] })

  for (let s = 0; s < 4; s++) {
    const sy = floor + 0.18 + s * 0.66
    into.box([0.74, 0.04, 4.36], { at: [x, sy, z], colour: SHELF_WOOD })

    // Stock on each shelf: archive boxes, cargo crates and contraband containers
    for (let c = -1.7; c <= 1.7; c += 0.85) {
      const boxColor = (s + Math.floor(c * 2)) % 2 === 0 ? ARCHIVE_BOX : CRATE_WOOD
      into.box([0.52, 0.44, 0.68], { at: [x, sy + 0.24, z + c], colour: boxColor })
    }
  }
}

/** Steel personal lockers along the bedroom wall. */
export function dressLockers(placement: FurniturePlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Locker block: 4 adjacent steel lockers (2.4m wide, 1.9m tall, 0.55m deep)
  into.box([0.55, 1.9, 2.4], { at: [x, floor + 0.95, z], colour: LOCKER_STEEL })

  for (let i = 0; i < 4; i++) {
    const lz = z - 0.9 + i * 0.6
    // Locker door seam and louvers
    into.box([0.02, 1.84, 0.02], { at: [x + 0.28, floor + 0.95, lz - 0.28], colour: STEEL_DARK })
    into.box([0.02, 0.02, 0.44], { at: [x + 0.28, floor + 1.75, lz], colour: STEEL_DARK })
    into.box([0.02, 0.02, 0.44], { at: [x + 0.28, floor + 1.7, lz], colour: STEEL_DARK })
    // Recessed lock hasp & handle
    into.box([0.04, 0.12, 0.04], { at: [x + 0.29, floor + 1.05, lz + 0.2], colour: CHROME_BRIGHT })
  }
}
