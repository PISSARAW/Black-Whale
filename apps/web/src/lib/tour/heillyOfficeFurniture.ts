import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Space, Structure } from './types'
import {
  CHROME,
  FAMICOM_CREAM,
  FAMICOM_RED,
  LEATHER_BLACK,
  MONITOR_CASE,
  SFAMICOM_DARK,
  SFAMICOM_GREY,
  STEEL_DARK,
  WOOD_MAFIA,
} from './heillyHideoutDetailSurface'

export interface OfficeContext {
  into: BanquetDetailBuilder
  floor: number
  ceilingHeight: number
  space: Space
  structures: Structure[]
}

function leadersDesk(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [w, d] = structure.size
  const h = structure.height

  // Solid executive wooden desk top
  into.box([w, 0.08, d], {
    at: [x, floor + h - 0.04, z],
    colour: WOOD_MAFIA,
  })
  // Left and right drawer pedestals
  const pedW = 0.85
  into.box([pedW, h - 0.08, d - 0.1], {
    at: [x - w / 2 + pedW / 2 + 0.1, floor + (h - 0.08) / 2, z],
    colour: 0x2e1e16,
  })
  into.box([pedW, h - 0.08, d - 0.1], {
    at: [x + w / 2 - pedW / 2 - 0.1, floor + (h - 0.08) / 2, z],
    colour: 0x2e1e16,
  })
  // Modesty panel
  into.box([w - 0.3, h - 0.2, 0.04], {
    at: [x, floor + (h - 0.1) / 2, z + d / 2 - 0.08],
    colour: 0x332219,
  })
  // Desk accessories: documents, desk pad, lamp
  into.box([1.1, 0.015, 0.65], {
    at: [x, floor + h + 0.008, z],
    colour: 0x1a1a1c,
  })
  into.box([0.3, 0.03, 0.22], {
    at: [x - 0.8, floor + h + 0.02, z],
    colour: 0xded8c6,
  })
  // Brass desk lamp
  into.cylinder({ radius: 0.07, height: 0.02, sides: 12 }, { at: [x + 1.2, floor + h + 0.01, z - 0.2], colour: 0xb59c6b })
  into.cylinder({ radius: 0.015, height: 0.35, sides: 10 }, { at: [x + 1.2, floor + h + 0.18, z - 0.2], colour: 0xb59c6b })
  into.sphere([0.09, 0.06, 0.09], { at: [x + 1.15, floor + h + 0.36, z - 0.15], colour: 0x2e5c3e })
}

function cardNegotiationTable(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [w, d] = structure.size
  const h = structure.height

  // Negotiation game table top in dark wood
  into.box([w, 0.06, d], {
    at: [x, floor + h - 0.03, z],
    colour: 0x2a221b,
  })
  // Dark felt playing surface inset
  into.box([w - 0.14, 0.01, d - 0.14], {
    at: [x, floor + h + 0.005, z],
    colour: 0x223528,
  })
  // Wooden tapered legs
  for (const dx of [-w / 2 + 0.1, w / 2 - 0.1]) {
    for (const dz of [-d / 2 + 0.1, d / 2 - 0.1]) {
      into.cylinder(
        { radius: 0.035, height: h - 0.06, sides: 12 },
        { at: [x + dx, floor + (h - 0.06) / 2, z + dz], colour: 0x1f1813 },
      )
    }
  }
  // Playing cards dealt across the table
  into.box([0.18, 0.01, 0.26], {
    at: [x - 0.25, floor + h + 0.015, z],
    colour: 0xf5f0e1,
  })
  into.box([0.18, 0.01, 0.26], {
    at: [x + 0.25, floor + h + 0.015, z],
    colour: 0xf5f0e1,
  })
  // Deck stack
  into.box([0.1, 0.035, 0.14], {
    at: [x, floor + h + 0.025, z],
    colour: 0x8a2328,
  })
}

function executiveChair(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const seatY = floor + 0.48

  // Base with caster hub
  into.cylinder({ radius: 0.06, height: 0.35, sides: 10 }, { at: [x, floor + 0.2, z], colour: CHROME })
  into.cylinder({ radius: 0.3, height: 0.05, sides: 10 }, { at: [x, floor + 0.06, z], colour: STEEL_DARK })
  // Thick leather seat
  into.box([0.58, 0.12, 0.56], {
    at: [x, seatY, z],
    colour: LEATHER_BLACK,
  })
  // High backrest with headrest
  into.box([0.54, 0.65, 0.1], {
    at: [x, seatY + 0.36, z - 0.24],
    colour: LEATHER_BLACK,
  })
  // Padded armrests
  into.box([0.08, 0.04, 0.36], { at: [x - 0.3, seatY + 0.22, z], colour: LEATHER_BLACK })
  into.box([0.08, 0.04, 0.36], { at: [x + 0.3, seatY + 0.22, z], colour: LEATHER_BLACK })
}

function televisionConsole(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [w, d] = structure.size
  const h = structure.height

  // Low credenza stand
  into.box([w, h, d], {
    at: [x, floor + h / 2, z],
    colour: 0x1c1d20,
  })
  // Open lower equipment shelves
  into.box([w - 0.16, 0.3, d - 0.08], {
    at: [x, floor + 0.4, z + 0.04],
    colour: 0x121417,
  })

  // Large dark television resting on the stand (Ch. 407 behind Morena)
  const tvW = 2.2
  const tvH = 1.35
  const tvY = floor + h + tvH / 2
  // TV housing / frame
  into.box([tvW, tvH, 0.22], {
    at: [x, tvY, z],
    colour: MONITOR_CASE,
  })
  // TV dark screen glass
  into.box([tvW - 0.14, tvH - 0.14, 0.04], {
    at: [x, tvY, z - 0.1],
    colour: 0x101215,
  })
  // TV pedestal base
  into.box([0.7, 0.06, 0.38], {
    at: [x, floor + h + 0.03, z],
    colour: STEEL_DARK,
  })
}

function famicomConsole(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const y = floor + structure.base

  // Cream main body
  into.box([0.34, 0.1, 0.28], {
    at: [x, y + 0.05, z],
    colour: FAMICOM_CREAM,
  })
  // Red top plate and cartridge bay
  into.box([0.26, 0.03, 0.18], {
    at: [x, y + 0.11, z],
    colour: FAMICOM_RED,
  })
  // Inserted game cartridge
  into.box([0.16, 0.08, 0.03], {
    at: [x, y + 0.15, z],
    colour: 0x9e2a2b,
  })
  // Two docked side controllers
  into.box([0.04, 0.05, 0.16], {
    at: [x - 0.18, y + 0.05, z],
    colour: FAMICOM_RED,
  })
  into.box([0.04, 0.05, 0.16], {
    at: [x + 0.18, y + 0.05, z],
    colour: FAMICOM_RED,
  })
}

function superFamicomConsole(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const y = floor + structure.base

  // Grey contoured body
  into.box([0.36, 0.11, 0.32], {
    at: [x, y + 0.055, z],
    colour: SFAMICOM_GREY,
  })
  // Dark grey central depression and cartridge bay
  into.box([0.24, 0.04, 0.16], {
    at: [x, y + 0.11, z - 0.02],
    colour: SFAMICOM_DARK,
  })
  // Super Famicom cartridge
  into.box([0.2, 0.09, 0.04], {
    at: [x, y + 0.15, z - 0.02],
    colour: 0x8a8e96,
  })
  // Power and reset sliders
  into.box([0.05, 0.025, 0.04], { at: [x - 0.11, y + 0.115, z + 0.09], colour: SFAMICOM_DARK })
  into.box([0.05, 0.025, 0.04], { at: [x + 0.11, y + 0.115, z + 0.09], colour: SFAMICOM_DARK })
}

function officeCouch(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [w, d] = structure.size
  const h = structure.height

  // Padded leather wall couch
  into.box([w, 0.42, d], {
    at: [x, floor + 0.21, z],
    colour: LEATHER_BLACK,
  })
  into.box([0.24, h - 0.2, d], {
    at: [x - w / 2 + 0.12, floor + 0.3 + (h - 0.2) / 2, z],
    colour: LEATHER_BLACK,
  })
  into.box([w, 0.24, 0.16], { at: [x, floor + 0.44, z - d / 2 + 0.08], colour: LEATHER_BLACK })
  into.box([w, 0.24, 0.16], { at: [x, floor + 0.44, z + d / 2 - 0.08], colour: LEATHER_BLACK })
}

export function dressHeillyOffice(context: OfficeContext): void {
  const { into, floor, structures } = context

  // 1. Leader's desk
  const desk = structures.find((s) => s.id.includes('desk'))
  if (desk) {
    leadersDesk(into, desk, floor)
  }

  // 2. Card negotiation table
  const cardTable = structures.find((s) => s.id.includes('card-table'))
  if (cardTable) {
    cardNegotiationTable(into, cardTable, floor)
  }

  // 3. Morena's dealer chair & guest chair
  const dealerChair = structures.find((s) => s.id.includes('dealer-chair'))
  if (dealerChair) {
    executiveChair(into, dealerChair, floor)
  }
  const guestChair = structures.find((s) => s.id.includes('guest-chair'))
  if (guestChair) {
    executiveChair(into, guestChair, floor)
  }

  // 4. Television credenza and screen
  const consoleUnit = structures.find((s) => s.id.includes('console') && !s.id.includes('famicom'))
  if (consoleUnit) {
    televisionConsole(into, consoleUnit, floor)
  }

  // 5. Famicom & Super Famicom
  const famicom = structures.find((s) => s.id.includes('-famicom') && !s.id.includes('super'))
  if (famicom) {
    famicomConsole(into, famicom, floor)
  }
  const superFamicom = structures.find((s) => s.id.includes('super-famicom'))
  if (superFamicom) {
    superFamicomConsole(into, superFamicom, floor)
  }

  // 6. Office wall couch
  const couch = structures.find((s) => s.id.includes('office-couch'))
  if (couch) {
    officeCouch(into, couch, floor)
  }
}
