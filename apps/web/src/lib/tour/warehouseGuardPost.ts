import type { WarehouseDetailSurface } from './warehouseDetailSurface'
import {
  WAREHOUSE_HAZARD_BLACK,
  WAREHOUSE_HAZARD_YELLOW,
  WAREHOUSE_STATUS_GREEN,
  WAREHOUSE_STEEL_DARK,
  WAREHOUSE_STEEL_LIGHT,
  WAREHOUSE_STEEL_PANEL,
  WAREHOUSE_WOOD_DARK,
} from './warehouseDetailSurface'

/** Dressed guard desk: steel chassis, linoleum top, surveillance CRT monitor and terminal */
function dressGuardDesk(surface: WarehouseDetailSurface): void {
  const w = surface.width
  const d = surface.depth
  const h = 1.1

  // Counter main body with recessed footwell
  surface.box([w, h, d], [0, h / 2, 0], WAREHOUSE_STEEL_DARK)
  surface.box([w + 0.04, 0.06, d + 0.04], [0, h, 0], WAREHOUSE_STEEL_PANEL)

  // Top linoleum work pad
  surface.box([w * 0.85, 0.015, d * 0.8], [0, h + 0.035, 0], 0x1d2125)

  // CRT surveillance monitor sitting on counter
  surface.box([0.38, 0.32, 0.34], [-w * 0.25, h + 0.2, -0.05], WAREHOUSE_STEEL_PANEL)
  // Monitor dark glass screen with slight glow
  surface.box([0.3, 0.24, 0.02], [-w * 0.25, h + 0.2, 0.13], 0x15222e)
  // Monitor power LED
  surface.sphere([0.015, 0.015, 0.015], [-w * 0.25 + 0.12, h + 0.08, 0.13], {
    colour: WAREHOUSE_STATUS_GREEN,
    glow: true,
  })

  // Keyboard terminal and desk microphone
  surface.box([0.3, 0.03, 0.16], [w * 0.2, h + 0.05, -0.05], WAREHOUSE_STEEL_DARK)
  surface.cylinder({ radius: 0.01, height: 0.25 }, [w * 0.3, h + 0.15, 0.12], WAREHOUSE_STEEL_LIGHT)

  // Customs inspection manifest clipboards and pen tray
  surface.box([0.22, 0.02, 0.3], [0, h + 0.04, 0.1], 0xd5c8b5)
  surface.box([0.08, 0.025, 0.05], [0, h + 0.055, 0.22], WAREHOUSE_STEEL_LIGHT)

  // Security officer swivel stool behind the counter
  surface.cylinder({ radius: 0.18, height: 0.08 }, [0, 0.55, -d * 0.7], WAREHOUSE_STEEL_DARK)
  surface.cylinder({ radius: 0.04, height: 0.5 }, [0, 0.28, -d * 0.7], WAREHOUSE_STEEL_LIGHT)
  surface.box([0.4, 0.04, 0.4], [0, 0.03, -d * 0.7], WAREHOUSE_STEEL_DARK)
}

/** Chapter 378: Heavy steel weapons locker where the Phantom Troupe's contraband is retrieved */
function dressWeaponsLocker(surface: WarehouseDetailSurface): void {
  const w = surface.width
  const d = surface.depth

  // Reinforced dual-door weapons locker behind post 1
  const lx = -w * 0.5
  const lz = -d * 0.85
  surface.box([0.9, 1.8, 0.5], [lx, 0.9, lz], WAREHOUSE_STEEL_PANEL)
  surface.box([0.92, 0.08, 0.52], [lx, 1.82, lz], WAREHOUSE_STEEL_DARK)

  // Dual metal locker doors with heavy slide bolts
  surface.box([0.42, 1.65, 0.04], [lx - 0.22, 0.9, lz + 0.26], WAREHOUSE_STEEL_DARK)
  surface.box([0.42, 1.65, 0.04], [lx + 0.22, 0.9, lz + 0.26], WAREHOUSE_STEEL_DARK)
  surface.box([0.08, 0.18, 0.06], [lx, 0.9, lz + 0.28], WAREHOUSE_HAZARD_YELLOW)

  // Troupe smuggled weapons inside / on top: katana scabbard and leather equipment rolls
  surface.box([1.1, 0.06, 0.06], [lx, 1.88, lz], 0x111111) // Nobunaga's sword case
  surface.cylinder({ radius: 0.02, height: 0.25 }, [lx + 0.48, 1.88, lz], 0xb8860b) // Tsuka gold fitting
  surface.box([0.45, 0.14, 0.22], [lx - 0.2, 1.92, lz], WAREHOUSE_WOOD_DARK) // Leather knife bundle
}

/** Steel crowd control barrier / stanchion channeling incoming freight */
function dressCrowdControlBarrier(surface: WarehouseDetailSurface, isLeft: boolean): void {
  const bx = isLeft ? -surface.width * 0.7 : surface.width * 0.7
  const by = 0.5
  const bz = 0

  // Mobile tubular steel barrier
  surface.box([0.05, 0.9, 0.9], [bx, by, bz], WAREHOUSE_STEEL_LIGHT)
  surface.box([0.08, 0.08, 0.92], [bx, 0.88, bz], WAREHOUSE_HAZARD_YELLOW)
  surface.box([0.08, 0.08, 0.92], [bx, 0.12, bz], WAREHOUSE_HAZARD_BLACK)

  // Stanchion base plates with caster wheels
  surface.cylinder({ radius: 0.08, height: 0.04 }, [bx, 0.02, bz - 0.4], WAREHOUSE_STEEL_DARK)
  surface.cylinder({ radius: 0.08, height: 0.04 }, [bx, 0.02, bz + 0.4], WAREHOUSE_STEEL_DARK)
}

/** Complete dispatch dressing for each of the four warehouse guard posts */
export function dressWarehouseGuardPost(surface: WarehouseDetailSurface, postIndex: number): void {
  dressGuardDesk(surface)

  if (postIndex === 0) {
    dressWeaponsLocker(surface)
  }

  const isLeftPost = postIndex % 2 === 0
  dressCrowdControlBarrier(surface, isLeftPost)
}
