import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  WAREHOUSE_NEON_COOL,
  WAREHOUSE_STEEL_DARK,
  WAREHOUSE_STEEL_LIGHT,
  WAREHOUSE_STEEL_PANEL,
} from './warehouseDetailSurface'

export interface WarehouseArchitectureOptions {
  THREE: typeof Three
  into: BanquetDetailBuilder
  floor: number
}

const TRUSS_XS = [-25, -10, 5, 20, 35, 50, 65]
const MID_Z = -21

function diagonalMember(
  into: BanquetDetailBuilder,
  floor: number,
  x: number,
  z: number,
  direction: -1 | 1,
): void {
  into.box([0.16, 0.16, 11.4], {
    at: [x, floor + 10.95, z],
    rotation: [direction * 0.115, 0, 0],
    colour: WAREHOUSE_STEEL_PANEL,
  })
}

/** Shallow triangular roof frames matching the quiet archive-like manga panel. */
function dressRoofFrames(into: BanquetDetailBuilder, floor: number): void {
  for (const x of TRUSS_XS) {
    into.box([0.22, 0.18, 46], {
      at: [x, floor + 10.45, MID_Z],
      colour: WAREHOUSE_STEEL_DARK,
    })
    into.box([0.18, 0.18, 23.2], {
      at: [x, floor + 11.12, -32.55],
      rotation: [0.058, 0, 0],
      colour: WAREHOUSE_STEEL_DARK,
    })
    into.box([0.18, 0.18, 23.2], {
      at: [x, floor + 11.12, -9.45],
      rotation: [-0.058, 0, 0],
      colour: WAREHOUSE_STEEL_DARK,
    })
    diagonalMember(into, floor, x, -32.4, 1)
    diagonalMember(into, floor, x, -9.6, -1)
    into.box([0.18, 1.35, 0.18], {
      at: [x, floor + 11.1, MID_Z],
      colour: WAREHOUSE_STEEL_PANEL,
    })
  }

  for (const z of [-41, -31, -21, -11, -1]) {
    into.box([101, 0.12, 0.16], {
      at: [20, floor + 11.62, z],
      colour: WAREHOUSE_STEEL_PANEL,
    })
  }
}

/** Slim uprights continuing the rack rhythm into the building shell. */
function dressPerimeterColumns(into: BanquetDetailBuilder, floor: number): void {
  for (const x of [-34, -20, -6, 8, 22, 36, 50, 64, 76]) {
    for (const z of [-44, 2]) {
      into.box([0.42, 10.6, 0.48], {
        at: [x, floor + 5.3, z],
        colour: WAREHOUSE_STEEL_DARK,
      })
      into.box([0.62, 0.18, 0.68], {
        at: [x, floor + 0.09, z],
        colour: WAREHOUSE_STEEL_PANEL,
      })
    }
  }
}

/** Pendant enamel lamps aligned above the long storage aisles. */
function dressPendantLighting(into: BanquetDetailBuilder, floor: number): void {
  for (const x of [-20, 5, 30, 55]) {
    for (const z of [-34, -21, -8]) {
      into.cylinder(
        { radius: 0.035, height: 1.05, sides: 10 },
        { at: [x, floor + 10.05, z], colour: WAREHOUSE_STEEL_DARK },
      )
      into.cylinder(
        { radius: 0.42, bottom: 0.16, height: 0.24, sides: 20 },
        { at: [x, floor + 9.43, z], colour: WAREHOUSE_STEEL_LIGHT },
      )
      into.sphere([0.15, 0.12, 0.15], {
        at: [x, floor + 9.27, z],
        colour: WAREHOUSE_NEON_COOL,
        glow: true,
      })
    }
  }
}

/** Surface-mounted conduit turning down the far wall above the locked doors. */
function dressWallConduits(into: BanquetDetailBuilder, floor: number): void {
  const wallX = -34.72
  for (const z of [-27.5, -25.8, -16.2, -14.5]) {
    into.box([0.12, 7.1, 0.12], {
      at: [wallX, floor + 6.1, z],
      colour: WAREHOUSE_STEEL_DARK,
    })
  }
  into.box([0.12, 0.14, 16], {
    at: [wallX, floor + 8.65, MID_Z],
    colour: WAREHOUSE_STEEL_DARK,
  })
  into.box([0.18, 0.18, 3.8], {
    at: [wallX, floor + 4.25, MID_Z],
    colour: WAREHOUSE_STEEL_PANEL,
  })
}

export function dressWarehouseArchitecture(options: WarehouseArchitectureOptions): void {
  const { into, floor } = options
  dressRoofFrames(into, floor)
  dressPerimeterColumns(into, floor)
  dressPendantLighting(into, floor)
  dressWallConduits(into, floor)
}
