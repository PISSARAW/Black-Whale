import type { WarehouseDetailSurface } from './warehouseDetailSurface'
import {
  WAREHOUSE_CONTAINER_BLUE,
  WAREHOUSE_CONTAINER_GREEN,
  WAREHOUSE_CONTAINER_RED,
  WAREHOUSE_HAZARD_YELLOW,
  WAREHOUSE_STEEL_DARK,
  WAREHOUSE_STEEL_LIGHT,
  WAREHOUSE_STEEL_PANEL,
  WAREHOUSE_WOOD_DARK,
  WAREHOUSE_WOOD_LIGHT,
} from './warehouseDetailSurface'

/** Large heavy-timber wooden cargo crate stack with diagonal braces and steel corner brackets */
function dressTimberCrateStack(surface: WarehouseDetailSurface): void {
  const w = surface.width
  const d = surface.depth
  const h = 2.4

  // Wooden pallet base beneath the crates
  surface.box([w + 0.1, 0.14, d + 0.1], [0, 0.07, 0], WAREHOUSE_WOOD_DARK)
  for (const px of [-w / 3, 0, w / 3]) {
    surface.box([0.16, 0.14, d + 0.1], [px, 0.07, 0], WAREHOUSE_STEEL_DARK)
  }

  // Primary timber crate body
  surface.box([w, h - 0.14, d], [0, 0.14 + (h - 0.14) / 2, 0], WAREHOUSE_WOOD_LIGHT)

  // Structural wooden frame and diagonal battens
  surface.box([w + 0.04, 0.12, d + 0.04], [0, 0.2, 0], WAREHOUSE_WOOD_DARK)
  surface.box([w + 0.04, 0.12, d + 0.04], [0, h - 0.06, 0], WAREHOUSE_WOOD_DARK)

  // Vertical corner timber studs
  for (const sx of [-w / 2 + 0.08, w / 2 - 0.08]) {
    for (const sz of [-d / 2 + 0.08, d / 2 - 0.08]) {
      surface.box([0.16, h - 0.14, 0.16], [sx, 0.14 + (h - 0.14) / 2, sz], WAREHOUSE_WOOD_DARK)
    }
  }

  // Steel corner protector brackets and cargo tension banding
  for (const sx of [-w / 2, w / 2]) {
    surface.box([0.06, h - 0.2, 0.22], [sx, h / 2, 0], WAREHOUSE_STEEL_PANEL)
  }
  for (const bx of [-w / 4, w / 4]) {
    surface.box([0.05, h, d + 0.02], [bx, h / 2, 0], WAREHOUSE_STEEL_DARK)
  }

  // Kakin Royal freight stencil badge on the side
  surface.box([1.4, 0.5, 0.02], [0, h * 0.65, d / 2 + 0.01], WAREHOUSE_WOOD_DARK)
  surface.box([1.1, 0.35, 0.025], [0, h * 0.65, d / 2 + 0.01], WAREHOUSE_HAZARD_YELLOW)
}

/** Intermodal ISO-style corrugated shipping container stack */
function dressContainerStack(surface: WarehouseDetailSurface, colour: number): void {
  const w = surface.width
  const d = surface.depth
  const h = 2.4

  // Main container body
  surface.box([w, h, d], [0, h / 2, 0], colour)

  // Corrugation ribs along long side walls
  const ribCount = 8
  const ribStep = (w - 0.4) / ribCount
  for (let i = 0; i <= ribCount; i++) {
    const rx = -w / 2 + 0.2 + i * ribStep
    surface.box([0.06, h - 0.2, 0.06], [rx, h / 2, d / 2 + 0.02], WAREHOUSE_STEEL_DARK)
    surface.box([0.06, h - 0.2, 0.06], [rx, h / 2, -d / 2 - 0.02], WAREHOUSE_STEEL_DARK)
  }

  // Heavy steel corner castings (ISO twist-lock corners)
  for (const cx of [-w / 2 + 0.12, w / 2 - 0.12]) {
    for (const cz of [-d / 2 + 0.12, d / 2 - 0.12]) {
      surface.box([0.24, 0.24, 0.24], [cx, 0.12, cz], WAREHOUSE_STEEL_DARK)
      surface.box([0.24, 0.24, 0.24], [cx, h - 0.12, cz], WAREHOUSE_STEEL_DARK)
    }
  }

  // End door locking rods, cams, and handles
  const doorX = w / 2 + 0.02
  for (const dz of [-d / 4, d / 4]) {
    surface.cylinder({ radius: 0.03, height: h - 0.3 }, [doorX, h / 2, dz], WAREHOUSE_STEEL_LIGHT)
    surface.box([0.08, 0.18, 0.08], [doorX, 0.2, dz], WAREHOUSE_STEEL_DARK)
    surface.box([0.08, 0.18, 0.08], [doorX, h - 0.2, dz], WAREHOUSE_STEEL_DARK)
    surface.box([0.2, 0.04, 0.06], [doorX + 0.05, 1.0, dz], WAREHOUSE_STEEL_PANEL)
  }
}

/** Heavy industrial steel rack holding palletized boxes and 55-gallon fluid drums */
function dressPalletRackAndDrums(surface: WarehouseDetailSurface): void {
  const w = surface.width
  const d = surface.depth
  const h = 2.4

  // Heavy steel upright frames (orange/yellow safety uprights)
  for (const rx of [-w / 2 + 0.1, 0, w / 2 - 0.1]) {
    for (const rz of [-d / 2 + 0.1, d / 2 - 0.1]) {
      surface.box([0.14, h, 0.14], [rx, h / 2, rz], WAREHOUSE_HAZARD_YELLOW)
    }
    // Horizontal cross-ties
    surface.box([0.1, 0.08, d - 0.2], [rx, h * 0.45, 0], WAREHOUSE_STEEL_PANEL)
    surface.box([0.1, 0.08, d - 0.2], [rx, h * 0.9, 0], WAREHOUSE_STEEL_PANEL)
  }

  // Lower level: 55-gallon metal chemical/oil drums
  const drumXs = [-w / 3, -w / 6, 0, w / 6, w / 3]
  for (const dx of drumXs) {
    const drumCol = dx > 0 ? WAREHOUSE_CONTAINER_BLUE : WAREHOUSE_STEEL_DARK
    surface.cylinder({ radius: 0.32, height: 0.95 }, [dx, 0.5, 0], drumCol)
    surface.cylinder({ radius: 0.33, height: 0.05 }, [dx, 0.95, 0], WAREHOUSE_STEEL_LIGHT)
    surface.cylinder({ radius: 0.33, height: 0.05 }, [dx, 0.05, 0], WAREHOUSE_STEEL_LIGHT)
  }

  // Upper level shelf beam and palletized cargo boxes
  surface.box([w, 0.12, d], [0, h * 0.48, 0], WAREHOUSE_HAZARD_YELLOW)
  const boxXs = [-w / 3, 0, w / 3]
  for (const bx of boxXs) {
    surface.box([1.4, 0.85, d * 0.75], [bx, h * 0.48 + 0.48, 0], WAREHOUSE_WOOD_LIGHT)
    surface.box([1.42, 0.05, d * 0.77], [bx, h * 0.48 + 0.7, 0], WAREHOUSE_WOOD_DARK)
  }
}

/** Complete dispatch dressing for any of the 32 warehouse crate structures */
export function dressWarehouseCrate(surface: WarehouseDetailSurface, crateIndex: number): void {
  const pattern = crateIndex % 4

  if (pattern === 0) {
    dressTimberCrateStack(surface)
  } else if (pattern === 1) {
    dressContainerStack(surface, WAREHOUSE_CONTAINER_BLUE)
  } else if (pattern === 2) {
    dressPalletRackAndDrums(surface)
  } else {
    dressContainerStack(
      surface,
      crateIndex % 2 === 0 ? WAREHOUSE_CONTAINER_RED : WAREHOUSE_CONTAINER_GREEN,
    )
  }
}
