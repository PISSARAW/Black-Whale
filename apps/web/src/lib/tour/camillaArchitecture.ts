import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import type { Space } from './types'
import {
  CAMILLA_CARPET,
  CAMILLA_CARPET_BORDER,
  CAMILLA_GOLD,
  CAMILLA_TAPESTRY_BLUE,
  CAMILLA_WOOD,
} from './camillaDetailSurface'

export interface ArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

function salonCarpet(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const atY = floor + 0.008
  const cx = -0.5
  const cz = 2.4
  const w = 12.0
  const d = 4.8

  // Main burgundy velvet carpet
  into.box([w, 0.015, d], {
    at: [cx, atY, cz],
    colour: CAMILLA_CARPET,
  })

  // Gold embroidered borders
  const trim = 0.12
  for (const side of [-1, 1]) {
    into.box([w, 0.018, trim], {
      at: [cx, atY + 0.002, cz + (side * (d - trim)) / 2],
      colour: CAMILLA_CARPET_BORDER,
    })
    into.box([trim, 0.018, d - trim * 2], {
      at: [cx + (side * (w - trim)) / 2, atY + 0.002, cz],
      colour: CAMILLA_CARPET_BORDER,
    })
  }
}

function wallMouldings(context: ArchitectureContext): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)

  for (const run of banquetWallRuns(plan, space)) {
    // Plinth, dado rail and cornice
    const mouldings: Array<[number, number, number, number]> = [
      [0.15, 0.28, 0.08, CAMILLA_WOOD],
      [0.9, 0.06, 0.09, CAMILLA_WOOD],
      [0.94, 0.02, 0.095, CAMILLA_GOLD],
      [2.6, 0.04, 0.06, CAMILLA_GOLD],
      [3.82, 0.14, 0.16, CAMILLA_WOOD],
      [3.94, 0.04, 0.18, CAMILLA_GOLD],
    ]
    for (const [y, height, depth, col] of mouldings) {
      into.box([run.length, height, depth], {
        at: wallPoint(run, { along: run.length / 2, y: floor + y, inset: depth / 2 }),
        rotation: [0, run.angle, 0],
        colour: col,
      })
    }

    // Repeated vertical panels
    const panelCount = Math.max(1, Math.floor(run.length / 1.8))
    for (let i = 0; i < panelCount; i++) {
      const along = ((i + 0.5) * run.length) / panelCount
      into.box([0.95, 1.25, 0.035], {
        at: wallPoint(run, { along, y: floor + 1.8, inset: 0.04 }),
        rotation: [0, run.angle, 0],
        colour: CAMILLA_WOOD,
      })
      into.box([0.85, 1.15, 0.04], {
        at: wallPoint(run, { along, y: floor + 1.8, inset: 0.045 }),
        rotation: [0, run.angle, 0],
        colour: CAMILLA_GOLD,
      })
    }
  }
}

function wallTapestry(context: ArchitectureContext, runIndex: number): void {
  const { into, plan, space } = context
  const runs = banquetWallRuns(plan, space)
  if (runIndex >= runs.length) return
  const run = runs[runIndex]!
  const floor = floorOf(space, plan.tier)
  const mid = run.length / 2
  const tapW = Math.min(3.2, run.length * 0.7)
  const tapH = 1.9

  // Gilded hanging rod & finials
  into.cylinder(
    { radius: 0.025, height: tapW + 0.3, sides: 12 },
    {
      at: wallPoint(run, { along: mid, y: floor + 3.1, inset: 0.08 }),
      rotation: [0, run.angle, Math.PI / 2],
      colour: CAMILLA_GOLD,
    },
  )
  for (const side of [-1, 1]) {
    into.sphere([0.05, 0.05, 0.05], {
      at: wallPoint(run, { along: mid + (side * (tapW + 0.3)) / 2, y: floor + 3.1, inset: 0.08 }),
      colour: CAMILLA_GOLD,
    })
  }

  // Woven damask tapestry body
  into.box([tapW, tapH, 0.03], {
    at: wallPoint(run, { along: mid, y: floor + 3.1 - tapH / 2 - 0.03, inset: 0.07 }),
    rotation: [0, run.angle, 0],
    colour: CAMILLA_TAPESTRY_BLUE,
  })

  // Lower golden fringe
  into.box([tapW, 0.08, 0.035], {
    at: wallPoint(run, { along: mid, y: floor + 3.1 - tapH - 0.04, inset: 0.075 }),
    rotation: [0, run.angle, 0],
    colour: CAMILLA_GOLD,
  })
}

function diningChandelier(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const ceiling = ceilingOf(space, plan.tier)
  const at = [6.0, floor, -2.7] as const

  // Downrod
  const rodH = ceiling - floor - 1.1
  into.cylinder(
    { radius: 0.02, height: rodH, sides: 8 },
    {
      at: [at[0], floor + 1.1 + rodH / 2, at[2]],
      colour: CAMILLA_GOLD,
    },
  )

  // Circular crown & glass droplets
  into.ring({ radius: 0.65, tube: 0.03 }, { at: [at[0], floor + 1.1, at[2]], colour: CAMILLA_GOLD })
  into.sphere([0.22, 0.12, 0.22], { at: [at[0], floor + 1.05, at[2]], colour: CAMILLA_GOLD })
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8
    const dx = Math.cos(angle) * 0.65
    const dz = Math.sin(angle) * 0.65
    into.cylinder(
      { radius: 0.015, height: 0.18, sides: 6 },
      {
        at: [at[0] + dx, floor + 0.98, at[2] + dz],
        colour: 0xffffff,
      },
    )
  }
}

export function dressCamillaLivingArchitecture(context: ArchitectureContext): void {
  salonCarpet(context)
  wallMouldings(context)
  wallTapestry(context, 0)
  wallTapestry(context, 1)
}

export function dressCamillaDiningArchitecture(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)

  // Dining rug under table
  into.box([3.8, 0.012, 4.6], {
    at: [6.0, floor + 0.006, -2.7],
    colour: CAMILLA_CARPET,
  })
  into.box([3.9, 0.015, 0.08], {
    at: [6.0, floor + 0.008, -2.7 - 2.25],
    colour: CAMILLA_CARPET_BORDER,
  })
  into.box([3.9, 0.015, 0.08], {
    at: [6.0, floor + 0.008, -2.7 + 2.25],
    colour: CAMILLA_CARPET_BORDER,
  })

  wallMouldings(context)
  diningChandelier(context)
}

export function dressCamillaEntranceArchitecture(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const ceiling = ceilingOf(space, plan.tier)

  // Subtle floor runner in the entrance corridor
  into.box([1.4, 0.01, 6.2], {
    at: [0.0, floor + 0.005, -6.45],
    colour: 0x2b2b32,
  })

  // Surveillance ceiling fixture
  into.cylinder(
    { radius: 0.16, height: 0.06, sides: 12 },
    {
      at: [0.4, ceiling - 0.03, -6.5],
      colour: 0x888888,
    },
  )
}

export function dressCamillaArchitecture(context: ArchitectureContext): void {
  const { space } = context
  if (space.id.endsWith('-living')) {
    dressCamillaLivingArchitecture(context)
  } else if (space.id.endsWith('-dining')) {
    dressCamillaDiningArchitecture(context)
  } else if (space.id.endsWith('-entrance')) {
    dressCamillaEntranceArchitecture(context)
  }
}
