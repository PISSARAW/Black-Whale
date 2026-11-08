import {
  SCREENING_BRASS,
  SCREENING_CURTAIN_CRIMSON,
  SCREENING_CURTAIN_DARK,
  SCREENING_DARK_STEEL,
  SCREENING_GOLD_LEAF,
  SCREENING_SCREEN_FRAME,
  SCREENING_SCREEN_WHITE,
  SCREENING_STAGE_FLOOR,
  SCREENING_WARM_GLOW,
  SCREENING_WOOD_MAHOGANY,
  SCREENING_WOOD_TRIM,
  type ScreeningRoomSurface,
} from './screeningRoomDetailSurface'

export interface StageContext {
  surface: ScreeningRoomSurface
  floor: number
  ceilingHeight: number
}

function prosceniumPier(
  surface: ScreeningRoomSurface,
  at: [number, number, number],
  height: number,
): void {
  const [x, y, z] = at
  // Monumental plinth base
  surface.box([2.6, 0.9, 4.2], [x, y + 0.45, z], SCREENING_WOOD_MAHOGANY)
  surface.box([2.5, 0.15, 4.1], [x, y + 0.95, z], SCREENING_WOOD_TRIM)

  // Fluted pier core
  surface.box(
    [2.3, height - 1.8, 3.8],
    [x, y + 1.0 + (height - 1.8) / 2, z],
    SCREENING_WOOD_MAHOGANY,
  )

  // Decorative vertical gold fluting strips along front and sides
  for (const dz of [-1.4, -0.7, 0, 0.7, 1.4]) {
    surface.box(
      [0.08, height - 2.2, 0.22],
      [x + 1.18, y + 1.1 + (height - 2.2) / 2, z + dz],
      SCREENING_GOLD_LEAF,
    )
  }

  // Capital entablature with gilded dentils
  surface.box([2.7, 0.7, 4.3], [x, y + height - 0.45, z], SCREENING_WOOD_TRIM)
  surface.box([2.8, 0.25, 4.4], [x, y + height - 0.2, z], SCREENING_GOLD_LEAF)
}

function prosceniumArch(surface: ScreeningRoomSurface, floor: number, height: number): void {
  const archX = -76
  const archY = floor + height - 0.8
  const span = 35.5 // from Z=12 to Z=47.5
  const centerZ = 29.75

  // Arch beam span
  surface.box([1.4, 1.4, span], [archX, archY, centerZ], SCREENING_WOOD_MAHOGANY)
  surface.box([1.45, 0.25, span], [archX, archY - 0.7, centerZ], SCREENING_WOOD_TRIM)
  surface.box([1.48, 0.15, span], [archX, archY - 0.8, centerZ], SCREENING_GOLD_LEAF)

  // Grand central ornamental cartouche
  surface.box([1.55, 1.1, 2.4], [archX, archY - 0.2, centerZ], SCREENING_GOLD_LEAF)
  surface.cylinder({ radius: 0.7, height: 0.15, sides: 16 }, [archX + 0.75, archY - 0.2, centerZ], {
    colour: SCREENING_GOLD_LEAF,
    rotation: [0, 0, Math.PI / 2],
  })
}

function stagePlatform(surface: ScreeningRoomSurface, floor: number): void {
  const stageX = -81.6
  const stageZ = 29.75
  const stageW = 6.8
  const stageL = 34
  const stageH = 1.1
  const topY = floor + stageH

  // Main stage body
  surface.box([stageW, stageH, stageL], [stageX, floor + stageH / 2, stageZ], SCREENING_STAGE_FLOOR)
  // Front skirting fascia and bullnose trim
  surface.box(
    [0.15, stageH, stageL],
    [stageX + stageW / 2 + 0.05, floor + stageH / 2, stageZ],
    SCREENING_WOOD_MAHOGANY,
  )
  surface.box(
    [stageW + 0.1, 0.08, stageL + 0.1],
    [stageX, topY + 0.04, stageZ],
    SCREENING_WOOD_TRIM,
  )

  // Stage access stairs at port and starboard
  for (const sideZ of [-stageL / 2 - 0.8, stageL / 2 + 0.8]) {
    const steps = 4
    for (let i = 0; i < steps; i++) {
      const stepH = stageH / steps
      surface.box(
        [1.6, stepH * (i + 1), 1.4],
        [stageX + stageW / 2 - 0.8 - i * 0.35, floor + (stepH * (i + 1)) / 2, stageZ + sideZ],
        SCREENING_WOOD_MAHOGANY,
      )
    }
  }

  // Footlight trough along the stage apron
  const troughX = stageX + stageW / 2 - 0.05
  surface.box([0.15, 0.12, stageL - 4], [troughX, topY + 0.06, stageZ], SCREENING_DARK_STEEL)
  for (let z = stageZ - (stageL - 6) / 2; z <= stageZ + (stageL - 6) / 2; z += 1.8) {
    surface.glowingSphere([0.04, 0.04, 0.04], [troughX - 0.04, topY + 0.08, z], SCREENING_WARM_GLOW)
  }
}

function grandCurtain(surface: ScreeningRoomSurface, floor: number, height: number): void {
  const curtainX = -77.6
  const centerZ = 29.75
  const span = 27
  const drapeH = height - 2.2
  const topY = floor + height - 1.2

  // Upper pelmet / valance (lambrequin festonné)
  surface.box([0.6, 1.4, span], [curtainX, topY - 0.7, centerZ], SCREENING_CURTAIN_CRIMSON)
  surface.box([0.65, 0.15, span], [curtainX, topY - 1.45, centerZ], SCREENING_GOLD_LEAF)

  // Festoon scallops along valance
  const scallops = 9
  const stepZ = span / scallops
  for (let i = 0; i < scallops; i++) {
    const sz = centerZ - span / 2 + (i + 0.5) * stepZ
    surface.cylinder(
      { radius: stepZ * 0.45, height: 0.15, sides: 12 },
      [curtainX, topY - 1.4, sz],
      {
        colour: SCREENING_CURTAIN_DARK,
        rotation: [Math.PI / 2, 0, 0],
      },
    )
  }

  // Gathered side drapes tied back
  for (const sideZ of [centerZ - span / 2 + 1.8, centerZ + span / 2 - 1.8]) {
    surface.box(
      [0.7, drapeH, 3.2],
      [curtainX, floor + 1.1 + drapeH / 2, sideZ],
      SCREENING_CURTAIN_CRIMSON,
    )
    // Gold bullion tieback cord & tassel
    surface.ring(
      { radius: 0.6, tube: 0.06 },
      [curtainX + 0.1, floor + 3.2, sideZ],
      SCREENING_GOLD_LEAF,
    )
    surface.cylinder(
      { radius: 0.12, height: 0.45, sides: 8 },
      [curtainX + 0.1, floor + 2.7, sideZ],
      {
        colour: SCREENING_GOLD_LEAF,
      },
    )
  }
}

function projectionScreen(surface: ScreeningRoomSurface, floor: number): void {
  const screenX = -84.6
  const screenZ = 24
  const screenW = 0.4
  const screenL = 10.5
  const screenH = 5.8
  const baseH = floor + 1.8

  // Screen canvas
  surface.box(
    [screenW, screenH, screenL],
    [screenX, baseH + screenH / 2, screenZ],
    SCREENING_SCREEN_WHITE,
  )

  // Matte black velvet masking border
  surface.box(
    [screenW + 0.04, screenH + 0.4, 0.3],
    [screenX, baseH + screenH / 2, screenZ - screenL / 2],
    SCREENING_SCREEN_FRAME,
  )
  surface.box(
    [screenW + 0.04, screenH + 0.4, 0.3],
    [screenX, baseH + screenH / 2, screenZ + screenL / 2],
    SCREENING_SCREEN_FRAME,
  )
  surface.box(
    [screenW + 0.04, 0.3, screenL],
    [screenX, baseH + screenH + 0.15, screenZ],
    SCREENING_SCREEN_FRAME,
  )
  surface.box(
    [screenW + 0.04, 0.3, screenL],
    [screenX, baseH - 0.15, screenZ],
    SCREENING_SCREEN_FRAME,
  )

  // Rear truss support columns
  for (const dz of [-screenL * 0.35, screenL * 0.35]) {
    surface.box(
      [0.5, screenH + 1.2, 0.12],
      [screenX - 0.3, baseH + screenH / 2, screenZ + dz],
      SCREENING_DARK_STEEL,
    )
    surface.box([0.8, 0.1, 0.8], [screenX - 0.3, floor + 1.15, screenZ + dz], SCREENING_DARK_STEEL)
  }

  // Official briefing podium / lectern on stage
  const lecternX = -79.2
  const lecternZ = 16.5
  surface.box([0.8, 1.15, 0.95], [lecternX, floor + 1.1 + 0.575, lecternZ], SCREENING_WOOD_MAHOGANY)
  surface.box([0.85, 0.08, 1.0], [lecternX, floor + 1.1 + 1.18, lecternZ], SCREENING_WOOD_TRIM)
  surface.cylinder(
    { radius: 0.008, height: 0.35, sides: 6 },
    [lecternX, floor + 1.1 + 1.35, lecternZ],
    {
      colour: SCREENING_BRASS,
      rotation: [Math.PI / 6, 0, 0],
    },
  )
}

function stageWings(surface: ScreeningRoomSurface, floor: number, height: number): void {
  const wingH = height - 2.4
  const wingY = floor + 1.1 + wingH / 2
  // 3 pairs of black acoustic velvet tormentors/legs along stage depth
  const wingXs = [-79.0, -81.5, -84.0]
  for (const wx of wingXs) {
    // Port wing
    surface.box([0.15, wingH, 3.2], [wx, wingY, 14.2], SCREENING_CURTAIN_DARK)
    // Starboard wing
    surface.box([0.15, wingH, 3.2], [wx, wingY, 45.3], SCREENING_CURTAIN_DARK)
  }
}

function stageLightingTruss(surface: ScreeningRoomSurface, floor: number, height: number): void {
  const trussX = -76.8
  const trussY = floor + height - 1.6
  const span = 30.0
  const centerZ = 29.75

  // Structural square truss girder
  surface.box([0.35, 0.35, span], [trussX, trussY, centerZ], SCREENING_DARK_STEEL)

  // Stage profile spotlights clamped along the truss
  const spotCount = 8
  const stepZ = span / (spotCount + 1)
  for (let i = 1; i <= spotCount; i++) {
    const sz = centerZ - span / 2 + i * stepZ
    surface.cylinder({ radius: 0.08, height: 0.28, sides: 8 }, [trussX, trussY - 0.22, sz], {
      colour: SCREENING_DARK_STEEL,
      rotation: [0, 0, Math.PI / 6],
    })
    surface.glowingSphere(
      [0.07, 0.07, 0.07],
      [trussX + 0.1, trussY - 0.32, sz],
      SCREENING_WARM_GLOW,
    )
  }
}

function prosceniumSpeakers(surface: ScreeningRoomSurface, floor: number, height: number): void {
  const speakerX = -75.0
  const speakerY = floor + height * 0.55

  for (const sz of [14.4, 45.1]) {
    // Vertical line array cluster
    for (let i = 0; i < 4; i++) {
      const cy = speakerY + (i - 1.5) * 0.45
      surface.box([0.38, 0.38, 0.48], [speakerX, cy, sz], SCREENING_DARK_STEEL)
      surface.box([0.04, 0.32, 0.42], [speakerX + 0.19, cy, sz], SCREENING_WOOD_MAHOGANY)
    }
    // Rigging steel cable
    surface.cylinder(
      { radius: 0.015, height: height * 0.35 },
      [speakerX, floor + height * 0.8, sz],
      { colour: SCREENING_DARK_STEEL },
    )
  }
}

/** Complete proscenium stage ensemble of the Screening Room. */
export function dressScreeningRoomStage(context: StageContext): void {
  const { surface, floor, ceilingHeight } = context

  // 1. Raised stage platform with skirting, bullnose edge and stairs
  stagePlatform(surface, floor)

  // 2. Flanking proscenium piers
  prosceniumPier(surface, [-76, floor, 12], ceilingHeight)
  prosceniumPier(surface, [-76, floor, 47.5], ceilingHeight)

  // 3. Gilded proscenium arch
  prosceniumArch(surface, floor, ceilingHeight)

  // 4. Grand crimson velvet drape & valance
  grandCurtain(surface, floor, ceilingHeight)

  // 5. Cinema screen and briefing podium
  projectionScreen(surface, floor)

  // 6. Backstage wings (pendillons)
  stageWings(surface, floor, ceilingHeight)

  // 7. Overhead stage lighting truss
  stageLightingTruss(surface, floor, ceilingHeight)

  // 8. Line array proscenium speakers
  prosceniumSpeakers(surface, floor, ceilingHeight)
}
