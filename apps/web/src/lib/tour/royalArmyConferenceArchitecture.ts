import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import { ARMY_FLOOR, ARMY_FRAME } from './royalArmyConferenceDetailSurface'
import {
  dressBriefingScreenDisplay,
  dressTacticalChartBoardDisplay,
} from './royalArmyConferenceScreenDisplay'
import type { Space } from './types'

export interface ArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

/** Chapter 380: light square tiles and plain large wall panels. Metrics remain reconstructed. */
export function dressRoyalArmyConferenceArchitecture({
  into,
  plan,
  space,
}: ArchitectureContext): void {
  const floor = floorOf(space, plan.tier)
  const xs = space.footprint.map(([x]) => x),
    zs = space.footprint.map(([, z]) => z)
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minZ = Math.min(...zs),
    maxZ = Math.max(...zs)
  into.box([maxX - minX - 0.04, 0.008, maxZ - minZ - 0.04], {
    at: [(minX + maxX) / 2, floor + 0.004, (minZ + maxZ) / 2],
    colour: ARMY_FLOOR,
  })
  for (let x = minX + 1.25; x < maxX - 0.1; x += 1.25)
    into.box([0.014, 0.003, maxZ - minZ - 0.06], { at: [x, floor + 0.01, 0], colour: ARMY_FRAME })
  for (let z = minZ + 1.25; z < maxZ - 0.1; z += 1.25)
    into.box([maxX - minX - 0.06, 0.003, 0.014], { at: [0, floor + 0.01, z], colour: ARMY_FRAME })
  const height = ceilingOf(space, plan.tier)
  for (const run of banquetWallRuns(plan, space)) {
    into.box([run.length, 0.1, 0.045], {
      at: wallPoint(run, { along: run.length / 2, y: floor + 0.05, inset: 0.025 }),
      rotation: [0, run.angle, 0],
      colour: ARMY_FRAME,
    })
    into.box([run.length, 0.04, 0.025], {
      at: wallPoint(run, { along: run.length / 2, y: floor + 1.1, inset: 0.02 }),
      rotation: [0, run.angle, 0],
      colour: ARMY_FRAME,
    })
    const panels = Math.max(1, Math.round(run.length / 2.5))
    for (let n = 1; n < panels; n++)
      into.box([0.016, height - 0.1, 0.02], {
        at: wallPoint(run, {
          along: (run.length * n) / panels,
          y: floor + height / 2,
          inset: 0.02,
        }),
        rotation: [0, run.angle, 0],
        colour: ARMY_FRAME,
      })
  }
}

export const dressBriefingScreen = dressBriefingScreenDisplay
export const dressTacticalChartBoard = dressTacticalChartBoardDisplay
