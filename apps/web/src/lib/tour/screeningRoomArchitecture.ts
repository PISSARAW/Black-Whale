import {
  SCREENING_BRASS,
  SCREENING_DARK_STEEL,
  SCREENING_EXIT_GREEN,
  SCREENING_GLASS,
  SCREENING_GOLD_LEAF,
  SCREENING_WALL_FABRIC,
  SCREENING_WARM_GLOW,
  SCREENING_WOOD_MAHOGANY,
  SCREENING_WOOD_TRIM,
  type ScreeningRoomSurface,
} from './screeningRoomDetailSurface'

export interface ArchitectureContext {
  surface: ScreeningRoomSurface
  floor: number
  ceilingHeight: number
}

function wallPilaster(
  surface: ScreeningRoomSurface,
  at: [number, number, number],
  height: number,
): void {
  const [x, y, z] = at
  // Plinth base
  surface.box([0.36, 0.4, 0.12], [x, y + 0.2, z], SCREENING_WOOD_MAHOGANY)
  // Fluted shaft
  surface.box([0.28, height - 0.7, 0.08], [x, y + 0.4 + (height - 0.7) / 2, z], SCREENING_WOOD_TRIM)
  surface.box([0.16, height - 0.7, 0.09], [x, y + 0.4 + (height - 0.7) / 2, z], SCREENING_GOLD_LEAF)
  // Capital
  surface.box([0.34, 0.3, 0.14], [x, y + height - 0.15, z], SCREENING_GOLD_LEAF)
}

function wallSconce(surface: ScreeningRoomSurface, at: [number, number, number]): void {
  const [x, y, z] = at
  // Brass backplate
  surface.box([0.12, 0.28, 0.04], [x, y, z], SCREENING_BRASS)
  // Twin curved arms
  surface.cylinder({ radius: 0.015, height: 0.18, sides: 8 }, [x, y - 0.04, z + 0.08], {
    colour: SCREENING_BRASS,
    rotation: [Math.PI / 4, 0, 0],
  })
  // Frosted glowing shades
  for (const dx of [-0.08, 0.08]) {
    surface.cylinder({ radius: 0.045, height: 0.12, sides: 8 }, [x + dx, y + 0.08, z + 0.12], {
      colour: SCREENING_WARM_GLOW,
      glow: true,
    })
  }
}

function projectionBooth(surface: ScreeningRoomSurface, floor: number): void {
  const boothX = -0.4
  const boothY = floor + 6.2
  const boothZ = 29.75
  const width = 12

  // Booth housing projection facade
  surface.box([0.7, 3.2, width], [boothX, boothY, boothZ], SCREENING_DARK_STEEL)
  // Mahogany finish trim around booth front
  surface.box([0.75, 0.15, width + 0.4], [boothX, boothY + 1.6, boothZ], SCREENING_WOOD_MAHOGANY)
  surface.box([0.75, 0.15, width + 0.4], [boothX, boothY - 1.6, boothZ], SCREENING_WOOD_MAHOGANY)

  // Dual cinema projector ports (apertures with optical lenses)
  for (const dz of [-2.4, 2.4]) {
    surface.box([0.78, 0.65, 0.85], [boothX - 0.02, boothY + 0.2, boothZ + dz], SCREENING_WOOD_TRIM)
    surface.cylinder(
      { radius: 0.22, height: 0.15, sides: 16 },
      [boothX - 0.06, boothY + 0.2, boothZ + dz],
      {
        colour: SCREENING_GLASS,
        rotation: [0, 0, Math.PI / 2],
      },
    )
    // Warm beam focal point
    surface.glowingSphere(
      [0.08, 0.08, 0.08],
      [boothX - 0.12, boothY + 0.2, boothZ + dz],
      SCREENING_WARM_GLOW,
    )
  }

  // Operator central observation window
  surface.box([0.76, 0.9, 2.2], [boothX - 0.01, boothY + 0.2, boothZ], SCREENING_WOOD_TRIM)
  surface.box([0.78, 0.82, 2.1], [boothX - 0.02, boothY + 0.2, boothZ], SCREENING_GLASS)
}

function perimeterWallDetails(context: ArchitectureContext): void {
  const { surface, floor, ceilingHeight } = context
  const xMin = -87.4
  const xMax = -0.1
  const zMin = 7.1
  const zMax = 52.4
  const h = ceilingHeight

  // North wall along Z = 7.1 (X from -87.4 to -0.1)
  for (let x = xMin + 6; x < xMax - 6; x += 7.2) {
    wallPilaster(surface, [x, floor, zMin + 0.06], h)
    wallSconce(surface, [x + 3.6, floor + 3.2, zMin + 0.06])
    surface.box([5.4, 1.2, 0.06], [x + 3.6, floor + 0.6, zMin + 0.03], SCREENING_WOOD_MAHOGANY)
    surface.box(
      [5.4, h - 2.2, 0.04],
      [x + 3.6, floor + 1.2 + (h - 2.2) / 2, zMin + 0.02],
      SCREENING_WALL_FABRIC,
    )
  }

  // South wall along Z = 52.4 (X from -87.4 to -0.1)
  for (let x = xMin + 6; x < xMax - 6; x += 7.2) {
    wallPilaster(surface, [x, floor, zMax - 0.06], h)
    wallSconce(surface, [x + 3.6, floor + 3.2, zMax - 0.06])
    surface.box([5.4, 1.2, 0.06], [x + 3.6, floor + 0.6, zMax - 0.03], SCREENING_WOOD_MAHOGANY)
    surface.box(
      [5.4, h - 2.2, 0.04],
      [x + 3.6, floor + 1.2 + (h - 2.2) / 2, zMax - 0.02],
      SCREENING_WALL_FABRIC,
    )
  }

  // East rear wall along X = -0.1 (Z from 7.1 to 52.4)
  for (let z = zMin + 4; z < zMax - 4; z += 6.5) {
    if (Math.abs(z - 29.75) > 6.5) {
      wallPilaster(surface, [xMax - 0.06, floor, z], h)
      wallSconce(surface, [xMax - 0.06, floor + 3.2, z + 3.25])
      surface.box([0.06, 1.2, 5.2], [xMax - 0.03, floor + 0.6, z + 3.25], SCREENING_WOOD_MAHOGANY)
      surface.box(
        [0.04, h - 2.2, 5.2],
        [xMax - 0.02, floor + 1.2 + (h - 2.2) / 2, z + 3.25],
        SCREENING_WALL_FABRIC,
      )
    }
  }
}

function surroundSpeakers(surface: ScreeningRoomSurface, floor: number, height: number): void {
  const speakerY = floor + height * 0.58
  const xPositions = [-72.0, -58.0, -44.0, -30.0, -16.0]

  for (const sx of xPositions) {
    // North wall surround speaker
    surface.box([0.48, 0.65, 0.28], [sx, speakerY, 7.28], SCREENING_WOOD_MAHOGANY)
    surface.box([0.42, 0.58, 0.04], [sx, speakerY, 7.42], SCREENING_DARK_STEEL)
    surface.cylinder({ radius: 0.08, height: 0.02, sides: 8 }, [sx, speakerY + 0.12, 7.44], {
      colour: SCREENING_GOLD_LEAF,
      rotation: [Math.PI / 2, 0, 0],
    })

    // South wall surround speaker
    surface.box([0.48, 0.65, 0.28], [sx, speakerY, 52.22], SCREENING_WOOD_MAHOGANY)
    surface.box([0.42, 0.58, 0.04], [sx, speakerY, 52.08], SCREENING_DARK_STEEL)
    surface.cylinder({ radius: 0.08, height: 0.02, sides: 8 }, [sx, speakerY + 0.12, 52.06], {
      colour: SCREENING_GOLD_LEAF,
      rotation: [Math.PI / 2, 0, 0],
    })
  }
}

function boxAccessDoors(surface: ScreeningRoomSurface, floor: number): void {
  const doorY = floor + 4.4 + 1.2
  // Access doors from private VIP gallery foyers into the 4 box galleries
  const doorPositions: [number, number][] = [
    [-62.0, 7.15],
    [-27.0, 7.15],
    [-62.0, 52.35],
    [-27.0, 52.35],
  ]

  for (const [dx, dz] of doorPositions) {
    // Molded mahogany architrave
    surface.box([1.9, 2.45, 0.08], [dx, doorY, dz], SCREENING_WOOD_MAHOGANY)
    // Double door leafs
    surface.box([0.85, 2.25, 0.04], [dx - 0.44, doorY - 0.05, dz], SCREENING_WOOD_TRIM)
    surface.box([0.85, 2.25, 0.04], [dx + 0.44, doorY - 0.05, dz], SCREENING_WOOD_TRIM)
    // Brass door levers
    surface.box([0.14, 0.04, 0.06], [dx - 0.08, doorY - 0.15, dz + 0.04], SCREENING_BRASS)
    surface.box([0.14, 0.04, 0.06], [dx + 0.08, doorY - 0.15, dz + 0.04], SCREENING_BRASS)
  }
}

function emergencyExitPortals(surface: ScreeningRoomSurface, floor: number): void {
  const portalH = 2.8
  const portalY = floor + portalH / 2

  // North exit door (Z = 7.1)
  surface.box([3.2, portalH, 0.12], [-43.75, portalY, 7.16], SCREENING_WOOD_MAHOGANY)
  surface.box([2.8, 0.12, 0.04], [-43.75, floor + 1.0, 7.22], SCREENING_BRASS)
  surface.glowingBox(
    [0.55, 0.22, 0.12],
    [-43.75, floor + portalH + 0.18, 7.22],
    SCREENING_EXIT_GREEN,
  )

  // South exit door (Z = 52.4)
  surface.box([3.2, portalH, 0.12], [-43.75, portalY, 52.34], SCREENING_WOOD_MAHOGANY)
  surface.box([2.8, 0.12, 0.04], [-43.75, floor + 1.0, 52.28], SCREENING_BRASS)
  surface.glowingBox(
    [0.55, 0.22, 0.12],
    [-43.75, floor + portalH + 0.18, 52.28],
    SCREENING_EXIT_GREEN,
  )

  // Port backstage exit door (X = -87.4)
  surface.box([0.12, portalH, 3.2], [-87.34, portalY, 29.75], SCREENING_WOOD_MAHOGANY)
  surface.box([0.04, 0.12, 2.8], [-87.28, floor + 1.0, 29.75], SCREENING_BRASS)
  surface.glowingBox(
    [0.12, 0.22, 0.55],
    [-87.28, floor + portalH + 0.18, 29.75],
    SCREENING_EXIT_GREEN,
  )
}

/** Complete architectural envelope of the Screening Room (Tier 2). */
export function dressScreeningRoomArchitecture(context: ArchitectureContext): void {
  const { surface, floor, ceilingHeight } = context

  // 1. Classical pilasters, damask acoustic fabric and wall sconces
  perimeterWallDetails(context)

  // 2. High-fidelity acoustic surround horn speakers
  surroundSpeakers(surface, floor, ceilingHeight)

  // 3. Elevated VIP box access doors
  boxAccessDoors(surface, floor)

  // 4. Ground floor emergency exits with illuminated BAES signs
  emergencyExitPortals(surface, floor)

  // 5. Projection booth at rear of hall
  projectionBooth(surface, floor)
}
