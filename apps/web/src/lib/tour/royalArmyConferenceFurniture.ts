import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  ARMY_CHAIR_CUSHION,
  ARMY_CHAIR_LEATHER,
  ARMY_CHROME,
  ARMY_FOLDER,
  ARMY_GLASS,
  ARMY_LIGHT_STEEL,
  ARMY_MIC_LED,
  ARMY_MIC_STEM,
  ARMY_PAPER,
  ARMY_STEEL,
  ARMY_TABLE_CHAMFER,
  ARMY_TABLE_WOOD,
  drawAttendeePaper,
  drawDeskMicrophone,
  RoyalArmyConferenceSurface,
} from './royalArmyConferenceDetailSurface'
import type { Structure } from './types'

/** Dress the military briefing lectern (Chap. 380, p. 189). */
export function dressLectern(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  const surface = new RoyalArmyConferenceSurface({
    into,
    structure,
    floor,
    angle: 0, // Faces south (+Z) towards the audience
  })
  const w = 0.9
  const d = 0.85
  const h = structure.height // 1.1m

  // Base plinth / toe-kick
  surface.box([w * 0.9, 0.08, d * 0.9], [0, 0.04, 0], ARMY_STEEL)

  // Main column body (tapered look)
  surface.box([w * 0.8, h * 0.72, d * 0.75], [0, 0.44, 0], ARMY_TABLE_WOOD)
  // Metal side accent rails
  for (const side of [-1, 1]) {
    surface.box([0.04, h * 0.72, d * 0.77], [side * (w * 0.41), 0.44, 0], ARMY_LIGHT_STEEL)
  }

  // Front emblem panel / recessed face
  surface.box([w * 0.6, h * 0.5, 0.02], [0, 0.46, d * 0.38], ARMY_STEEL)

  // Angled desktop shelf: sloped top rising toward the north (speaker)
  surface.box([w, 0.05, d], [0, h - 0.02, 0], ARMY_TABLE_WOOD)
  surface.box([w + 0.02, 0.02, d + 0.02], [0, h, 0], ARMY_TABLE_CHAMFER)

  // Slanted bookrest / reading wedge
  surface.box([w * 0.85, 0.06, d * 0.7], [0, h + 0.04, -0.05], ARMY_TABLE_WOOD)
  // Paper-retaining lip
  surface.box([w * 0.85, 0.025, 0.03], [0, h + 0.06, 0.28], ARMY_LIGHT_STEEL)

  // Dual gooseneck conference microphones
  for (const offset of [-0.22, 0.22]) {
    surface.cylinder({ radius: 0.007, height: 0.26, sides: 8 }, [offset, h + 0.15, 0.1], ARMY_MIC_STEM)
    surface.cylinder({ radius: 0.014, height: 0.05, sides: 10 }, [offset, h + 0.28, 0.08], ARMY_STEEL)
    surface.sphere([0.015, 0.006, 0.015], [offset, h + 0.27, 0.08], { colour: ARMY_MIC_LED, glow: true })
  }

  // Briefing folder and speaker notes
  surface.box([0.38, 0.012, 0.3], [0, h + 0.08, -0.02], ARMY_FOLDER)
  surface.box([0.32, 0.01, 0.24], [0, h + 0.09, -0.02], ARMY_PAPER)
}

function chairStarBase(surface: RoyalArmyConferenceSurface): void {
  // 5-star wheeled base
  for (let i = 0; i < 5; i++) {
    const starAngle = (i * Math.PI * 2) / 5
    const dx = Math.sin(starAngle) * 0.28
    const dz = Math.cos(starAngle) * 0.28
    // Metal star arm
    surface.box([0.035, 0.025, 0.28], [dx * 0.5, 0.07, dz * 0.5], ARMY_CHROME)
    // Caster dual wheel
    surface.cylinder({ radius: 0.025, height: 0.03, sides: 8 }, [dx, 0.025, dz], ARMY_STEEL)
  }
}

function chairSeatAndBackrest(surface: RoyalArmyConferenceSurface, h: number): void {
  // Central column & height adjustment lever
  surface.cylinder({ radius: 0.028, height: 0.28, sides: 12 }, [0, 0.24, 0], ARMY_CHROME)
  surface.box([0.18, 0.04, 0.18], [0, 0.37, 0], ARMY_STEEL)

  // Seat cushion (wide ergonomic padded leather)
  surface.box([0.54, 0.08, 0.52], [0, 0.44, 0.02], ARMY_CHAIR_LEATHER)
  surface.sphere([0.24, 0.04, 0.23], [0, 0.48, 0.02], ARMY_CHAIR_CUSHION)

  // High executive backrest
  const backH = h - 0.48
  const backY = 0.48 + backH / 2
  surface.box([0.48, backH, 0.08], [0, backY, -0.22], ARMY_CHAIR_LEATHER)
  surface.sphere([0.22, backH * 0.42, 0.04], [0, backY, -0.19], ARMY_CHAIR_CUSHION)

  // Contoured headrest top
  surface.box([0.36, 0.12, 0.09], [0, h + 0.02, -0.22], ARMY_CHAIR_LEATHER)
}

function chairArmrests(surface: RoyalArmyConferenceSurface): void {
  // Curved loop armrests
  for (const side of [-1, 1]) {
    const x = side * 0.29
    // Upright metal post
    surface.box([0.025, 0.22, 0.04], [x, 0.54, 0], ARMY_CHROME)
    // Padded armrest top pad
    surface.box([0.05, 0.03, 0.3], [x, 0.65, 0], ARMY_CHAIR_LEATHER)
  }
}

function resolveChairAngle(structureId: string): number {
  const match = structureId.match(/chair-(\d+)$/)
  if (!match) return 0
  const num = parseInt(match[1], 10)
  if (num >= 1 && num <= 5) return 0 // Facing South (+Z) towards U-table interior and audience
  if (num >= 6 && num <= 9) return -Math.PI / 2 // Facing East (+X) towards port arm
  if (num >= 10 && num <= 13) return Math.PI / 2 // Facing West (-X) towards starboard arm
  return Math.PI // chair-14 & 15 facing North (-Z)
}

/** Dress one of the 15 executive conference chairs (Chap. 380, p. 189). */
export function dressConferenceChair(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  const angle = resolveChairAngle(structure.id)
  const surface = new RoyalArmyConferenceSurface({
    into,
    structure,
    floor,
    angle,
  })
  const h = structure.height // 1.05m

  chairStarBase(surface)
  chairSeatAndBackrest(surface, h)
  chairArmrests(surface)
}

function dressHeadTableAttendees(surface: RoyalArmyConferenceSurface): void {
  // 5 Attendees along head table (X from -2.8 to 2.8)
  const xPositions = [-2.8, -1.4, 0, 1.4, 2.8]
  for (const x of xPositions) {
    drawAttendeePaper(surface, [x, 0.76, -0.32])
    drawDeskMicrophone(surface, [x + 0.25, 0.76, -0.15])
    // Water glass tumbler
    surface.cylinder({ radius: 0.035, height: 0.1, sides: 12 }, [x - 0.25, 0.81, -0.15], ARMY_GLASS)
  }
}

function dressPortTableAttendees(surface: RoyalArmyConferenceSurface): void {
  // 4 Attendees along port arm (Y/Z from -1.35 to 1.35)
  const zPositions = [-1.35, -0.45, 0.45, 1.35]
  for (const z of zPositions) {
    drawAttendeePaper(surface, [-0.75, 0.76, z])
    drawDeskMicrophone(surface, [-0.45, 0.76, z + 0.15])
    surface.cylinder({ radius: 0.035, height: 0.1, sides: 12 }, [-0.45, 0.81, z - 0.15], ARMY_GLASS)
  }
}

function dressStarboardTableAttendees(surface: RoyalArmyConferenceSurface): void {
  // 4 Attendees along starboard arm (Y/Z from -1.35 to 1.35)
  const zPositions = [-1.35, -0.45, 0.45, 1.35]
  for (const z of zPositions) {
    drawAttendeePaper(surface, [0.75, 0.76, z])
    drawDeskMicrophone(surface, [0.45, 0.76, z + 0.15])
    surface.cylinder({ radius: 0.035, height: 0.1, sides: 12 }, [0.45, 0.81, z - 0.15], ARMY_GLASS)
  }
}

function tableSupports(surface: RoyalArmyConferenceSurface, w: number, d: number): void {
  // Heavy structural square legs with floor levellers
  const halfW = w / 2 - 0.2
  const halfD = d / 2 - 0.2
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      surface.box([0.08, 0.7, 0.08], [sx * halfW, 0.35, sz * halfD], ARMY_STEEL)
      surface.box([0.12, 0.02, 0.12], [sx * halfW, 0.01, sz * halfD], ARMY_LIGHT_STEEL)
    }
  }
  // Modesty skirt panel
  surface.box([w - 0.35, 0.42, 0.03], [0, 0.48, 0], ARMY_STEEL)
}

/** Dress one of the 3 U-table sections (head, port arm, starboard arm). */
export function dressConferenceTable(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  const surface = new RoyalArmyConferenceSurface({ into, structure, floor, angle: 0 })
  const w = structure.size[0]
  const d = structure.size[1]
  const h = structure.height // 0.75m

  // Solid conference tabletop in dark walnut
  surface.box([w, 0.05, d], [0, h - 0.025, 0], ARMY_TABLE_WOOD)
  surface.box([w + 0.02, 0.015, d + 0.02], [0, h - 0.0075, 0], ARMY_TABLE_CHAMFER)

  // Central cable access raceway & brushed aluminium grommet cover
  if (w > d) {
    surface.box([w * 0.7, 0.005, 0.14], [0, h + 0.002, 0], ARMY_LIGHT_STEEL)
  } else {
    surface.box([0.14, 0.005, d * 0.7], [0, h + 0.002, 0], ARMY_LIGHT_STEEL)
  }

  tableSupports(surface, w, d)

  // Populate attendee gear depending on section
  if (structure.id.endsWith('table-head')) {
    dressHeadTableAttendees(surface)
  } else if (structure.id.endsWith('table-port')) {
    dressPortTableAttendees(surface)
  } else if (structure.id.endsWith('table-starboard')) {
    dressStarboardTableAttendees(surface)
  }
}
