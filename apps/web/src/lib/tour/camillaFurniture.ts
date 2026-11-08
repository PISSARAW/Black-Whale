import type { Point3 } from './banquetDetailBuilder'
import {
  CAMILLA_GOLD,
  CAMILLA_PORCELAIN,
  CAMILLA_SILK,
  CAMILLA_SILVER,
  CAMILLA_VELVET,
  CAMILLA_WOOD,
  CamillaSurface,
  DUAZUL_VELVET,
  MUSSE_METAL,
  MUSSE_PAPER,
  MUSSE_WOOD,
  UNTOUCHABLE_CUSHION,
} from './camillaDetailSurface'

export interface FurnitureContext {
  surface: CamillaSurface
}

// --- Camilla's Chaise Longue & Table ---

function camillaChaiseMattress(surface: CamillaSurface): void {
  // Main mattress in royal rose-violet velvet
  surface.box([2.1, 0.22, 0.92], [0, 0.42, 0], CAMILLA_VELVET)
  surface.box([2.14, 0.04, 0.96], [0, 0.3, 0], CAMILLA_WOOD)
  surface.box([2.18, 0.02, 1.0], [0, 0.32, 0], CAMILLA_GOLD)

  // Tufting buttons
  for (let ix = -3; ix <= 3; ix++) {
    for (let iz = -1; iz <= 1; iz++) {
      surface.sphere([0.015, 0.012, 0.015], [ix * 0.26, 0.54, iz * 0.24], CAMILLA_GOLD)
    }
  }
}

function camillaChaiseHeadrest(surface: CamillaSurface): void {
  // Arched scrolled headrest at the west end (X = -0.9)
  surface.cylinder({ radius: 0.24, height: 0.88, sides: 14 }, [-0.9, 0.62, 0], {
    colour: CAMILLA_VELVET,
    rotation: [Math.PI / 2, 0, 0],
  })
  surface.cylinder({ radius: 0.26, height: 0.92, sides: 14 }, [-0.9, 0.62, 0], {
    colour: CAMILLA_WOOD,
    rotation: [Math.PI / 2, 0, 0],
  })

  // Cylindrical silk bolster cushion
  surface.cylinder({ radius: 0.12, height: 0.78, sides: 12 }, [-0.74, 0.64, 0], {
    colour: CAMILLA_SILK,
    rotation: [Math.PI / 2, 0, 0],
  })

  // Decorative silk accent pillows
  surface.sphere([0.22, 0.14, 0.2], [-0.5, 0.58, -0.16], CAMILLA_SILK)
  surface.sphere([0.18, 0.12, 0.18], [-0.44, 0.58, 0.18], 0xd4a5b8)
}

function camillaChaiseFrame(surface: CamillaSurface): void {
  // 6 carved cabriole legs
  const legX = [-0.92, 0, 0.92]
  const legZ = [-0.42, 0.42]
  for (const x of legX) {
    for (const z of legZ) {
      surface.cylinder(
        { radius: 0.035, bottom: 0.02, height: 0.28, sides: 8 },
        [x, 0.14, z],
        CAMILLA_WOOD,
      )
      surface.sphere([0.03, 0.025, 0.03], [x, 0.02, z], CAMILLA_GOLD)
    }
  }
}

export function dressCamillaChaise(surface: CamillaSurface): void {
  camillaChaiseMattress(surface)
  camillaChaiseHeadrest(surface)
  camillaChaiseFrame(surface)
}

export function dressCamillaTable(surface: CamillaSurface): void {
  // Round pedestal table with cosmetics and tea service
  surface.cylinder({ radius: 0.42, height: 0.04, sides: 16 }, [0, 0.58, 0], CAMILLA_WOOD)
  surface.ring(0.42, [0, 0.58, 0], CAMILLA_GOLD)
  surface.cylinder({ radius: 0.045, height: 0.54, sides: 10 }, [0, 0.28, 0], CAMILLA_WOOD)
  surface.cylinder({ radius: 0.22, height: 0.04, sides: 12 }, [0, 0.03, 0], CAMILLA_WOOD)

  // Perfume bottles and tea cup
  surface.cylinder({ radius: 0.025, height: 0.09, sides: 8 }, [-0.12, 0.64, 0.08], 0xccb077)
  surface.sphere([0.03, 0.03, 0.03], [0.1, 0.63, -0.06], 0xa6607a)
  surface.cylinder({ radius: 0.04, height: 0.05, sides: 10 }, [0.05, 0.62, 0.12], CAMILLA_PORCELAIN)
}

// --- Untouchables' Circle of Seats ---

export function dressUntouchablesSeats(surface: CamillaSurface): void {
  // 14 formal austere floor seats arranged around the salon perimeter (Chapter 389)
  const seats: Point3[] = [
    // West row
    [-8.2, 0.08, 0.2],
    [-8.2, 0.08, 1.8],
    [-8.2, 0.08, 3.4],
    // North row
    [-6.4, 0.08, 4.7],
    [-3.8, 0.08, 4.7],
    [-1.2, 0.08, 4.7],
    [1.4, 0.08, 4.7],
    [4.0, 0.08, 4.7],
    [6.6, 0.08, 4.7],
    // East row
    [8.4, 0.08, 3.4],
    [8.4, 0.08, 1.8],
    // South perimeter
    [5.0, 0.08, 0.8],
    [-1.5, 0.08, -1.8],
    [-4.5, 0.08, -1.8],
  ]

  for (const pos of seats) {
    surface.box([0.72, 0.14, 0.72], pos, UNTOUCHABLE_CUSHION)
    surface.box([0.76, 0.02, 0.76], [pos[0], pos[1] - 0.06, pos[2]], 0x18181c)
  }
}

// --- Dining Room: Camilla & Duazul ---

function diningTableSetting(surface: CamillaSurface): void {
  // Plates, cutlery, wine glasses and decanter
  const places: Point3[] = [
    [-0.55, 0.78, 0], // Camilla place
    [0.55, 0.78, 0], // Duazul place
  ]
  for (const at of places) {
    surface.cylinder({ radius: 0.16, height: 0.02, sides: 14 }, at, CAMILLA_PORCELAIN)
    surface.box([0.025, 0.01, 0.22], [at[0] - 0.22, at[1], at[2]], CAMILLA_SILVER)
    surface.box([0.02, 0.01, 0.22], [at[0] + 0.22, at[1], at[2]], CAMILLA_SILVER)
    surface.cylinder(
      { radius: 0.035, height: 0.12, sides: 8 },
      [at[0], at[1] + 0.06, at[2] - 0.26],
      0xe8e8ea,
    )
  }
  // Central wine decanter
  surface.cylinder({ radius: 0.08, height: 0.26, sides: 10 }, [0, 0.9, 0], 0xdde2e8)
  surface.sphere([0.07, 0.07, 0.07], [0, 0.84, 0], 0x5a1020)
}

function courtChair(
  surface: CamillaSurface,
  at: Point3,
  options: { velvetCol: number; angle: number },
): void {
  const { velvetCol, angle } = options
  const [x, y, z] = at
  // 4 carved legs
  for (const sx of [-0.22, 0.22]) {
    for (const sz of [-0.22, 0.22]) {
      surface.cylinder(
        { radius: 0.028, height: 0.44, sides: 8 },
        [x + sx, y + 0.22, z + sz],
        CAMILLA_WOOD,
      )
    }
  }
  // Seat cushion
  surface.box([0.54, 0.08, 0.54], [x, y + 0.48, z], velvetCol)
  surface.box([0.56, 0.03, 0.56], [x, y + 0.43, z], CAMILLA_WOOD)

  // High backrest
  const backZ = z + (angle === 0 ? -0.24 : 0.24)
  surface.box([0.52, 0.65, 0.06], [x, y + 0.82, backZ], CAMILLA_WOOD)
  surface.box([0.42, 0.55, 0.07], [x, y + 0.82, backZ], velvetCol)
  surface.sphere([0.04, 0.04, 0.04], [x, y + 1.18, backZ], CAMILLA_GOLD)
}

export function dressDiningTable(surface: CamillaSurface): void {
  // Large dining table
  surface.box([2.4, 0.06, 1.4], [0, 0.74, 0], CAMILLA_WOOD)
  surface.box([2.36, 0.02, 1.36], [0, 0.77, 0], CAMILLA_SILK) // Tablecloth drape
  surface.box([2.38, 0.2, 1.38], [0, 0.68, 0], CAMILLA_SILK)

  // Baluster table legs
  for (const sx of [-0.95, 0.95]) {
    for (const sz of [-0.52, 0.52]) {
      surface.cylinder({ radius: 0.05, height: 0.72, sides: 10 }, [sx, 0.36, sz], CAMILLA_WOOD)
    }
  }

  diningTableSetting(surface)

  // Chairs: Camilla on west facing east, Duazul on east facing west
  courtChair(surface, [-1.35, 0, 0], { velvetCol: CAMILLA_VELVET, angle: 0 })
  courtChair(surface, [1.35, 0, 0], { velvetCol: DUAZUL_VELVET, angle: 1 })
}

// --- Musse's Surveillance Post ---

function musseTelephone(surface: CamillaSurface): void {
  // Surveillance phone base, dial & handset
  surface.box([0.24, 0.09, 0.2], [0.38, 0.8, 0.05], MUSSE_METAL)
  surface.cylinder({ radius: 0.05, height: 0.02, sides: 12 }, [0.38, 0.85, 0.07], 0xd8d8d8)
  surface.box([0.08, 0.05, 0.26], [0.38, 0.88, 0.05], 0x222222) // Handset
  surface.box([0.16, 0.08, 0.14], [0.55, 0.79, 0.05], 0x333338) // Recording/spy box
}

function musseDossiers(surface: CamillaSurface): void {
  // Piles of intelligence files and documents
  surface.box([0.32, 0.06, 0.24], [-0.34, 0.78, 0.08], MUSSE_PAPER)
  surface.box([0.34, 0.015, 0.26], [-0.34, 0.82, 0.08], 0x8a382d) // Folder cover
  surface.box([0.3, 0.04, 0.22], [-0.28, 0.77, -0.15], MUSSE_PAPER)
}

function musseBirdPerch(surface: CamillaSurface): void {
  // Perch evoking Musse's "Secret Window" Nen bird
  surface.cylinder({ radius: 0.015, height: 1.6, sides: 8 }, [-0.75, 0.8, -0.2], MUSSE_METAL)
  surface.cylinder({ radius: 0.018, height: 0.38, sides: 8 }, [-0.75, 1.58, -0.2], {
    colour: CAMILLA_WOOD,
    rotation: [0, 0, Math.PI / 2],
  })
  surface.sphere([0.04, 0.06, 0.05], [-0.75, 1.65, -0.2], 0x2e353f) // Stylised bird silhouette
}

export function dressMusseSurveillanceDesk(surface: CamillaSurface): void {
  // Surveillance desk
  surface.box([1.4, 0.05, 0.75], [0, 0.74, 0], MUSSE_WOOD)
  surface.box([0.36, 0.7, 0.68], [0.46, 0.36, 0], MUSSE_WOOD) // Drawer pedestal
  surface.cylinder({ radius: 0.03, height: 0.71, sides: 8 }, [-0.62, 0.36, -0.3], MUSSE_METAL)
  surface.cylinder({ radius: 0.03, height: 0.71, sides: 8 }, [-0.62, 0.36, 0.3], MUSSE_METAL)

  // Ergonomic office chair
  surface.cylinder({ radius: 0.26, height: 0.06, sides: 12 }, [0, 0.44, 0.62], 0x222226)
  surface.box([0.48, 0.45, 0.06], [0, 0.7, 0.86], 0x222226)
  surface.cylinder({ radius: 0.03, height: 0.41, sides: 8 }, [0, 0.21, 0.62], MUSSE_METAL)
  surface.box([0.45, 0.04, 0.45], [0, 0.04, 0.62], MUSSE_METAL)

  musseTelephone(surface)
  musseDossiers(surface)
  musseBirdPerch(surface)
}
