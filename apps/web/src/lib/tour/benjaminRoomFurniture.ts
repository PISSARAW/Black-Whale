import {
  BenjaminRoomSurface,
  BENJAMIN_DARK_WOOD,
  BENJAMIN_BRONZE,
} from './benjaminRoomDetailSurface'

const LEATHER = 0x292c2a
const TABLE = 0x9b8568

/** Ch. 366 p. 16: a vertical handset and a small wall plate, with no desk underneath. */
function wallTelephone(surface: BenjaminRoomSurface): void {
  const z = surface.depth / 2
  surface.box([0.25, 0.44, 0.055], [0, 0.22, z - 0.04], 0x837d6b)
  surface.box([0.19, 0.2, 0.04], [0, 0.3, z], 0xb0a995)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      surface.box(
        [0.026, 0.025, 0.018],
        [-0.044 + col * 0.044, 0.25 + row * 0.04, z + 0.025],
        0x333735,
      )
    }
  }
  surface.box([0.045, 0.24, 0.045], [-0.18, 0.23, z + 0.04], 0x222624)
  for (const y of [0.1, 0.36]) {
    surface.sphere([0.055, 0.065, 0.045], [-0.18, y, z + 0.04], 0x222624)
  }
  surface.curve(
    [
      [-0.18, 0.08, z + 0.04],
      [-0.2, -0.12, z + 0.06],
      [-0.08, -0.15, z + 0.08],
      [0, 0.03, z + 0.03],
    ],
    0.009,
    0x222624,
  )
}

/** Ch. 363 p. 13: rectangular wooden table, inset border and three small centre ornaments. */
function briefingTable(surface: BenjaminRoomSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, 0.09, d], [0, h - 0.045, 0], BENJAMIN_DARK_WOOD)
  surface.box([w - 0.06, 0.025, d - 0.06], [0, h + 0.003, 0], TABLE)
  surface.box([w - 0.2, 0.01, d - 0.2], [0, h + 0.021, 0], BENJAMIN_DARK_WOOD)
  surface.box([w - 0.25, 0.012, d - 0.25], [0, h + 0.028, 0], TABLE)
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      surface.box(
        [0.13, h - 0.09, 0.13],
        [x * (w / 2 - 0.14), (h - 0.09) / 2, z * (d / 2 - 0.15)],
        BENJAMIN_DARK_WOOD,
      )
    }
    surface.box([0.07, 0.15, d - 0.25], [x * (w / 2 - 0.1), h - 0.17, 0], BENJAMIN_DARK_WOOD)
    for (const z of [-1.8, -0.9, 0, 0.9, 1.8]) {
      surface.box([0.035, 0.013, 0.035], [x * (w / 2 - 0.23), h + 0.037, z], BENJAMIN_BRONZE)
    }
  }
  for (const z of [-1.4, 0, 1.4]) {
    surface.box([0.25, 0.025, 0.19], [0, h + 0.055, z], BENJAMIN_DARK_WOOD)
    surface.cylinder({ radius: 0.055, height: 0.12, sides: 8 }, [0, h + 0.13, z], BENJAMIN_BRONZE)
    surface.box([0.018, 0.12, 0.018], [0, h + 0.24, z], BENJAMIN_BRONZE)
  }
}

/** Straight wooden frame and dark rectangular upholstery, not an office chair. */
function briefingChair(surface: BenjaminRoomSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  const back = -d / 2 + 0.045
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      surface.box(
        [0.045, 0.47, 0.045],
        [x * (w / 2 - 0.05), 0.235, z * (d / 2 - 0.05)],
        BENJAMIN_DARK_WOOD,
      )
    }
    surface.box(
      [0.045, h - 0.45, 0.05],
      [x * (w / 2 - 0.05), (h + 0.45) / 2, back],
      BENJAMIN_DARK_WOOD,
    )
  }
  surface.box([w, 0.07, d], [0, 0.46, 0], BENJAMIN_DARK_WOOD)
  surface.box([w - 0.07, 0.06, d - 0.05], [0, 0.51, 0], LEATHER)
  surface.box([w, h - 0.58, 0.065], [0, (h + 0.58) / 2, back], BENJAMIN_DARK_WOOD)
  surface.box([w - 0.09, h - 0.67, 0.035], [0, (h + 0.58) / 2, back + 0.045], LEATHER)
}

export function dressBenjaminRoomFurniture(surface: BenjaminRoomSurface): void {
  if (surface.structure.kind === 'telephone') wallTelephone(surface)
  if (surface.structure.kind === 'table') briefingTable(surface)
  if (surface.structure.kind === 'seat') briefingChair(surface)
}
