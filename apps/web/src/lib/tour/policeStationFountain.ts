import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  POLICE_BRASS,
  POLICE_GOLD,
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
 * Ornate tiered monumental fountain of the Central Police Station atrium (ch. 392).
 * Modeled with octagonal primary basin, concentric intermediate tier,
 * fluted pedestal column, upper spill bowl and ornamental bronze finial.
 */
export function dressPoliceTieredFountain(options: FountainOptions): void {
  const {
    into,
    center: [cx, cz],
    floor,
  } = options

  // Level 1: Octagonal primary basin curb
  into.cylinder(
    { radius: 2.2, height: 0.65, sides: 8 },
    { at: [cx, floor + 0.325, cz], colour: POLICE_GRANITE_DARK },
  )
  into.cylinder(
    { radius: 2.05, height: 0.15, sides: 8 },
    { at: [cx, floor + 0.65 + 0.075, cz], colour: POLICE_STONE },
  )

  // Primary water pool
  into.cylinder(
    { radius: 1.85, height: 0.1, sides: 8 },
    { at: [cx, floor + 0.52, cz], colour: POLICE_WATER },
  )

  // Level 2: Intermediate tiered basin with overflow spillways
  into.cylinder(
    { radius: 1.25, height: 0.45, sides: 8 },
    { at: [cx, floor + 0.65 + 0.225, cz], colour: POLICE_GRANITE },
  )
  into.cylinder(
    { radius: 1.35, height: 0.12, sides: 8 },
    { at: [cx, floor + 1.1 + 0.06, cz], colour: POLICE_STONE },
  )
  into.cylinder(
    { radius: 1.1, height: 0.08, sides: 8 },
    { at: [cx, floor + 1.14, cz], colour: POLICE_WATER },
  )

  // Level 3: Fluted central pedestal
  into.cylinder(
    { radius: 0.42, height: 0.8 },
    { at: [cx, floor + 1.2 + 0.4, cz], colour: POLICE_STONE },
  )
  into.cylinder(
    { radius: 0.5, height: 0.12 },
    { at: [cx, floor + 1.2 + 0.06, cz], colour: POLICE_GRANITE_DARK },
  )

  // Level 4: Upper chalice bowl
  into.cylinder(
    { radius: 0.85, height: 0.25, bottom: 0.42 },
    { at: [cx, floor + 2.0 + 0.125, cz], colour: POLICE_STONE },
  )
  into.cylinder(
    { radius: 0.72, height: 0.06 },
    { at: [cx, floor + 2.2 + 0.03, cz], colour: POLICE_WATER },
  )

  // Top finial & water spray jet
  into.cylinder(
    { radius: 0.1, height: 0.45 },
    { at: [cx, floor + 2.25 + 0.225, cz], colour: POLICE_BRASS },
  )
  into.sphere([0.18, 0.25, 0.18], { at: [cx, floor + 2.75, cz], colour: POLICE_GOLD })
  into.cylinder(
    { radius: 0.08, height: 0.6 },
    { at: [cx, floor + 2.9 + 0.3, cz], colour: POLICE_WATER },
  )
}
