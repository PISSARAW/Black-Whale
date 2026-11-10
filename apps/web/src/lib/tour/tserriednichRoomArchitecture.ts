import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import type { Space } from './types'
import {
  TSERRIEDNICH_DARK_WOOD,
  TSERRIEDNICH_GOLD_TRIM,
  TSERRIEDNICH_PANEL_WOOD,
} from './tserriednichRoomDetailSurface'

export interface TserriednichArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

/** Moulded wall panels, chest-height, as behind Tserriednich in chs. 384-387. */
function mouldedWallPanels(context: TserriednichArchitectureContext): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)

  for (const run of banquetWallRuns(plan, space)) {
    const baseboard: [number, number, number, number][] = [
      [0.12, 0.24, 0.07, TSERRIEDNICH_DARK_WOOD],
      [0.78, 0.045, 0.08, TSERRIEDNICH_GOLD_TRIM],
    ]
    for (const [y, height, depth, colour] of baseboard) {
      into.box([run.length, height, depth], {
        at: wallPoint(run, { along: run.length / 2, y: floor + y, inset: depth / 2 }),
        rotation: [0, run.angle, 0],
        colour,
      })
    }

    const panelCount = Math.max(1, Math.floor(run.length / 1.6))
    for (let i = 0; i < panelCount; i++) {
      const along = ((i + 0.5) * run.length) / panelCount
      into.box([1.05, 1.85, 0.03], {
        at: wallPoint(run, { along, y: floor + 2.0, inset: 0.03 }),
        rotation: [0, run.angle, 0],
        colour: TSERRIEDNICH_PANEL_WOOD,
      })
      into.box([0.9, 1.68, 0.035], {
        at: wallPoint(run, { along, y: floor + 2.0, inset: 0.035 }),
        rotation: [0, run.angle, 0],
        colour: 0x241b13,
      })
    }
  }
}

/** Flat coffered panels, a quieter register than the banquet hall's heavy beams. */
function panelledCeiling(context: TserriednichArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const ceiling = ceilingOf(space, plan.tier)
  const topY = floor + ceiling

  const xs = space.footprint.map(([x]) => x)
  const zs = space.footprint.map(([, z]) => z)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)
  const width = maxX - minX
  const depth = maxZ - minZ

  const cols = 6
  const rows = 3
  for (let i = 0; i <= cols; i++) {
    const x = minX + (i * width) / cols
    into.box([0.14, 0.16, depth], { at: [x, topY - 0.08, (minZ + maxZ) / 2], colour: TSERRIEDNICH_GOLD_TRIM })
  }
  for (let j = 0; j <= rows; j++) {
    const z = minZ + (j * depth) / rows
    into.box([width, 0.14, 0.14], { at: [(minX + maxX) / 2, topY - 0.07, z], colour: TSERRIEDNICH_GOLD_TRIM })
  }
}

export function dressTserriednichRoomArchitecture(context: TserriednichArchitectureContext): void {
  mouldedWallPanels(context)
  panelledCeiling(context)
}
