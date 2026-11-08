import {
  HANGAR_DIFFUSER_WARM,
  HANGAR_DRUM_BLUE,
  HANGAR_DRUM_GREEN,
  HANGAR_FIRE_RED,
  HANGAR_HAZARD_BLACK,
  HANGAR_HAZARD_YELLOW,
  HANGAR_STATUS_GREEN,
  HANGAR_STATUS_RED,
  HANGAR_STEEL_DARK,
  HANGAR_STEEL_LIGHT,
  HANGAR_STEEL_PANEL,
  HANGAR_WOOD_CRATE,
  HANGAR_WOOD_PALLET,
  type HangarEntranceSurface,
} from './hangarEntranceDetailSurface'

/** Security guard post, gate control console and traffic boom barrier */
export function dressSecurityCheckpoint(surface: HangarEntranceSurface): void {
  const w = surface.width
  const d = surface.depth
  const h = 1.1

  // Reinforced steel checkpoint counter base
  surface.box([w, h, d], [0, h / 2, 0], HANGAR_STEEL_DARK)
  surface.box([w + 0.1, 0.06, d + 0.1], [0, h + 0.03, 0], HANGAR_STEEL_PANEL)

  // Armored glass protective screen with speech slit
  surface.box([w - 0.2, 0.8, 0.04], [0, h + 0.45, -d / 2 + 0.1], HANGAR_STEEL_LIGHT)

  // Gate operation control console on counter top
  surface.box([0.55, 0.14, 0.35], [-0.5, h + 0.1, 0], HANGAR_STEEL_DARK)
  // Control buttons and status lights
  surface.cylinder({ radius: 0.02, height: 0.04 }, [-0.65, h + 0.18, 0], HANGAR_STATUS_GREEN)
  surface.cylinder({ radius: 0.02, height: 0.04 }, [-0.55, h + 0.18, 0], HANGAR_STATUS_RED)
  surface.cylinder({ radius: 0.03, height: 0.05 }, [-0.4, h + 0.19, 0], HANGAR_HAZARD_YELLOW)

  // Security CCTV monitor on angled desk bracket
  surface.box([0.08, 0.25, 0.08], [0.4, h + 0.15, 0], HANGAR_STEEL_DARK)
  surface.box([0.45, 0.32, 0.06], [0.4, h + 0.35, 0], HANGAR_STEEL_DARK)
  surface.box([0.4, 0.28, 0.02], [0.4, h + 0.35, -0.04], HANGAR_STEEL_PANEL)
  surface.sphere([0.06, 0.04, 0.02], [0.4, h + 0.35, -0.05], {
    colour: HANGAR_DIFFUSER_WARM,
    glow: true,
  })

  // Industrial boom barrier pedestal and horizontal barrier arm
  surface.box([0.45, 1.0, 0.45], [-w / 2 - 0.3, 0.5, 0], HANGAR_HAZARD_YELLOW)
  surface.cylinder({ radius: 0.12, height: 0.2 }, [-w / 2 - 0.3, 0.85, 0], HANGAR_STEEL_DARK)
  // 4m barrier arm extending into the vehicle lane
  const armL = 3.6
  surface.box([armL, 0.12, 0.06], [-w / 2 - 0.3 - armL / 2, 0.85, 0], HANGAR_HAZARD_YELLOW)
  for (let ax = -0.5; ax > -armL; ax -= 0.6) {
    surface.box([0.25, 0.13, 0.07], [-w / 2 - 0.3 + ax, 0.85, 0], HANGAR_HAZARD_BLACK)
  }

  // Operator stool behind counter
  surface.cylinder({ radius: 0.2, height: 0.08 }, [0, 0.7, d / 2 + 0.4], HANGAR_STEEL_PANEL)
  surface.cylinder({ radius: 0.03, height: 0.65 }, [0, 0.35, d / 2 + 0.4], HANGAR_STEEL_LIGHT)
  surface.cylinder({ radius: 0.24, height: 0.04 }, [0, 0.02, d / 2 + 0.4], HANGAR_STEEL_DARK)
}

/** Wooden shipping pallets, heavy cargo crates and manual pallet jack (West staging) */
export function dressCargoStagingWest(surface: HangarEntranceSurface): void {
  // Base shipping pallets (norme EUR 1.2m x 0.8m)
  for (const px of [-1.5, 0, 1.5]) {
    for (const pz of [-0.6, 0.6]) {
      surface.box([1.3, 0.14, 0.9], [px, 0.07, pz], HANGAR_WOOD_PALLET)
    }
  }

  // Stacked heavy wooden shipping crates on top of pallets
  // Lower crate row
  surface.box([1.4, 0.9, 1.1], [-1.5, 0.6, 0], HANGAR_WOOD_CRATE)
  surface.box([1.44, 0.04, 1.14], [-1.5, 0.6, 0], HANGAR_STEEL_DARK)
  surface.box([1.44, 0.94, 0.04], [-1.5, 0.6, 0], HANGAR_STEEL_DARK)

  surface.box([1.2, 0.75, 1.0], [0.1, 0.52, -0.4], HANGAR_WOOD_CRATE)
  surface.box([1.24, 0.04, 1.04], [0.1, 0.52, -0.4], HANGAR_STEEL_DARK)

  // Upper stacked crate
  surface.box([1.1, 0.65, 0.9], [-1.5, 1.4, 0], HANGAR_WOOD_CRATE)

  // Manual hydraulic pallet jack parked beside the stack
  const jx = 1.6
  surface.box([1.1, 0.1, 0.55], [jx, 0.1, 0.2], HANGAR_HAZARD_YELLOW)
  surface.box([0.15, 0.75, 0.15], [jx + 0.5, 0.45, 0.2], HANGAR_STEEL_DARK)
  surface.cylinder({ radius: 0.02, height: 0.4 }, [jx + 0.5, 0.85, 0.2], HANGAR_STEEL_LIGHT)
  surface.cylinder({ radius: 0.08, height: 0.1 }, [jx + 0.5, 0.08, 0.2], HANGAR_STEEL_DARK)
}

/** 200-litre industrial fluid drums, spill containment basin and safety lockers (East staging) */
export function dressFluidDrumsEast(surface: HangarEntranceSurface): void {
  const d = surface.depth

  // Spill containment basin in dark polymer
  surface.box([2.4, 0.22, 1.8], [0, 0.11, 0], HANGAR_STEEL_DARK)
  surface.box([2.3, 0.04, 1.7], [0, 0.22, 0], HANGAR_HAZARD_YELLOW)

  // 4 industrial 200L fluid drums with rolled chime rims
  const drumCoords: [number, number, number][] = [
    [-0.55, -0.42, HANGAR_DRUM_BLUE],
    [0.55, -0.42, HANGAR_DRUM_BLUE],
    [-0.55, 0.42, HANGAR_DRUM_GREEN],
    [0.55, 0.42, HANGAR_DRUM_GREEN],
  ]

  for (const [dx, dz, colour] of drumCoords) {
    // Drum main body
    surface.cylinder({ radius: 0.32, height: 0.95 }, [dx, 0.7, dz], colour)
    // Rolling hoops (stiffening rings)
    surface.cylinder({ radius: 0.34, height: 0.04 }, [dx, 0.5, dz], HANGAR_STEEL_DARK)
    surface.cylinder({ radius: 0.34, height: 0.04 }, [dx, 0.9, dz], HANGAR_STEEL_DARK)
    // Top chime and bung cap
    surface.cylinder({ radius: 0.33, height: 0.03 }, [dx, 1.18, dz], HANGAR_STEEL_LIGHT)
    surface.cylinder({ radius: 0.04, height: 0.03 }, [dx + 0.15, 1.2, dz], HANGAR_STEEL_LIGHT)
  }

  // Safety bollards in steel protecting the drum zone
  for (const bx of [-1.4, 1.4]) {
    surface.cylinder({ radius: 0.1, height: 1.0 }, [bx, 0.5, 0.8], HANGAR_HAZARD_YELLOW)
    surface.cylinder({ radius: 0.11, height: 0.15 }, [bx, 0.85, 0.8], HANGAR_HAZARD_BLACK)
    surface.box([0.3, 0.04, 0.3], [bx, 0.02, 0.8], HANGAR_STEEL_DARK)
  }

  // Wall-mounted emergency fire locker with extinguisher
  surface.box([0.7, 1.2, 0.3], [0, 1.8, d / 2 + 0.15], HANGAR_FIRE_RED)
  surface.cylinder({ radius: 0.12, height: 0.65 }, [0, 1.7, d / 2 + 0.2], HANGAR_FIRE_RED)
  surface.cylinder({ radius: 0.03, height: 0.15 }, [0, 2.1, d / 2 + 0.2], HANGAR_STEEL_LIGHT)
}
