import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  HANGAR_CONCRETE,
  HANGAR_HAZARD_BLACK,
  HANGAR_HAZARD_YELLOW,
  HANGAR_STEEL_DARK,
  HANGAR_STEEL_LIGHT,
  HANGAR_STEEL_PANEL,
} from './hangarEntranceDetailSurface'

export interface HangarFloorOptions {
  into: BanquetDetailBuilder
  floor: number
}

/** Heavy industrial diamond-plate steel deck with welded seams across 28x6.5m floor */
function dressDeckPlates(into: BanquetDetailBuilder, floor: number): void {
  const floorY = floor + 0.005

  // Dark industrial steel perimeter border around the 28m x 6.5m room (x: -14 to 14, z: -3 to 3.5)
  into.box([27.6, 0.006, 0.35], { at: [0.0, floorY, -2.8], colour: HANGAR_STEEL_DARK })
  into.box([27.6, 0.006, 0.35], { at: [0.0, floorY, 3.3], colour: HANGAR_STEEL_DARK })
  into.box([0.35, 0.006, 6.2], { at: [-13.8, floorY, 0.25], colour: HANGAR_STEEL_DARK })
  into.box([0.35, 0.006, 6.2], { at: [13.8, floorY, 0.25], colour: HANGAR_STEEL_DARK })

  // Alternating steel plates across floor field
  for (let x = -12.0; x <= 12.0; x += 4.0) {
    const isDark = Math.round(Math.abs(x)) % 8 === 0
    into.box([3.8, 0.005, 5.8], {
      at: [x, floorY, 0.25],
      colour: isDark ? HANGAR_STEEL_DARK : HANGAR_STEEL_PANEL,
    })
    // Welded transverse joint seam between plates
    into.box([0.08, 0.008, 5.8], { at: [x + 1.95, floorY + 0.001, 0.25], colour: HANGAR_CONCRETE })
  }
}

/** High-visibility yellow and black hazard safety bands bordering the freight gate apron */
function dressHazardSafetyBands(into: BanquetDetailBuilder, floor: number): void {
  const stripeY = floor + 0.008

  // Main apron warning perimeter around the 10m gate opening (x: -5.2 to 5.2, z = -2.6)
  into.box([10.4, 0.006, 0.25], { at: [0.0, stripeY, -2.6], colour: HANGAR_HAZARD_YELLOW })

  // Alternating hazard stripes along the apron border
  for (let x = -5.0; x <= 5.0; x += 0.5) {
    into.box([0.22, 0.007, 0.25], { at: [x, stripeY + 0.001, -2.6], colour: HANGAR_HAZARD_BLACK })
  }

  // Pedestrian walkway guide line along the southern transit corridor (z = 2.6)
  into.box([27.0, 0.006, 0.12], { at: [0.0, stripeY, 2.6], colour: HANGAR_HAZARD_YELLOW })
}

/** Recessed heavy cargo tie-down tracks and drainage gutters */
function dressTieDownTracks(into: BanquetDetailBuilder, floor: number): void {
  const trackY = floor + 0.006

  // Two longitudinal cargo tie-down L-tracks running across the bay
  for (const tz of [-0.5, 1.2]) {
    into.box([26.0, 0.007, 0.14], { at: [0.0, trackY, tz], colour: HANGAR_STEEL_LIGHT })
    // Tie-down anchor cups spaced every 2 metres
    for (let x = -12.0; x <= 12.0; x += 2.0) {
      into.box([0.16, 0.009, 0.16], { at: [x, trackY + 0.001, tz], colour: HANGAR_STEEL_DARK })
    }
  }

  // Cast-iron drainage gutters near west and east walls
  for (const gx of [-13.2, 13.2]) {
    into.box([0.4, 0.005, 5.8], { at: [gx, trackY, 0.25], colour: HANGAR_STEEL_DARK })
    for (let z = -2.4; z <= 2.8; z += 0.8) {
      into.box([0.36, 0.008, 0.12], { at: [gx, trackY + 0.001, z], colour: HANGAR_CONCRETE })
    }
  }
}

/** Raised anti-slip diamond-plate lugs, alternating in orientation row by row */
function dressTreadLugs(into: BanquetDetailBuilder, floor: number): void {
  const lugY = floor + 0.012
  for (let x = -13.0; x <= 13.0; x += 0.8) {
    for (let z = -2.3; z <= 3.0; z += 0.7) {
      const flip = Math.round((x + 13.0) / 0.8) % 2 === 0
      into.box(flip ? [0.3, 0.012, 0.06] : [0.06, 0.012, 0.3], {
        at: [x, lugY, z],
        colour: HANGAR_STEEL_LIGHT,
      })
    }
  }
}

/** Complete industrial flooring and pavement marking of Tier 5 Hangar Entrance */
export function dressHangarEntranceFloor(options: HangarFloorOptions): void {
  const { into, floor } = options
  dressDeckPlates(into, floor)
  dressHazardSafetyBands(into, floor)
  dressTieDownTracks(into, floor)
  dressTreadLugs(into, floor)
}
