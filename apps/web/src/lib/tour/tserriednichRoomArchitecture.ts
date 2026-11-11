import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import type { Space } from './types'
import {
  TSERRIEDNICH_DARK_WOOD,
  TSERRIEDNICH_GOLD_TRIM,
  TSERRIEDNICH_PANEL_WOOD,
  TSERRIEDNICH_REEDING_GROOVE,
} from './tserriednichRoomDetailSurface'

export interface TserriednichArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

/**
 * The wall behind Tserriednich in chs. 384-387 isn't a few wide mouldings —
 * it's continuous fine vertical reeding, floor to cornice, the full run of
 * the wall. Close-pitched alternating strips read as fluting at a glance;
 * widely spaced panels (the first attempt here) did not.
 */
function reededBoiserie(context: TserriednichArchitectureContext): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)
  const ceiling = ceilingOf(space, plan.tier)

  for (const run of banquetWallRuns(plan, space)) {
    const baseboard: [number, number, number, number][] = [
      [0.12, 0.24, 0.07, TSERRIEDNICH_DARK_WOOD],
      [0.78, 0.045, 0.08, TSERRIEDNICH_GOLD_TRIM],
    ]
    const cornice: [number, number, number, number][] = [
      [ceiling - 0.3, 0.045, 0.08, TSERRIEDNICH_GOLD_TRIM],
      [ceiling - 0.14, 0.2, 0.06, TSERRIEDNICH_DARK_WOOD],
    ]
    for (const [y, height, depth, colour] of [...baseboard, ...cornice]) {
      into.box([run.length, height, depth], {
        at: wallPoint(run, { along: run.length / 2, y: floor + y, inset: depth / 2 }),
        rotation: [0, run.angle, 0],
        colour,
      })
    }

    const fluteHeight = ceiling - 0.9
    const fluteY = floor + 0.82 + fluteHeight / 2
    const pitch = 0.22
    const count = Math.max(4, Math.round(run.length / pitch))
    for (let i = 0; i < count; i++) {
      const along = ((i + 0.5) * run.length) / count
      into.box([pitch * 0.78, fluteHeight, 0.025], {
        at: wallPoint(run, { along, y: fluteY, inset: 0.012 }),
        rotation: [0, run.angle, 0],
        colour: i % 2 === 0 ? TSERRIEDNICH_PANEL_WOOD : TSERRIEDNICH_REEDING_GROOVE,
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
    into.box([0.14, 0.16, depth], {
      at: [x, topY - 0.08, (minZ + maxZ) / 2],
      colour: TSERRIEDNICH_GOLD_TRIM,
    })
  }
  for (let j = 0; j <= rows; j++) {
    const z = minZ + (j * depth) / rows
    into.box([width, 0.14, 0.14], {
      at: [(minX + maxX) / 2, topY - 0.07, z],
      colour: TSERRIEDNICH_GOLD_TRIM,
    })
  }
}

export function dressTserriednichRoomArchitecture(context: TserriednichArchitectureContext): void {
  reededBoiserie(context)
  panelledCeiling(context)
}
