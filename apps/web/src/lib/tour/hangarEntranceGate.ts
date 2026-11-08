import {
  HANGAR_BEACON_AMBER,
  HANGAR_HAZARD_BLACK,
  HANGAR_HAZARD_YELLOW,
  HANGAR_STATUS_GREEN,
  HANGAR_STATUS_RED,
  HANGAR_STEEL_DARK,
  HANGAR_STEEL_LIGHT,
  HANGAR_STEEL_PANEL,
  type HangarEntranceSurface,
} from './hangarEntranceDetailSurface'

/** Heavy-duty structural portal frame enclosing the 10m x 4m gate */
function dressGatePortalFrame(surface: HangarEntranceSurface): void {
  const w = surface.width
  const h = 4.0
  const d = surface.depth

  // Left and right vertical jambs in heavy UPN steel
  surface.box([0.5, h + 0.3, d + 0.25], [-w / 2 + 0.25, (h + 0.3) / 2, 0], HANGAR_STEEL_DARK)
  surface.box([0.5, h + 0.3, d + 0.25], [w / 2 - 0.25, (h + 0.3) / 2, 0], HANGAR_STEEL_DARK)

  // Overhead massive lintel beam with top track housing
  surface.box([w + 0.4, 0.45, d + 0.3], [0, h + 0.15, 0], HANGAR_STEEL_DARK)
  surface.box([w + 0.2, 0.1, d + 0.35], [0, h + 0.35, 0], HANGAR_STEEL_LIGHT)

  // Corner reinforcement gussets connecting jambs to lintel
  surface.box([0.6, 0.6, d + 0.2], [-w / 2 + 0.55, h - 0.1, 0], HANGAR_STEEL_PANEL)
  surface.box([0.6, 0.6, d + 0.2], [w / 2 - 0.55, h - 0.1, 0], HANGAR_STEEL_PANEL)
}

/** 4-tier ribbed armored sectional door panels with hazard kick-plate */
function dressGatePanels(surface: HangarEntranceSurface): void {
  const panelW = surface.width - 0.8
  const h = 3.8
  const panelH = h / 4.0

  // 4 horizontal armored panel sections with recessed shadow reveals
  for (let i = 0; i < 4; i++) {
    const py = (i + 0.5) * panelH
    surface.box([panelW, panelH - 0.08, 0.18], [0, py, 0.02], HANGAR_STEEL_PANEL)
    // Horizontal reinforcing steel ribs on each panel
    surface.box([panelW, 0.08, 0.22], [0, py, 0.04], HANGAR_STEEL_DARK)
    // Vertical structural stiffener mullions spaced every 2 metres
    for (let x = -panelW / 2 + 1.5; x <= panelW / 2 - 1.5; x += 2.0) {
      surface.box([0.1, panelH - 0.1, 0.24], [x, py, 0.03], HANGAR_STEEL_DARK)
    }
  }

  // Heavy bottom kick-plate with yellow/black hazard warning stripes
  surface.box([panelW, 0.5, 0.22], [0, 0.25, 0.04], HANGAR_HAZARD_YELLOW)
  for (let x = -panelW / 2 + 0.3; x <= panelW / 2 - 0.3; x += 0.8) {
    surface.box([0.35, 0.5, 0.23], [x, 0.25, 0.04], HANGAR_HAZARD_BLACK)
  }

  // Heavy neoprene bottom floor seal strip
  surface.box([panelW, 0.06, 0.26], [0, 0.03, 0.04], HANGAR_STEEL_DARK)
}

/** Twin hydraulic actuation cylinders and mechanical drive gear */
function dressGateHydraulics(surface: HangarEntranceSurface): void {
  const w = surface.width
  const jambX = w / 2 - 0.25

  // Left and right vertical hydraulic cylinders flanking the door
  for (const x of [-jambX, jambX]) {
    // Hydraulic cylinder barrel
    surface.cylinder({ radius: 0.12, height: 2.8 }, [x, 2.0, 0.2], HANGAR_STEEL_DARK)
    // Polished chrome hydraulic piston rod
    surface.cylinder({ radius: 0.06, height: 1.6 }, [x, 3.4, 0.2], HANGAR_STEEL_LIGHT)
    // Mounting clevis brackets
    surface.box([0.3, 0.3, 0.3], [x, 0.7, 0.2], HANGAR_STEEL_PANEL)
    surface.box([0.3, 0.3, 0.3], [x, 3.6, 0.2], HANGAR_STEEL_PANEL)
  }
}

/** Warning beacons, traffic status light and stencil identification placard */
function dressGateSignageAndLights(surface: HangarEntranceSurface): void {
  const w = surface.width

  // Rotating amber warning beacons on portal corners
  surface.cylinder({ radius: 0.12, height: 0.15 }, [-w / 2 + 0.25, 4.25, 0.15], HANGAR_STEEL_DARK)
  surface.sphere([0.1, 0.12, 0.1], [-w / 2 + 0.25, 4.38, 0.15], {
    colour: HANGAR_BEACON_AMBER,
    glow: true,
  })

  surface.cylinder({ radius: 0.12, height: 0.15 }, [w / 2 - 0.25, 4.25, 0.15], HANGAR_STEEL_DARK)
  surface.sphere([0.1, 0.12, 0.1], [w / 2 - 0.25, 4.38, 0.15], {
    colour: HANGAR_BEACON_AMBER,
    glow: true,
  })

  // Official stenciled identification plate centered above the gate
  surface.box([4.2, 0.45, 0.06], [0, 4.15, 0.2], HANGAR_STEEL_DARK)
  surface.box([4.0, 0.35, 0.08], [0, 4.15, 0.21], HANGAR_HAZARD_YELLOW)

  // Traffic clearance signal unit on right jamb (red & green lamps)
  surface.box([0.22, 0.6, 0.15], [w / 2 - 0.15, 2.2, 0.25], HANGAR_STEEL_DARK)
  surface.sphere([0.06, 0.06, 0.04], [w / 2 - 0.15, 2.35, 0.32], {
    colour: HANGAR_STATUS_RED,
    glow: true,
  })
  surface.sphere([0.06, 0.06, 0.04], [w / 2 - 0.15, 2.05, 0.32], {
    colour: HANGAR_STATUS_GREEN,
    glow: true,
  })
}

/** Complete colossal 10m x 4m armored blast gate of Tier 5 Hangar Entrance */
export function dressColossalHangarGate(surface: HangarEntranceSurface): void {
  dressGatePortalFrame(surface)
  dressGatePanels(surface)
  dressGateHydraulics(surface)
  dressGateSignageAndLights(surface)
}
