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

/**
 * Monumental entrance visible in the exterior Justice Bureau panel: a glazed
 * central portal under a deep horizontal canopy, framed by heavy piers and an
 * overhead structural grid.  The lobby is only one walkable storey, so the
 * upper floors are suggested by a clerestory rather than by inaccessible
 * geometry above the room envelope.
 */
export function dressJusticeAtriumEntrance(options: ArchitectureOptions): void {
  const { into, space, plan } = options
  const floor = floorOf(space, plan.tier)
  const ceiling = ceilingOf(space, plan.tier)
  const centreX = -14.5
  const frontZ = -3.08

  // Deep concrete canopy and the two massive facade piers from the panel.
  into.box([12.1, 0.34, 0.9], {
    at: [centreX, floor + 3.22, frontZ - 0.12],
    colour: JUSTICE_STONE,
  })
  for (const x of [-20.15, -8.85]) {
    into.box([0.62, 3.55, 0.72], {
      at: [x, floor + 1.775, frontZ],
      colour: JUSTICE_STONE,
    })
    into.box([0.78, 0.2, 0.86], {
      at: [x, floor + 3.5, frontZ],
      colour: JUSTICE_STONE,
    })
  }

  // Three glazed entrance bays.  The centre bay reads as a double door while
  // the lateral bays reproduce the broad glazed frontage in the manga panel.
  const bayCentres = [-17.85, centreX, -11.15]
  for (const x of bayCentres) {
    into.box([3.05, 2.65, 0.035], {
      at: [x, floor + 1.34, frontZ - 0.02],
      colour: JUSTICE_GLASS,
    })
    for (const mullionX of [x - 1.5, x, x + 1.5]) {
      into.box([0.09, 2.72, 0.12], {
        at: [mullionX, floor + 1.36, frontZ],
        colour: JUSTICE_STEEL,
      })
    }
    into.box([3.08, 0.09, 0.12], {
      at: [x, floor + 2.68, frontZ],
      colour: JUSTICE_STEEL,
    })
    into.box([3.08, 0.07, 0.1], {
      at: [x, floor + 1.48, frontZ],
      colour: JUSTICE_STEEL,
    })
  }

  // Door leaves, central meeting stile and paired pull handles.
  into.box([0.08, 2.55, 0.13], {
    at: [centreX, floor + 1.28, frontZ - 0.01],
    colour: JUSTICE_STEEL,
  })
  for (const side of [-1, 1]) {
    into.box([0.035, 0.58, 0.07], {
      at: [centreX + side * 0.16, floor + 1.14, frontZ - 0.09],
      colour: JUSTICE_BRASS,
    })
  }

  // Clerestory behind the canopy evokes the stacked office galleries without
  // inventing additional walkable floors above the four-metre lobby.
  into.box([10.5, 0.62, 0.035], {
    at: [centreX, floor + 3.62, frontZ - 0.02],
    colour: JUSTICE_GLASS,
  })
  for (let x = centreX - 5.25; x <= centreX + 5.25; x += 1.5) {
    into.box([0.055, 0.66, 0.1], {
      at: [x, floor + 3.62, frontZ],
      colour: JUSTICE_STEEL,
    })
  }

  // Coffered/skylight grid, the strongest silhouette in the supplied panel.
  const gridY = floor + ceiling - 0.08
  for (let x = -20; x <= -9; x += 1.55) {
    into.box([0.045, 0.06, 8.8], {
      at: [x, gridY, -7.7],
      colour: JUSTICE_STEEL,
    })
  }
  for (let z = -11.9; z <= -3.5; z += 1.4) {
    into.box([11.1, 0.06, 0.045], {
      at: [centreX, gridY, z],
      colour: JUSTICE_STEEL,
    })
  }

  // Blank oval institutional medallion centred above the reception counter,
  // matching the panel without inventing a logo or wording absent from it.
  into.sphere([0.58, 0.82, 0.045], {
    at: [centreX, floor + 2.62, -12.39],
    colour: JUSTICE_WOOD,
  })
  into.sphere([0.5, 0.72, 0.05], {
    at: [centreX, floor + 2.62, -12.34],
    colour: JUSTICE_STONE,
  })
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

  dressJusticeAtriumEntrance(options)

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
