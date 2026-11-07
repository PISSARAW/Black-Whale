import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import type { Space } from './types'
import {
  BENJAMIN_BRONZE,
  BENJAMIN_DARK_WOOD,
  BENJAMIN_STONE,
  BENJAMIN_GOLD_TRIM,
} from './benjaminRoomDetailSurface'

export interface ArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

function wallMouldings(context: ArchitectureContext): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)

  for (const run of banquetWallRuns(plan, space)) {
    const trims: [number, number, number, number][] = [
      [0.15, 0.28, 0.08, BENJAMIN_DARK_WOOD],
      [0.85, 0.05, 0.09, BENJAMIN_DARK_WOOD],
      [0.88, 0.02, 0.095, BENJAMIN_BRONZE],
      [2.6, 0.035, 0.06, BENJAMIN_BRONZE],
      [3.82, 0.12, 0.14, BENJAMIN_DARK_WOOD],
      [3.92, 0.04, 0.16, BENJAMIN_BRONZE],
    ]
    for (const [y, height, depth, col] of trims) {
      into.box([run.length, height, depth], {
        at: wallPoint(run, { along: run.length / 2, y: floor + y, inset: depth / 2 }),
        rotation: [0, run.angle, 0],
        colour: col,
      })
    }

    const panelCount = Math.max(1, Math.floor(run.length / 1.8))
    for (let i = 0; i < panelCount; i++) {
      const along = ((i + 0.5) * run.length) / panelCount
      into.box([1.1, 1.4, 0.03], {
        at: wallPoint(run, { along, y: floor + 1.8, inset: 0.035 }),
        rotation: [0, run.angle, 0],
        colour: BENJAMIN_DARK_WOOD,
      })
      into.box([0.98, 1.28, 0.035], {
        at: wallPoint(run, { along, y: floor + 1.8, inset: 0.04 }),
        rotation: [0, run.angle, 0],
        colour: BENJAMIN_BRONZE,
      })
      into.box([0.9, 1.2, 0.04], {
        at: wallPoint(run, { along, y: floor + 1.8, inset: 0.045 }),
        rotation: [0, run.angle, 0],
        colour: 0x27211b,
      })
    }
  }
}

function cofferedCeiling(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const ceiling = ceilingOf(space, plan.tier)
  const topY = floor + ceiling

  const xs = space.footprint.map(([x]) => x)
  const zs = space.footprint.map(([, z]) => z)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minZ = Math.min(...zs), maxZ = Math.max(...zs)
  const width = maxX - minX
  const depth = maxZ - minZ

  const xBeams = 7
  for (let i = 0; i <= xBeams; i++) {
    const x = minX + (i * width) / xBeams
    into.box([0.22, 0.25, depth], {
      at: [x, topY - 0.125, (minZ + maxZ) / 2],
      colour: BENJAMIN_DARK_WOOD,
    })
    into.box([0.26, 0.04, depth], {
      at: [x, topY - 0.23, (minZ + maxZ) / 2],
      colour: BENJAMIN_BRONZE,
    })
  }

  const zBeams = 5
  for (let j = 0; j <= zBeams; j++) {
    const z = minZ + (j * depth) / zBeams
    into.box([width, 0.22, 0.2], {
      at: [(minX + maxX) / 2, topY - 0.11, z],
      colour: BENJAMIN_DARK_WOOD,
    })
    into.box([width, 0.035, 0.24], {
      at: [(minX + maxX) / 2, topY - 0.21, z],
      colour: BENJAMIN_BRONZE,
    })
  }
}

function wallPilasters(context: ArchitectureContext): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)

  for (const run of banquetWallRuns(plan, space)) {
    const count = Math.max(1, Math.round(run.length / 3.5))
    for (let i = 0; i <= count; i++) {
      const along = (i * run.length) / count
      const at = wallPoint(run, { along, y: floor + 2.0, inset: 0.12 })
      into.box([0.28, 4.0, 0.16], {
        at,
        rotation: [0, run.angle, 0],
        colour: BENJAMIN_DARK_WOOD,
      })
      into.box([0.34, 0.25, 0.2], {
        at: [at[0], floor + 0.13, at[2]],
        rotation: [0, run.angle, 0],
        colour: BENJAMIN_STONE,
      })
      into.box([0.34, 0.18, 0.2], {
        at: [at[0], floor + 3.9, at[2]],
        rotation: [0, run.angle, 0],
        colour: BENJAMIN_BRONZE,
      })
    }
  }
}

function militarySconces(context: ArchitectureContext): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)

  for (const run of banquetWallRuns(plan, space)) {
    if (run.length < 2.5) continue
    const count = Math.max(1, Math.floor(run.length / 4.0))
    for (let i = 0; i < count; i++) {
      const along = ((i + 0.5) * run.length) / count
      const back = wallPoint(run, { along, y: floor + 2.4, inset: 0.05 })
      const front = wallPoint(run, { along, y: floor + 2.4, inset: 0.22 })

      into.box([0.14, 0.32, 0.04], {
        at: back,
        rotation: [0, run.angle, 0],
        colour: BENJAMIN_BRONZE,
      })
      into.box([0.04, 0.04, 0.18], {
        at: [(back[0] + front[0]) / 2, floor + 2.32, (back[2] + front[2]) / 2],
        rotation: [0, run.angle, 0],
        colour: BENJAMIN_BRONZE,
      })
      into.cylinder(
        { radius: 0.07, bottom: 0.05, height: 0.12 },
        { at: [front[0], floor + 2.42, front[2]], colour: BENJAMIN_GOLD_TRIM },
      )
      into.sphere([0.04, 0.05, 0.04], {
        at: [front[0], floor + 2.5, front[2]],
        colour: 0xffe2a0,
        glow: true,
      })
    }
  }
}

export function dressBenjaminRoomArchitecture(context: ArchitectureContext): void {
  wallMouldings(context)
  cofferedCeiling(context)
  wallPilasters(context)
  militarySconces(context)
}
