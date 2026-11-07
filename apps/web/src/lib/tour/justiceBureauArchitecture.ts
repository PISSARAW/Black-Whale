import type * as Three from 'three'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  JUSTICE_BRASS,
  JUSTICE_GLASS,
  JUSTICE_GOLD,
  JUSTICE_OAK,
  JUSTICE_STEEL,
  JUSTICE_STONE,
  JUSTICE_WOOD,
  JusticeBureauSurface,
} from './justiceBureauDetailSurface'
import type { Space } from './types'

export interface ArchitectureOptions {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

/** Full-height multi-tier bookcase extending to the ceiling with books & dossiers */
export function dressFullHeightBookcase(
  surface: JusticeBureauSurface,
  columns: number,
  tiers: number,
): void {
  const { width: w, depth: d } = surface
  const h = 3.6
  // Main carcass, plinth and top cornice
  surface.box([w, 0.12, d], [0, 0.06, 0], JUSTICE_WOOD)
  surface.box([w + 0.06, 0.14, d + 0.06], [0, h - 0.07, 0], JUSTICE_WOOD)
  surface.box([0.08, h, d], [-w / 2 + 0.04, h / 2, 0], JUSTICE_WOOD)
  surface.box([0.08, h, d], [w / 2 - 0.04, h / 2, 0], JUSTICE_WOOD)

  // Vertical dividers
  const colWidth = (w - 0.16) / columns
  for (let c = 1; c < columns; c++) {
    surface.box([0.05, h - 0.26, d * 0.95], [-w / 2 + 0.08 + c * colWidth, h / 2, 0], JUSTICE_OAK)
  }

  // Shelves and books in each tier
  const tierHeight = (h - 0.3) / tiers
  for (let t = 0; t <= tiers; t++) {
    const shelfY = 0.12 + t * tierHeight
    surface.box([w - 0.16, 0.04, d * 0.96], [0, shelfY, 0], JUSTICE_OAK)
    if (t < tiers) {
      for (let c = 0; c < columns; c++) {
        const x = -w / 2 + 0.08 + (c + 0.5) * colWidth
        surface.into.box([colWidth * 0.94, tierHeight * 0.82, d * 0.7], {
          at: surface.point([x, shelfY + (tierHeight * 0.82) / 2 + 0.02, d * 0.08]),
          rotation: [0, surface.angle, 0],
          colour: (c + t) % 3 === 0 ? 0x4a2828 : (c + t) % 3 === 1 ? 0x22362b : 0x2c354a,
        })
      }
    }
  }
}

/** Official door plaque with room number and title */
function dressDoorPlaque(
  into: BanquetDetailBuilder,
  options: { at: [number, number, number]; angle: number; numberText: string },
): void {
  const { at, angle, numberText } = options
  into.box([0.45, 0.22, 0.03], { at, rotation: [0, angle, 0], colour: JUSTICE_WOOD })
  into.box([0.41, 0.18, 0.035], { at, rotation: [0, angle, 0], colour: JUSTICE_BRASS })
  into.box([0.22, 0.08, 0.04], { at: [at[0], at[1] + 0.02, at[2]], rotation: [0, angle, 0], colour: JUSTICE_GOLD })
  if (numberText === '1010') {
    into.box([0.08, 0.03, 0.045], { at: [at[0], at[1] - 0.04, at[2]], rotation: [0, angle, 0], colour: 0x111111 })
  }
}

/** Judicial Office 1010: Bookshelves on rear and side walls, door 1010 plaque */
export function dressOffice1010Architecture(options: ArchitectureOptions): void {
  const { into, plan, space } = options
  const floor = floorOf(space, plan.tier)
  const rearStructure = plan.structures.find((s) => s.id.endsWith('-bookcases'))
  const sideStructure = plan.structures.find((s) => s.id.endsWith('-deputy-side-bookcase'))

  if (rearStructure) {
    const rearSurface = new JusticeBureauSurface(into, rearStructure, floor)
    dressFullHeightBookcase(rearSurface, 6, 6)
  }
  if (sideStructure) {
    const sideSurface = new JusticeBureauSurface(into, sideStructure, floor)
    dressFullHeightBookcase(sideSurface, 5, 6)
  }

  // Official door 1010 leading to corridor
  const doorZ = -3.0
  dressDoorPlaque(into, { at: [-0.5, floor + 2.1, doorZ - 0.03], angle: 0, numberText: '1010' })
  dressDoorPlaque(into, { at: [-0.5, floor + 2.1, doorZ + 0.03], angle: Math.PI, numberText: '1010' })

  // Wall wainscoting along free walls
  into.box([12.3, 0.95, 0.05], { at: [-0.5, floor + 0.48, -12.45], rotation: [0, 0, 0], colour: JUSTICE_WOOD })
  into.box([0.05, 0.95, 9.3], { at: [-6.7, floor + 0.48, -7.75], rotation: [0, 0, 0], colour: JUSTICE_WOOD })
}

/** Heavy transfer drawer between visitor side and detainee side */
function dressTransferDrawer(into: BanquetDetailBuilder, at: [number, number, number]): void {
  const [x, y, z] = at
  // Outer steel chassis housing
  into.box([0.7, 0.22, 0.9], { at: [x, y + 0.11, z], colour: JUSTICE_STEEL })
  // Sliding drawer tray with recess
  into.box([0.56, 0.16, 0.78], { at: [x, y + 0.12, z], colour: 0x2e3338 })
  // Drawer handles on both visitor and secure sides
  into.box([0.25, 0.04, 0.04], { at: [x, y + 0.16, z - 0.47], colour: JUSTICE_BRASS })
  into.box([0.25, 0.04, 0.04], { at: [x, y + 0.16, z + 0.47], colour: JUSTICE_BRASS })
}

/** Acoustic consultation booth dividers and interphones */
function dressBoothDividers(into: BanquetDetailBuilder, floor: number, partitionZ: number): void {
  const boothXList = [3.5, 7.5, 11.5, 15.5, 19.5]
  for (const bx of boothXList) {
    // Acoustic vertical privacy panel
    into.box([0.08, 1.6, 1.8], { at: [bx, floor + 1.25, partitionZ], colour: JUSTICE_WOOD })
    // Handset intercoms on both sides
    for (const side of [-1, 1]) {
      into.box([0.1, 0.28, 0.08], { at: [bx - 0.08 * side, floor + 1.25, partitionZ + 0.25 * side], colour: 0x1f2326 })
      into.box([0.05, 0.22, 0.06], { at: [bx - 0.12 * side, floor + 1.25, partitionZ + 0.25 * side], colour: JUSTICE_BRASS })
    }
  }
}

/** Visitation Room: Glass barrier, transfer drawer and acoustic booths */
export function dressVisitationArchitecture(options: ArchitectureOptions): void {
  const { into, space, plan } = options
  const floor = floorOf(space, plan.tier)
  const partitionZ = 5.5

  // Solid base counter across width
  into.box([20.0, 0.85, 0.6], { at: [10.6, floor + 0.425, partitionZ], colour: JUSTICE_WOOD })
  into.box([20.1, 0.06, 0.72], { at: [10.6, floor + 0.86, partitionZ], colour: JUSTICE_OAK })

  // Large soundproof glass panes rising from counter to 2.4 m
  into.box([19.8, 1.5, 0.04], { at: [10.6, floor + 1.63, partitionZ], colour: JUSTICE_GLASS })

  // Structural steel mullions
  for (let x = 1.0; x <= 20.5; x += 2.4) {
    into.box([0.1, 1.6, 0.12], { at: [x, floor + 1.66, partitionZ], colour: JUSTICE_STEEL })
    into.cylinder({ radius: 0.06, height: 0.05 }, { at: [x, floor + 1.45, partitionZ], colour: JUSTICE_BRASS })
  }

  // Central transfer drawer
  dressTransferDrawer(into, [10.5, floor + 0.88, partitionZ])

  // Acoustic privacy booths and communication intercoms
  dressBoothDividers(into, floor, partitionZ)

  // Door sign on corridor
  dressDoorPlaque(into, { at: [10.6, floor + 2.1, -1.22], angle: 0, numberText: 'PARLOIR' })
}

/** Lobby: Security archway, turnstiles and waiting benches */
export function dressLobbyArchitecture(options: ArchitectureOptions): void {
  const { into, space, plan } = options
  const floor = floorOf(space, plan.tier)

  // Security arch / metal detector at exit to hall
  into.box([0.16, 2.3, 0.6], { at: [-16.9, floor + 1.15, -3.0], colour: 0x333b42 })
  into.box([0.16, 2.3, 0.6], { at: [-15.1, floor + 1.15, -3.0], colour: 0x333b42 })
  into.box([1.96, 0.22, 0.6], { at: [-16.0, floor + 2.35, -3.0], colour: 0x333b42 })

  // Security turnstiles
  into.box([0.08, 0.95, 0.4], { at: [-16.0, floor + 0.48, -3.2], colour: JUSTICE_STEEL })
  into.cylinder({ radius: 0.03, height: 0.6 }, { at: [-16.0, floor + 0.75, -3.2], colour: JUSTICE_BRASS })

  // Waiting benches along side wall
  into.box([0.5, 0.48, 4.2], { at: [-20.4, floor + 0.24, -8.0], colour: JUSTICE_WOOD })
  into.box([0.06, 0.48, 4.2], { at: [-20.65, floor + 0.62, -8.0], colour: JUSTICE_WOOD })

  // Directory board on lobby wall
  into.box([1.4, 0.9, 0.05], { at: [-10.5, floor + 1.8, -12.45], colour: JUSTICE_WOOD })
  into.box([1.3, 0.8, 0.06], { at: [-10.5, floor + 1.8, -12.44], colour: JUSTICE_BRASS })
}

/** Bureau Hall: Corridor wainscoting and light fixtures */
export function dressHallArchitecture(options: ArchitectureOptions): void {
  const { into, space, plan } = options
  const floor = floorOf(space, plan.tier)
  const ceiling = ceilingOf(space, plan.tier)

  // Administrative ceiling lights along the corridor
  for (let x = -18; x <= 18; x += 6) {
    into.box([0.9, 0.05, 0.4], { at: [x, floor + ceiling - 0.05, -2.125], colour: 0xf4f0e6 })
    into.box([0.96, 0.04, 0.46], { at: [x, floor + ceiling - 0.03, -2.125], colour: JUSTICE_STEEL })
  }

  // Baseboards / plinths along corridor length
  into.box([41.0, 0.18, 0.04], { at: [0, floor + 0.09, -3.02], colour: JUSTICE_STONE })
  into.box([41.0, 0.18, 0.04], { at: [0, floor + 0.09, -1.23], colour: JUSTICE_STONE })
}
