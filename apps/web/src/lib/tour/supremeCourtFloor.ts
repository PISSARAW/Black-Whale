import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  COURT_BRASS,
  COURT_CARPET_BORDER,
  COURT_CARPET_RED,
  COURT_GOLD,
  COURT_MAHOGANY,
  COURT_PARQUET_DARK,
  COURT_PARQUET_LIGHT,
  COURT_WALNUT,
} from './supremeCourtDetailSurface'

export interface CourtFloorOptions {
  into: BanquetDetailBuilder
  floor: number
}

/** Perimeter border frame and alternating parquet field across 42x28m hall */
function dressCourtParquet(into: BanquetDetailBuilder, floor: number): void {
  const floorY = floor + 0.005

  // Dark walnut perimeter border around courtroom (x: 80.5 to 122.5, z: 24.5 to 52.5)
  into.box([41.6, 0.006, 0.8], { at: [101.5, floorY, 24.9], colour: COURT_WALNUT })
  into.box([41.6, 0.006, 0.8], { at: [101.5, floorY, 52.1], colour: COURT_WALNUT })
  into.box([0.8, 0.006, 26.4], { at: [80.9, floorY, 38.5], colour: COURT_WALNUT })
  into.box([0.8, 0.006, 26.4], { at: [122.1, floorY, 38.5], colour: COURT_WALNUT })

  // Alternating transversal parquet bands across the floor field
  for (let x = 83.5; x <= 113.5; x += 3.0) {
    const isDark = Math.round(x) % 2 === 0
    into.box([2.8, 0.005, 25.6], {
      at: [x, floorY, 38.5],
      colour: isDark ? COURT_PARQUET_DARK : COURT_PARQUET_LIGHT,
    })
  }
}

/** Elevated 3-tier stepped dais platform for the Supreme Magistrate's bench */
function dressMagistrateDais(into: BanquetDetailBuilder, floor: number): void {
  // Tier 1 base platform (+0.4m)
  into.box([8.0, 0.4, 14.4], { at: [118.2, floor + 0.2, 38.5], colour: COURT_MAHOGANY })
  into.box([8.1, 0.06, 14.5], { at: [118.2, floor + 0.41, 38.5], colour: COURT_WALNUT })

  // Tier 2 intermediate platform (+0.8m)
  into.box([6.6, 0.4, 12.2], { at: [118.9, floor + 0.6, 38.5], colour: COURT_MAHOGANY })
  into.box([6.7, 0.06, 12.3], { at: [118.9, floor + 0.81, 38.5], colour: COURT_WALNUT })

  // Tier 3 top bench platform (+1.2m)
  into.box([5.4, 0.4, 10.6], { at: [119.5, floor + 1.0, 38.5], colour: COURT_MAHOGANY })
  into.box([5.5, 0.06, 10.7], { at: [119.5, floor + 1.21, 38.5], colour: COURT_WALNUT })

  // Ceremonial central access stairs (3 steps, width 3.2m, rising to top platform)
  for (let step = 0; step < 3; step++) {
    const sx = 114.2 + step * 0.45
    const stepH = (step + 1) * 0.4
    into.box([0.48, stepH, 3.2], { at: [sx, floor + stepH / 2, 38.5], colour: COURT_MAHOGANY })
    into.box([0.5, 0.05, 3.26], { at: [sx, floor + stepH + 0.025, 38.5], colour: COURT_CARPET_RED })
  }

  // Brass stair handrails
  for (const sideZ of [36.8, 40.2]) {
    into.box([1.4, 0.05, 0.05], { at: [114.8, floor + 1.5, sideZ], colour: COURT_BRASS })
    into.cylinder(
      { radius: 0.02, height: 0.9 },
      { at: [114.2, floor + 0.85, sideZ], colour: COURT_BRASS },
    )
    into.cylinder(
      { radius: 0.02, height: 0.9 },
      { at: [115.4, floor + 1.25, sideZ], colour: COURT_BRASS },
    )
  }
}

/** Ceremonial red carpet runner with gold Greek-key borders leading to the bench */
function dressCourtCarpet(into: BanquetDetailBuilder, floor: number): void {
  const carpetY = floor + 0.008

  // Main red carpet runner running from entrance (x = 81.0) to dais stairs (x = 114.2)
  into.box([33.2, 0.007, 3.6], { at: [97.6, carpetY, 38.5], colour: COURT_CARPET_RED })

  // Gold border strips framing the carpet
  into.box([33.2, 0.009, 0.08], { at: [97.6, carpetY + 0.001, 36.74], colour: COURT_CARPET_BORDER })
  into.box([33.2, 0.009, 0.08], { at: [97.6, carpetY + 0.001, 40.26], colour: COURT_CARPET_BORDER })

  // Transversal gold Greek-key insets along the carpet length
  for (let x = 84.0; x <= 112.0; x += 4.0) {
    into.box([0.12, 0.009, 3.44], { at: [x, carpetY + 0.001, 38.5], colour: COURT_GOLD })
  }
}

/** Tiered risers for the public and delegation gallery benches */
function dressGalleryRisers(into: BanquetDetailBuilder, floor: number): void {
  // South gallery risers (z: 24.8 to 27.8)
  into.box([21.2, 0.3, 3.0], { at: [105.0, floor + 0.15, 26.3], colour: COURT_MAHOGANY })
  into.box([21.2, 0.3, 1.5], { at: [105.0, floor + 0.45, 25.5], colour: COURT_MAHOGANY })
  into.box([21.0, 0.02, 2.9], { at: [105.0, floor + 0.31, 26.3], colour: COURT_PARQUET_DARK })

  // North gallery risers (z: 49.2 to 52.2)
  into.box([21.2, 0.3, 3.0], { at: [105.0, floor + 0.15, 50.7], colour: COURT_MAHOGANY })
  into.box([21.2, 0.3, 1.5], { at: [105.0, floor + 0.45, 51.5], colour: COURT_MAHOGANY })
  into.box([21.0, 0.02, 2.9], { at: [105.0, floor + 0.31, 50.7], colour: COURT_PARQUET_DARK })
}

/** Complete ceremonial flooring and tiered platforms of the Supreme Court */
export function dressSupremeCourtFloor(options: CourtFloorOptions): void {
  const { into, floor } = options
  dressCourtParquet(into, floor)
  dressCourtCarpet(into, floor)
  dressMagistrateDais(into, floor)
  dressGalleryRisers(into, floor)
}
