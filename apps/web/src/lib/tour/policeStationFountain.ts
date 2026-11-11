import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  POLICE_GRANITE,
  POLICE_GRANITE_DARK,
  POLICE_STONE,
  POLICE_WATER,
} from './policeStationDetailSurface'
import type { Vec2 } from './types'

export interface FountainOptions {
  into: BanquetDetailBuilder
  center: Vec2
  floor: number
}

/**
 * Low circular fountain in the middle of the Central Police Station atrium.
 * The panel shows a broad stone lip and a compact, irregular sculptural spray;
 * it is deliberately much lower than the surrounding people and columns.
 */
export function dressPoliceTieredFountain(options: FountainOptions): void {
  const {
    into,
    center: [cx, cz],
    floor,
  } = options

  // Broad, low outer bowl.
  into.cylinder(
    { radius: 1.55, height: 0.28, sides: 16 },
    { at: [cx, floor + 0.14, cz], colour: POLICE_GRANITE_DARK },
  )
  into.cylinder(
    { radius: 1.48, height: 0.16, sides: 16 },
    { at: [cx, floor + 0.34, cz], colour: POLICE_STONE },
  )
  into.cylinder(
    { radius: 1.25, height: 0.06, sides: 16 },
    { at: [cx, floor + 0.39, cz], colour: POLICE_WATER },
  )

  // The small stepped rock/sculpture at the centre replaces the invented tall
  // chalice and finial. Slightly offset blocks keep its silhouette organic.
  into.cylinder(
    { radius: 0.7, height: 0.24, sides: 10 },
    { at: [cx, floor + 0.51, cz], colour: POLICE_GRANITE },
  )
  into.sphere([0.48, 0.42, 0.42], {
    at: [cx - 0.18, floor + 0.78, cz + 0.08],
    colour: POLICE_STONE,
  })
  into.sphere([0.34, 0.5, 0.32], {
    at: [cx + 0.2, floor + 1.02, cz - 0.05],
    colour: POLICE_GRANITE,
  })
  into.sphere([0.18, 0.3, 0.18], {
    at: [cx + 0.05, floor + 1.35, cz],
    colour: POLICE_WATER,
  })
}
