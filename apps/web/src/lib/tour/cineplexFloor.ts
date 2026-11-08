import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { CINE_CARPET, CINE_CARPET_GOLD, CINE_MARBLE, CINE_BRASS } from './cineplexDetailSurface'

export interface FloorBounds {
  xMin: number
  xMax: number
  zMin: number
  zMax: number
}

/** Rich patterned art-deco cinema carpet with repeating gold diamond inlays */
export function dressCinemaCarpetPattern(
  into: BanquetDetailBuilder,
  bounds: FloorBounds,
  floorY: number,
): void {
  const { xMin, xMax, zMin, zMax } = bounds
  const width = xMax - xMin
  const depth = zMax - zMin
  const midX = (xMin + xMax) / 2
  const midZ = (zMin + zMax) / 2

  // Base plush carpet bed
  into.box([width, 0.015, depth], {
    at: [midX, floorY + 0.008, midZ],
    colour: CINE_CARPET,
  })

  // Repeating geometric gold/amber motifs
  const stepX = 2.4
  const stepZ = 2.4
  for (let x = xMin + 1.2; x <= xMax - 1.2; x += stepX) {
    for (let z = zMin + 1.2; z <= zMax - 1.2; z += stepZ) {
      // Small geometric art-deco diamond accent
      into.box([0.35, 0.005, 0.35], {
        at: [x, floorY + 0.016, z],
        rotation: [0, Math.PI / 4, 0],
        colour: CINE_CARPET_GOLD,
      })
      // Center starlet dot
      into.box([0.1, 0.005, 0.1], {
        at: [x, floorY + 0.018, z],
        colour: 0xdfc17b,
      })
    }
  }
}

/** Marble perimeter threshold and brass floor transition trims */
export function dressFloorMarbleBorder(
  into: BanquetDetailBuilder,
  bounds: FloorBounds,
  floorY: number,
): void {
  const { xMin, xMax, zMin, zMax } = bounds
  const width = xMax - xMin
  const depth = zMax - zMin
  const midX = (xMin + xMax) / 2
  const midZ = (zMin + zMax) / 2
  const borderThick = 0.45

  // North and South border bands
  for (const z of [zMin + borderThick / 2, zMax - borderThick / 2]) {
    into.box([width, 0.02, borderThick], {
      at: [midX, floorY + 0.01, z],
      colour: CINE_MARBLE,
    })
    into.box([width, 0.022, 0.03], {
      at: [midX, floorY + 0.012, z + (z > midZ ? -borderThick / 2 : borderThick / 2)],
      colour: CINE_BRASS,
    })
  }

  // West and East border bands
  for (const x of [xMin + borderThick / 2, xMax - borderThick / 2]) {
    into.box([borderThick, 0.02, depth - borderThick * 2], {
      at: [x, floorY + 0.01, midZ],
      colour: CINE_MARBLE,
    })
    into.box([0.03, 0.022, depth - borderThick * 2], {
      at: [x + (x > midX ? -borderThick / 2 : borderThick / 2), floorY + 0.012, midZ],
      colour: CINE_BRASS,
    })
  }
}

/** Full concourse floor treatment (carpet and marble/brass trims) */
export function dressConcourseFloor(
  into: BanquetDetailBuilder,
  bounds: FloorBounds,
  floorY: number,
): void {
  dressCinemaCarpetPattern(into, bounds, floorY)
  dressFloorMarbleBorder(into, bounds, floorY)
}
