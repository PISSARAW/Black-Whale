import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import type { Space } from './types'
import { UNMA_GOLD, UNMA_STONE, UNMA_WOOD } from './queenUnmaDetailSurface'
export interface ArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

/** Ch. 403 p. 10: moulded light panels, ornate opening and fluted columns. */
export function dressQueenUnmaArchitecture(c: ArchitectureContext): void {
  const { into, plan, space } = c,
    floor = floorOf(space, plan.tier)
  for (const run of banquetWallRuns(plan, space)) {
    for (const [y, h] of [
      [0.12, 0.18],
      [1.1, 0.07],
      [3.95, 0.14],
      [4.18, 0.08],
    ])
      into.box([run.length, h, 0.1], {
        at: wallPoint(run, { along: run.length / 2, y: floor + y, inset: 0.055 }),
        rotation: [0, run.angle, 0],
        colour: UNMA_STONE,
      })
    for (let along = 0.15; along < run.length - 0.1; along += 0.28)
      into.sphere([0.045, 0.07, 0.014], {
        at: wallPoint(run, { along, y: floor + 3.75, inset: 0.05 }),
        rotation: [0, run.angle, 0.5],
        colour: UNMA_GOLD,
      })
    const count = Math.max(1, Math.floor(run.length / 1.4))
    for (let i = 0; i < count; i++) {
      const along = ((i + 0.5) * run.length) / count
      for (const dy of [-0.31, 0.31])
        into.box([1.08, 0.025, 0.03], {
          at: wallPoint(run, { along, y: floor + 0.61 + dy, inset: 0.08 }),
          rotation: [0, run.angle, 0],
          colour: UNMA_GOLD,
        })
      for (const dx of [-0.54, 0.54])
        into.box([0.025, 0.62, 0.03], {
          at: wallPoint(run, { along: along + dx, y: floor + 0.61, inset: 0.08 }),
          rotation: [0, run.angle, 0],
          colour: UNMA_GOLD,
        })
      for (const side of [-1, 1])
        into.sphere([0.045, 0.12, 0.012], {
          at: wallPoint(run, { along: along + side * 0.12, y: floor + 0.61, inset: 0.09 }),
          rotation: [0, run.angle, side * 0.5],
          colour: UNMA_GOLD,
        })
    }
  }
  opening(c)
  floorPattern(c)
  into.box([10.9, 0.08, 29.9], {
    at: [-66.5, floor + ceilingOf(space, plan.tier) - 0.06, -35],
    colour: 0xc2bbaa,
  })
}
function opening(c: ArchitectureContext): void {
  const { into, plan, space } = c,
    floor = floorOf(space, plan.tier)
  const wall = plan.structures.find((s) => s.id.endsWith('-partition-right'))
  if (!wall) return
  const z = wall.at[1] - 0.05
  for (const x of [-71.65, -66.15]) {
    into.box([0.65, 0.24, 0.6], { at: [x, floor + 0.12, z], colour: UNMA_STONE })
    into.box([0.64, 0.22, 0.6], { at: [x, floor + 3.93, z], colour: UNMA_STONE })
    into.cylinder(
      { radius: 0.24, height: 3.65, sides: 20 },
      { at: [x, floor + 1.99, z], colour: UNMA_STONE },
    )
    for (let n = 0; n < 12; n++) {
      const a = (n * Math.PI * 2) / 12
      into.cylinder(
        { radius: 0.013, height: 3.5, sides: 5 },
        { at: [x + Math.cos(a) * 0.24, floor + 1.99, z + Math.sin(a) * 0.24], colour: UNMA_WOOD },
      )
    }
  }
  into.box([5.6, 0.16, 0.32], { at: [-68.9, floor + 3.15, z], colour: UNMA_STONE })
  for (let x = -71.5; x < -66.4; x += 0.24)
    into.sphere([0.04, 0.075, 0.02], { at: [x, floor + 3.32, z + 0.03], colour: UNMA_GOLD })
}
function floorPattern(c: ArchitectureContext): void {
  const { into, space, plan } = c,
    y = floorOf(space, plan.tier) + 0.012
  // The unmeasured floor bands and diamond fields are interpreted from the panel's foreground.
  for (let z = -33; z < -22; z += 3.2)
    for (const side of [-1, 1]) {
      const x = -66.5 + side * 3.6
      into.box([2.0, 0.012, 2.0], {
        at: [x, y, z],
        rotation: [0, Math.PI / 4, 0],
        colour: UNMA_STONE,
      })
      into.box([1.2, 0.014, 1.2], {
        at: [x, y + 0.002, z],
        rotation: [0, Math.PI / 4, 0],
        colour: 0x9d998d,
      })
    }
  for (const x of [-68.5, -64.5])
    into.box([0.1, 0.014, 13.8], { at: [x, y, -27.1], colour: UNMA_WOOD })
}
