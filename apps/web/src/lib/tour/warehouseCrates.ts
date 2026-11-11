import type { WarehouseDetailSurface } from './warehouseDetailSurface'
import {
  WAREHOUSE_STEEL_DARK,
  WAREHOUSE_STEEL_LIGHT,
  WAREHOUSE_STEEL_PANEL,
  WAREHOUSE_WOOD_DARK,
  WAREHOUSE_WOOD_LIGHT,
} from './warehouseDetailSurface'

const CARTON_COLOURS = [WAREHOUSE_WOOD_LIGHT, 0x7d6b52, 0x8b7b63, 0x665b4c, 0x94836a]

interface ArchiveGrid {
  width: number
  depth: number
  columns: number
  tiers: number
  columnWidth: number
  tierHeight: number
}

function dressCartons(
  surface: WarehouseDetailSurface,
  options: ArchiveGrid & { rackIndex: number },
): void {
  const {
    width: w,
    depth: d,
    columns,
    tiers,
    columnWidth: colW,
    tierHeight: tierH,
    rackIndex,
  } = options
  for (const face of [-1, 1] as const) {
    for (let tier = 0; tier < tiers; tier++) {
      for (let column = 0; column < columns; column++) {
        const seed = rackIndex * 17 + tier * 7 + column * 3 + (face > 0 ? 1 : 0)
        if (seed % 11 === 0) continue

        const boxW = colW * (0.72 + (seed % 4) * 0.06)
        const boxH = tierH * (0.58 + (seed % 5) * 0.055)
        const boxD = d * (0.38 + (seed % 3) * 0.035)
        const x = -w / 2 + 0.14 + (column + 0.5) * colW
        const y = 0.18 + tier * tierH + boxH / 2
        const z = face * (d / 2 - boxD / 2 - 0.08)
        const colour = CARTON_COLOURS[seed % CARTON_COLOURS.length]

        surface.box([boxW, boxH, boxD], [x, y, z], colour)
        const labelZ = z + face * (boxD / 2 + 0.008)
        surface.box(
          [boxW * 0.34, boxH * 0.1, 0.018],
          [x, y + boxH * 0.18, labelZ],
          WAREHOUSE_WOOD_DARK,
        )
        surface.box(
          [boxW * 0.2, boxH * 0.045, 0.022],
          [x, y + boxH * 0.18, labelZ + face * 0.006],
          0xb9b09d,
        )
      }
    }
  }
}

/** A tall double-sided archive rack packed with individually labelled cartons. */
function dressArchiveRack(surface: WarehouseDetailSurface, rackIndex: number): void {
  const w = surface.width
  const d = surface.depth
  const h = 8.7
  const columns = 5
  const tiers = 7
  const colW = (w - 0.28) / columns
  const tierH = (h - 0.24) / tiers

  for (let column = 0; column <= columns; column++) {
    const x = -w / 2 + 0.14 + column * colW
    for (const z of [-d / 2 + 0.09, d / 2 - 0.09]) {
      surface.box([0.12, h, 0.12], [x, h / 2, z], WAREHOUSE_STEEL_DARK)
    }
  }
  for (let tier = 0; tier <= tiers; tier++) {
    const y = 0.12 + tier * tierH
    surface.box([w, 0.1, d], [0, y, 0], WAREHOUSE_STEEL_PANEL)
    surface.box([w + 0.08, 0.06, 0.08], [0, y + 0.04, d / 2], WAREHOUSE_STEEL_LIGHT)
    surface.box([w + 0.08, 0.06, 0.08], [0, y + 0.04, -d / 2], WAREHOUSE_STEEL_LIGHT)
  }

  dressCartons(surface, {
    width: w,
    depth: d,
    columns,
    tiers,
    columnWidth: colW,
    tierHeight: tierH,
    rackIndex,
  })

  for (const face of [-1, 1] as const) {
    surface.box([w - 0.18, 0.46, 0.055], [0, 0.34, face * (d / 2 + 0.025)], WAREHOUSE_STEEL_PANEL)
    for (let slot = -w / 2 + 0.35; slot < w / 2 - 0.2; slot += 0.42) {
      surface.box([0.24, 0.025, 0.065], [slot, 0.34, face * (d / 2 + 0.055)], WAREHOUSE_STEEL_DARK)
    }
  }
}

export function dressWarehouseCrate(surface: WarehouseDetailSurface, crateIndex: number): void {
  dressArchiveRack(surface, crateIndex)
}
