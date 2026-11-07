import {
  wallBays,
  wallBox,
  wallPoint,
  type WallBay,
  type WallSurface,
} from './corridorWallLayout'

const MAHOGANY = 0x3a1f18
const MAHOGANY_DARK = 0x271913
const GOLD_MOULDING = 0xba9650
const WARM_BRASS = 0x8a724d
const SCONCE_LUMEN = 0xfef2d8

interface Tier1WallContext {
  floor: number
  ceiling: number
}

function wainscoting(wall: WallSurface, floor: number): void {
  const { length } = wall.run
  // Baseboard plinth along floor
  wallBox(wall, [length, 0.14, 0.04], {
    along: length / 2,
    y: floor + 0.07,
    colour: MAHOGANY_DARK,
    inset: 0.02,
  })

  // Lower wainscot body
  wallBox(wall, [length, 0.86, 0.025], {
    along: length / 2,
    y: floor + 0.57,
    colour: MAHOGANY,
    inset: 0.015,
  })

  // Polished gold dado chair-rail
  wallBox(wall, [length, 0.05, 0.045], {
    along: length / 2,
    y: floor + 1.025,
    colour: GOLD_MOULDING,
    inset: 0.025,
  })
}

function panelMouldings(wall: WallSurface, bay: WallBay, floor: number): void {
  const bayW = bay.width
  const along = bay.along

  // Lower recessed boiserie panel frame
  wallBox(wall, [bayW, 0.03, 0.015], {
    along,
    y: floor + 0.22,
    colour: MAHOGANY_DARK,
    inset: 0.026,
  })
  wallBox(wall, [bayW, 0.03, 0.015], {
    along,
    y: floor + 0.92,
    colour: MAHOGANY_DARK,
    inset: 0.026,
  })
  for (const side of [-1, 1]) {
    wallBox(wall, [0.03, 0.7, 0.015], {
      along: along + (side * bayW) / 2,
      y: floor + 0.57,
      colour: MAHOGANY_DARK,
      inset: 0.026,
    })
  }

  // Upper classical wall mouldings
  wallBox(wall, [bayW, 0.025, 0.015], {
    along,
    y: floor + 1.25,
    colour: GOLD_MOULDING,
    inset: 0.012,
  })
  wallBox(wall, [bayW, 0.025, 0.015], {
    along,
    y: floor + 2.35,
    colour: GOLD_MOULDING,
    inset: 0.012,
  })
  for (const side of [-1, 1]) {
    wallBox(wall, [0.025, 1.1, 0.015], {
      along: along + (side * bayW) / 2,
      y: floor + 1.8,
      colour: GOLD_MOULDING,
      inset: 0.012,
    })
  }
}

function wallSconce(wall: WallSurface, bay: WallBay, floor: number): void {
  // Brass bracket mounting
  wallBox(wall, [0.08, 0.22, 0.06], {
    along: bay.along,
    y: floor + 1.82,
    colour: WARM_BRASS,
    inset: 0.035,
  })

  // Horizontal sconce arm
  wallBox(wall, [0.04, 0.04, 0.14], {
    along: bay.along,
    y: floor + 1.78,
    colour: WARM_BRASS,
    inset: 0.09,
  })

  // Frosted lantern luminaire
  const lampPt = wallPoint(wall.run, {
    along: bay.along,
    y: floor + 1.86,
    inset: 0.16,
  })
  wall.into.cylinder(
    { radius: 0.055, height: 0.12, sides: 6 },
    { at: lampPt, colour: SCONCE_LUMEN, glow: true },
  )
}

/** Dresses a Tier 1 royal corridor wall run with classical wainscoting and sconces. */
export function dressTier1CorridorWall(
  wall: WallSurface,
  context: Tier1WallContext,
): void {
  const { floor, ceiling } = context
  wainscoting(wall, floor)

  // Crown moulding below ceiling
  wallBox(wall, [wall.run.length, 0.08, 0.06], {
    along: wall.run.length / 2,
    y: ceiling - 0.04,
    colour: GOLD_MOULDING,
    inset: 0.03,
  })

  // Architectural bays with panels and sconces
  const bays = wallBays(wall.run, 3.4)
  for (const bay of bays) {
    panelMouldings(wall, bay, floor)
    wallSconce(wall, bay, floor)
  }
}
