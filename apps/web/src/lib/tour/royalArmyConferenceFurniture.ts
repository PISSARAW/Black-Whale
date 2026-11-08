import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import {
  ARMY_BLOTTER_LEATHER,
  ARMY_CHAIR_CUSHION,
  ARMY_CHAIR_LEATHER,
  ARMY_CHROME,
  ARMY_FOLDER,
  ARMY_GLASS,
  ARMY_GLOW_LIGHT,
  ARMY_GOLD_CREST,
  ARMY_LIGHT_STEEL,
  ARMY_MIC_LED,
  ARMY_MIC_STEM,
  ARMY_PAPER,
  ARMY_SCREEN_TACTICAL_CYAN,
  ARMY_STEEL,
  ARMY_TABLE_CHAMFER,
  ARMY_TABLE_WOOD,
  drawDelegateNameplate,
  drawDeskMicrophone,
  drawDossierWithStripe,
  RoyalArmyConferenceSurface,
} from './royalArmyConferenceDetailSurface'
import type { Structure } from './types'

function lecternUpperHardware(surface: RoyalArmyConferenceSurface, h: number): void {
  // Angled desktop shelf: sloped top rising toward the north (speaker)
  surface.box([0.9, 0.05, 0.85], [0, h - 0.02, 0], ARMY_TABLE_WOOD)
  surface.box([0.92, 0.02, 0.87], [0, h, 0], ARMY_TABLE_CHAMFER)

  // Slanted bookrest / reading wedge
  surface.box([0.85, 0.06, 0.65], [0, h + 0.04, -0.05], ARMY_TABLE_WOOD)
  // Paper-retaining lip in brushed aluminum
  surface.box([0.85, 0.025, 0.03], [0, h + 0.06, 0.26], ARMY_LIGHT_STEEL)

  // Recessed presenter preview touchscreen monitor (showing tactical telemetry)
  surface.box([0.34, 0.02, 0.22], [-0.22, h + 0.06, -0.05], ARMY_STEEL)
  surface.box([0.31, 0.025, 0.19], [-0.22, h + 0.06, -0.05], {
    colour: ARMY_SCREEN_TACTICAL_CYAN,
    glow: true,
  })

  // Flexible gooseneck LED reading task light
  surface.cylinder(
    { radius: 0.006, height: 0.28, sides: 8 },
    [0.36, h + 0.15, -0.15],
    ARMY_MIC_STEM,
  )
  surface.box([0.14, 0.025, 0.05], [0.36, h + 0.28, -0.08], ARMY_STEEL)
  surface.box([0.12, 0.015, 0.04], [0.36, h + 0.27, -0.08], { colour: ARMY_GLOW_LIGHT, glow: true })

  // Dual shock-mounted gooseneck conference microphones
  for (const offset of [-0.08, 0.08]) {
    surface.cylinder(
      { radius: 0.007, height: 0.26, sides: 8 },
      [offset, h + 0.15, 0.1],
      ARMY_MIC_STEM,
    )
    surface.cylinder(
      { radius: 0.014, height: 0.05, sides: 10 },
      [offset, h + 0.28, 0.08],
      ARMY_STEEL,
    )
    surface.sphere([0.015, 0.006, 0.015], [offset, h + 0.27, 0.08], {
      colour: ARMY_MIC_LED,
      glow: true,
    })
  }

  // Briefing folder and speaker order notes
  surface.box([0.32, 0.012, 0.26], [0.18, h + 0.06, 0.08], ARMY_FOLDER)
  surface.box([0.28, 0.01, 0.22], [0.18, h + 0.07, 0.08], ARMY_PAPER)
  // Laser presentation remote clicker
  surface.box([0.035, 0.018, 0.12], [0.02, h + 0.06, 0.18], ARMY_STEEL)
}

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

  // Front emblem panel & Kakin army gold medallion
  surface.box([w * 0.65, h * 0.52, 0.02], [0, 0.46, d * 0.38], ARMY_STEEL)
  surface.cylinder({ radius: 0.12, height: 0.015, sides: 16 }, [0, 0.52, d * 0.39], {
    colour: ARMY_GOLD_CREST,
    rotation: [Math.PI / 2, 0, 0],
  })

  lecternUpperHardware(surface, h)
}

function chairStarBase(surface: RoyalArmyConferenceSurface): void {
  // 5-star polished chrome wheeled base
  for (let i = 0; i < 5; i++) {
    const starAngle = (i * Math.PI * 2) / 5
    const dx = Math.sin(starAngle) * 0.28
    const dz = Math.cos(starAngle) * 0.28
    surface.box([0.035, 0.025, 0.28], [dx * 0.5, 0.07, dz * 0.5], ARMY_CHROME)
    // Caster dual wheel
    surface.cylinder({ radius: 0.025, height: 0.03, sides: 8 }, [dx, 0.025, dz], ARMY_STEEL)
  }
}

function chairSeatAndBackrest(surface: RoyalArmyConferenceSurface, h: number): void {
  // Central pneumatic column with control paddles
  surface.cylinder({ radius: 0.028, height: 0.28, sides: 12 }, [0, 0.24, 0], ARMY_CHROME)
  surface.box([0.18, 0.04, 0.18], [0, 0.37, 0], ARMY_STEEL)
  // Pneumatic lift lever and tilt lock paddle
  surface.cylinder({ radius: 0.007, height: 0.14, sides: 6 }, [-0.15, 0.37, 0], {
    colour: ARMY_CHROME,
    rotation: [0, 0, Math.PI / 2],
  })
  surface.cylinder({ radius: 0.007, height: 0.14, sides: 6 }, [0.15, 0.37, 0], {
    colour: ARMY_CHROME,
    rotation: [0, 0, Math.PI / 2],
  })

  // Deep ergonomic padded leather seat cushion
  surface.box([0.56, 0.08, 0.54], [0, 0.44, 0.02], ARMY_CHAIR_LEATHER)
  surface.sphere([0.25, 0.04, 0.24], [0, 0.48, 0.02], ARMY_CHAIR_CUSHION)

  // Segmented executive backrest with lumbar bolster
  const backH = h - 0.48
  const backY = 0.48 + backH / 2
  surface.box([0.5, backH, 0.08], [0, backY, -0.22], ARMY_CHAIR_LEATHER)
  // Lumbar bolster pad
  surface.sphere([0.22, 0.14, 0.04], [0, 0.65, -0.19], ARMY_CHAIR_CUSHION)
  // Upper back support pad
  surface.sphere([0.22, 0.16, 0.04], [0, backY + 0.12, -0.19], ARMY_CHAIR_CUSHION)

  // Contoured ergonomic headrest pillow
  surface.box([0.38, 0.14, 0.09], [0, h + 0.03, -0.22], ARMY_CHAIR_LEATHER)
  surface.sphere([0.18, 0.06, 0.04], [0, h + 0.03, -0.18], ARMY_CHAIR_CUSHION)
}

function chairArmrests(surface: RoyalArmyConferenceSurface): void {
  // Loop armrests with padded leather top pads
  for (const side of [-1, 1]) {
    const x = side * 0.29
    surface.box([0.025, 0.22, 0.04], [x, 0.54, 0], ARMY_CHROME)
    surface.box([0.055, 0.035, 0.32], [x, 0.65, 0], ARMY_CHAIR_LEATHER)
  }
}

function resolveChairAngle(structureId: string): number {
  const match = structureId.match(/chair-(\d+)$/)
  if (!match) return 0
  const num = parseInt(match[1], 10)
  if (num >= 1 && num <= 5) return 0 // Facing South (+Z) towards U-table interior
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

function dressDelegateStation(surface: RoyalArmyConferenceSurface, at: Point3): void {
  const [x, y, z] = at
  // Executive leather blotter desk pad with corner guards
  surface.box([0.48, 0.008, 0.36], [x, y + 0.004, z], ARMY_BLOTTER_LEATHER)
  // White notepad
  surface.box([0.32, 0.006, 0.24], [x - 0.04, y + 0.01, z], ARMY_PAPER)
  // Metal pen
  surface.cylinder({ radius: 0.004, height: 0.14, sides: 6 }, [x + 0.16, y + 0.01, z], {
    colour: ARMY_CHROME,
    rotation: [Math.PI / 2, 0, 0],
  })
  // Confidential military dossier with top-secret red stripe
  drawDossierWithStripe(surface, [x - 0.32, y + 0.005, z + 0.02])
  // Official brass triangular desk nameplate
  drawDelegateNameplate(surface, [x, y, z + 0.22])
  // Gooseneck push-to-talk conference microphone
  drawDeskMicrophone(surface, [x + 0.28, y, z + 0.16])
  // Crystal water tumbler and polished coaster
  surface.cylinder(
    { radius: 0.042, height: 0.004, sides: 12 },
    [x - 0.28, y + 0.002, z + 0.18],
    ARMY_CHROME,
  )
  surface.cylinder(
    { radius: 0.035, height: 0.1, sides: 12 },
    [x - 0.28, y + 0.05, z + 0.18],
    ARMY_GLASS,
  )
}

function dressHeadTableAttendees(surface: RoyalArmyConferenceSurface): void {
  const xPositions = [-2.8, -1.4, 0, 1.4, 2.8]
  for (const x of xPositions) {
    dressDelegateStation(surface, [x, 0.76, -0.22])
  }
}

function dressPortTableAttendees(surface: RoyalArmyConferenceSurface): void {
  const zPositions = [-1.35, -0.45, 0.45, 1.35]
  for (const z of zPositions) {
    dressDelegateStation(surface, [-0.65, 0.76, z])
  }
}

function dressStarboardTableAttendees(surface: RoyalArmyConferenceSurface): void {
  const zPositions = [-1.35, -0.45, 0.45, 1.35]
  for (const z of zPositions) {
    dressDelegateStation(surface, [0.65, 0.76, z])
  }
}

function tableSupports(surface: RoyalArmyConferenceSurface, w: number, d: number): void {
  const halfW = w / 2 - 0.2
  const halfD = d / 2 - 0.2
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      surface.box([0.08, 0.7, 0.08], [sx * halfW, 0.35, sz * halfD], ARMY_STEEL)
      surface.box([0.12, 0.02, 0.12], [sx * halfW, 0.01, sz * halfD], ARMY_LIGHT_STEEL)
    }
  }
  // Modesty skirt panel
  surface.box([w - 0.35, 0.44, 0.03], [0, 0.48, 0], ARMY_STEEL)
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

  // Central brushed aluminum wire access raceway
  if (w > d) {
    surface.box([w * 0.75, 0.005, 0.16], [0, h + 0.002, 0], ARMY_LIGHT_STEEL)
    surface.box([w * 0.72, 0.006, 0.03], [0, h + 0.003, 0], ARMY_STEEL)
  } else {
    surface.box([0.16, 0.005, d * 0.75], [0, h + 0.002, 0], ARMY_LIGHT_STEEL)
    surface.box([0.03, 0.006, d * 0.72], [0, h + 0.003, 0], ARMY_STEEL)
  }

  tableSupports(surface, w, d)

  // Populate delegate gear
  if (structure.id.endsWith('table-head')) {
    dressHeadTableAttendees(surface)
  } else if (structure.id.endsWith('table-port')) {
    dressPortTableAttendees(surface)
  } else if (structure.id.endsWith('table-starboard')) {
    dressStarboardTableAttendees(surface)
  }
}
