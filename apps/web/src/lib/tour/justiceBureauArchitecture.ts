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
  into.box([0.22, 0.08, 0.04], {
    at: [at[0], at[1] + 0.02, at[2]],
    rotation: [0, angle, 0],
    colour: JUSTICE_GOLD,
  })
  if (numberText === '1010') {
    into.box([0.08, 0.03, 0.045], {
      at: [at[0], at[1] - 0.04, at[2]],
      rotation: [0, angle, 0],
      colour: 0x111111,
    })
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
  dressDoorPlaque(into, {
    at: [-0.5, floor + 2.1, doorZ + 0.03],
    angle: Math.PI,
    numberText: '1010',
  })

  // Wall wainscoting along free walls
  into.box([12.3, 0.95, 0.05], {
    at: [-0.5, floor + 0.48, -12.45],
    rotation: [0, 0, 0],
    colour: JUSTICE_WOOD,
  })
  into.box([0.05, 0.95, 9.3], {
    at: [-6.7, floor + 0.48, -7.75],
    rotation: [0, 0, 0],
    colour: JUSTICE_WOOD,
  })
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
  into.cylinder(
    { radius: 0.03, height: 0.6 },
    { at: [-16.0, floor + 0.75, -3.2], colour: JUSTICE_BRASS },
  )

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
