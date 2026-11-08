import {
  SCREENING_BRASS,
  SCREENING_CARPET,
  SCREENING_GOLD_LEAF,
  SCREENING_SEAT_FRAME,
  SCREENING_SEAT_VELVET,
  SCREENING_WARM_GLOW,
  SCREENING_WOOD_MAHOGANY,
  SCREENING_WOOD_TRIM,
  type ScreeningRoomSurface,
} from './screeningRoomDetailSurface'

export interface BoxesContext {
  surface: ScreeningRoomSurface
  floor: number
}

interface BoxGalleryDef {
  x: number
  z: number
  length: number
  width: number
  isPort: boolean
}

function corbelBracket(
  surface: ScreeningRoomSurface,
  at: [number, number, number],
  isPort: boolean,
): void {
  const [x, y, z] = at
  const dz = isPort ? 0.4 : -0.4
  // Upper bracket horizontal plate
  surface.box([0.3, 0.12, 0.9], [x, y - 0.06, z + dz], SCREENING_WOOD_MAHOGANY)
  // Diagonal carved scroll strut
  surface.box([0.22, 0.65, 0.22], [x, y - 0.4, z + dz * 0.7], SCREENING_GOLD_LEAF)
  // Wall mount plinth
  surface.box([0.32, 0.8, 0.1], [x, y - 0.45, z + (isPort ? -0.1 : 0.1)], SCREENING_WOOD_TRIM)
}

function vipArmchair(surface: ScreeningRoomSurface, at: [number, number, number]): void {
  const [x, y, z] = at
  // Plinth legs
  surface.box([0.55, 0.08, 0.55], [x, y + 0.04, z], SCREENING_SEAT_FRAME)
  // Plush seat cushion
  surface.box([0.52, 0.16, 0.5], [x, y + 0.28, z], SCREENING_SEAT_VELVET)
  // Deep buttoned velvet backrest
  surface.box([0.14, 0.52, 0.48], [x - 0.2, y + 0.58, z], SCREENING_SEAT_VELVET)
  // Padded arms
  for (const dz of [-0.26, 0.26]) {
    surface.box([0.48, 0.22, 0.08], [x, y + 0.44, z + dz], SCREENING_SEAT_VELVET)
    surface.box([0.49, 0.03, 0.09], [x, y + 0.56, z + dz], SCREENING_WOOD_TRIM)
  }
}

function logePartition(
  surface: ScreeningRoomSurface,
  at: [number, number, number],
  width: number,
): void {
  const [x, y, z] = at
  // Low dividing wall between loges
  surface.box([0.12, 0.9, width - 0.1], [x, y + 0.45, z], SCREENING_WOOD_MAHOGANY)
  surface.box([0.14, 0.08, width], [x, y + 0.92, z], SCREENING_GOLD_LEAF)
}

function dressGalleryBalustrade(
  surface: ScreeningRoomSurface,
  gallery: BoxGalleryDef,
  boxY: number,
): void {
  const { x, z, length, width, isPort } = gallery
  const frontZ = z + (isPort ? width / 2 : -width / 2)

  // Balustrade base rail
  surface.box([length, 0.1, 0.14], [x, boxY + 0.05, frontZ], SCREENING_WOOD_MAHOGANY)

  // Turned gold balusters along the gallery front
  const numBalusters = Math.floor(length / 0.7)
  const stepX = length / numBalusters
  for (let i = 0; i <= numBalusters; i++) {
    const bx = x - length / 2 + i * stepX
    surface.cylinder({ radius: 0.035, height: 0.72, sides: 8 }, [bx, boxY + 0.46, frontZ], {
      colour: SCREENING_GOLD_LEAF,
    })
  }

  // Top velvet-padded handrail
  surface.box([length + 0.1, 0.12, 0.2], [x, boxY + 0.88, frontZ], SCREENING_SEAT_VELVET)
  surface.box([length + 0.1, 0.03, 0.22], [x, boxY + 0.82, frontZ], SCREENING_GOLD_LEAF)
}

function dressSingleBoxGallery(
  surface: ScreeningRoomSurface,
  gallery: BoxGalleryDef,
  floor: number,
): void {
  const { x, z, length, width, isPort } = gallery
  const boxY = floor + 4.4

  // Main box floor platform (carpeted top, mahogany soffit)
  surface.box([length, 0.18, width], [x, boxY - 0.09, z], SCREENING_WOOD_MAHOGANY)
  surface.box([length - 0.1, 0.02, width - 0.1], [x, boxY + 0.01, z], SCREENING_CARPET)

  // Corbel brackets supporting gallery from the lateral wall
  const bracketCount = Math.floor(length / 3.4)
  const bracketStep = length / bracketCount
  for (let i = 0; i <= bracketCount; i++) {
    const corbelX = x - length / 2 + i * bracketStep
    corbelBracket(surface, [corbelX, boxY, z], isPort)
    // Under-gallery soffit downlight
    surface.glowingSphere([0.05, 0.05, 0.05], [corbelX, boxY - 0.18, z], SCREENING_WARM_GLOW)
  }

  // Front ornate balustrade
  dressGalleryBalustrade(surface, gallery, boxY)

  // Partitions dividing into 5 individual private loges
  const loges = 5
  const logeStep = length / loges
  for (let i = 0; i <= loges; i++) {
    logePartition(surface, [x - length / 2 + i * logeStep, boxY, z], width)
  }

  // VIP armchairs and cocktail tables inside each loge
  for (let i = 0; i < loges; i++) {
    const logeCenterX = x - length / 2 + (i + 0.5) * logeStep
    vipArmchair(surface, [logeCenterX - 0.7, boxY, z])
    vipArmchair(surface, [logeCenterX + 0.7, boxY, z])
    // Small mahogany drink table
    surface.cylinder({ radius: 0.18, height: 0.48, sides: 12 }, [logeCenterX, boxY + 0.24, z], {
      colour: SCREENING_WOOD_MAHOGANY,
    })
    surface.box([0.42, 0.02, 0.42], [logeCenterX, boxY + 0.49, z], SCREENING_GOLD_LEAF)
  }
}

/** Complete elevated private boxes (loges) lining both lateral walls of the Screening Room. */
export function dressScreeningRoomBoxes(context: BoxesContext): void {
  const { surface, floor } = context

  const galleries: readonly BoxGalleryDef[] = [
    { x: -62, z: 8, length: 26, width: 1.2, isPort: true },
    { x: -27, z: 8, length: 26, width: 1.2, isPort: true },
    { x: -62, z: 51.5, length: 26, width: 1.2, isPort: false },
    { x: -27, z: 51.5, length: 26, width: 1.2, isPort: false },
  ]

  for (const gallery of galleries) {
    dressSingleBoxGallery(surface, gallery, floor)
  }
}
