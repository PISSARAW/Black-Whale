import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  ARMY_ALERT_RED,
  ARMY_CHART_GRID,
  ARMY_CHART_PALE,
  ARMY_CHROME,
  ARMY_EMERGENCY_GREEN,
  ARMY_LIGHT_STEEL,
  ARMY_PAPER,
  ARMY_PROJECTOR_LENS,
  ARMY_SCREEN_TACTICAL_ACCENT,
  ARMY_SCREEN_TACTICAL_BLUE,
  ARMY_SCREEN_TACTICAL_CYAN,
  ARMY_SCREEN_WHITE,
  ARMY_STEEL,
  drawTacticalPin,
  RoyalArmyConferenceSurface,
} from './royalArmyConferenceDetailSurface'
import type { Structure } from './types'

/** Dress the 7.5m main briefing screen with high-fidelity tactical relief graphics (Chap. 380, p. 189). */
export function dressBriefingScreenDisplay(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  const surface = new RoyalArmyConferenceSurface({ into, structure, floor, angle: 0 })
  const w = structure.size[0]
  const h = structure.height

  // Top motorized roller housing
  surface.cylinder({ radius: 0.11, height: w + 0.35, sides: 16 }, [0, h + 0.11, 0], {
    colour: ARMY_STEEL,
    rotation: [0, 0, Math.PI / 2],
  })

  // Side guide rails & wall mount brackets
  for (const side of [-1, 1]) {
    surface.box([0.05, h + 0.15, 0.05], [side * (w / 2 + 0.04), h / 2, 0], ARMY_STEEL)
    surface.box([0.08, 0.16, 0.18], [side * (w / 2), h + 0.11, -0.07], ARMY_LIGHT_STEEL)
  }

  // Matte projection canvas backing
  surface.box([w * 0.98, h * 0.96, 0.02], [0, h / 2, 0.02], ARMY_SCREEN_WHITE)
  // Outer black velour mask frame (16:9 inner aperture)
  surface.box([w, 0.1, 0.03], [0, h - 0.05, 0.025], ARMY_STEEL)
  surface.box([w, 0.1, 0.03], [0, 0.05, 0.025], ARMY_STEEL)
  surface.box([0.12, h, 0.03], [-w / 2 + 0.06, h / 2, 0.025], ARMY_STEEL)
  surface.box([0.12, h, 0.03], [w / 2 - 0.06, h / 2, 0.025], ARMY_STEEL)

  // Bottom weighted tension roller bar
  surface.cylinder({ radius: 0.035, height: w + 0.15, sides: 12 }, [0, 0.025, 0.035], {
    colour: ARMY_LIGHT_STEEL,
    rotation: [0, 0, Math.PI / 2],
  })

  // Tactical Briefing Display in relief: Dark naval HUD backdrop
  const dispW = w * 0.94
  const dispH = h * 0.9
  surface.box([dispW, dispH, 0.005], [0, h / 2, 0.032], ARMY_SCREEN_TACTICAL_BLUE)

  // Top header status bar
  surface.box([dispW * 0.95, 0.08, 0.008], [0, h - 0.22, 0.035], ARMY_SCREEN_TACTICAL_CYAN)
  surface.box([0.45, 0.04, 0.01], [-dispW * 0.4, h - 0.22, 0.038], ARMY_PAPER)
  surface.box([0.8, 0.03, 0.01], [0, h - 0.22, 0.038], ARMY_PAPER)

  // Projected Black Whale double-hull silhouette in low relief
  const shipY = h / 2 + 0.05
  // Main hull oval body
  surface.sphere([dispW * 0.32, dispH * 0.22, 0.008], [0, shipY, 0.036], ARMY_SCREEN_TACTICAL_CYAN)
  // Upper superstructure (Tier 1 & Tier 2 crowns)
  surface.box([dispW * 0.35, 0.22, 0.01], [0, shipY + dispH * 0.18, 0.037], ARMY_LIGHT_STEEL)
  surface.box(
    [dispW * 0.22, 0.16, 0.012],
    [0, shipY + dispH * 0.28, 0.038],
    ARMY_SCREEN_TACTICAL_ACCENT,
  )

  // Deck partition lines (Tiers 1 to 5)
  for (let tier = 1; tier <= 4; tier++) {
    const ty = shipY - 0.4 + tier * 0.2
    surface.box([dispW * 0.6, 0.012, 0.01], [0, ty, 0.038], ARMY_PAPER)
  }

  // Tactical waypoint indicators & radar rings
  for (const wx of [-1.8, 0, 1.8]) {
    surface.ring(0.18, [wx, shipY - 0.05, 0.04], ARMY_SCREEN_TACTICAL_ACCENT)
    surface.sphere([0.025, 0.025, 0.008], [wx, shipY - 0.05, 0.042], {
      colour: ARMY_ALERT_RED,
      glow: true,
    })
  }

  // Bottom telemetry telemetry blocks
  for (let b = 0; b < 4; b++) {
    const bx = -dispW * 0.38 + b * (dispW * 0.25)
    surface.box([dispW * 0.22, 0.18, 0.008], [bx, 0.32, 0.036], 0x162a3f)
    surface.box([dispW * 0.18, 0.02, 0.01], [bx, 0.36, 0.038], ARMY_SCREEN_TACTICAL_CYAN)
    surface.box([dispW * 0.14, 0.02, 0.01], [bx, 0.28, 0.038], ARMY_PAPER)
  }
}

function whiteboardPinsAndMemos(surface: RoyalArmyConferenceSurface, w: number, h: number): void {
  // Pinned operational memorandum sheets along the top edge
  const memoXPositions = [-w * 0.35, 0, w * 0.35]
  for (const mx of memoXPositions) {
    // Paper sheet
    surface.box([0.48, 0.65, 0.008], [mx, h - 0.45, 0.022], ARMY_PAPER)
    // Metallic binder clip at top
    surface.box([0.1, 0.03, 0.015], [mx, h - 0.14, 0.026], ARMY_CHROME)
    // Red confidential stamp bar
    surface.box([0.36, 0.025, 0.01], [mx, h - 0.24, 0.025], ARMY_ALERT_RED)
  }

  // Tactical magnetic unit pins on the board
  drawTacticalPin(surface, [-1.2, 1.2, 0.022], ARMY_ALERT_RED)
  drawTacticalPin(surface, [-0.6, 1.6, 0.022], ARMY_ALERT_RED)
  drawTacticalPin(surface, [0.4, 0.9, 0.022], ARMY_PROJECTOR_LENS)
  drawTacticalPin(surface, [1.1, 1.3, 0.022], ARMY_EMERGENCY_GREEN)
  drawTacticalPin(surface, [1.8, 1.7, 0.022], ARMY_SCREEN_TACTICAL_ACCENT)
}

/** Dress the 5m tactical chart whiteboard with coordinate grid, unit pins, memos, and marker tray. */
export function dressTacticalChartBoardDisplay(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  const surface = new RoyalArmyConferenceSurface({
    into,
    structure,
    floor,
    angle: Math.PI / 2, // Mounted on west wall facing east
  })
  const w = structure.size[1] // length along the wall: 5.0m
  const h = structure.height // 2.5m

  // Heavy extruded aluminum outer frame
  surface.box([w, 0.06, 0.05], [0, h - 0.03, 0.025], ARMY_LIGHT_STEEL)
  surface.box([w, 0.06, 0.05], [0, 0.03, 0.025], ARMY_LIGHT_STEEL)
  surface.box([0.06, h, 0.05], [-w / 2 + 0.03, h / 2, 0.025], ARMY_LIGHT_STEEL)
  surface.box([0.06, h, 0.05], [w / 2 - 0.03, h / 2, 0.025], ARMY_LIGHT_STEEL)

  // Porcelain enamel magnetic white board surface
  surface.box([w - 0.1, h - 0.1, 0.015], [0, h / 2, 0.018], ARMY_CHART_PALE)

  // Tactical coordinate grid lines
  for (let y = 0.35; y < h - 0.3; y += 0.45) {
    surface.box([w - 0.25, 0.008, 0.02], [0, y, 0.02], ARMY_CHART_GRID)
  }
  for (let x = -w / 2 + 0.5; x < w / 2 - 0.3; x += 0.75) {
    surface.box([0.008, h - 0.25, 0.02], [x, h / 2, 0.02], ARMY_CHART_GRID)
  }

  // Tactical radar rings in sector A and B
  surface.ring(0.42, [-1.0, 1.3, 0.022], ARMY_CHART_GRID)
  surface.ring(0.65, [1.2, 1.4, 0.022], ARMY_CHART_GRID)

  // Pins and pinned memoranda
  whiteboardPinsAndMemos(surface, w, h)

  // Full-width bottom pen and eraser tray
  surface.box([w - 0.3, 0.035, 0.1], [0, 0.018, 0.06], ARMY_LIGHT_STEEL)
  // Dry-erase felt eraser
  surface.box([0.16, 0.03, 0.06], [-0.8, 0.04, 0.06], ARMY_STEEL)
  // Color dry-erase markers (Blue, Red, Black, Green)
  const markerColors = [0x1f4e79, 0xb02a2a, 0x1a1a1a, 0x2e7d32]
  markerColors.forEach((col, idx) => {
    surface.cylinder({ radius: 0.009, height: 0.13, sides: 8 }, [0.2 + idx * 0.18, 0.04, 0.06], {
      colour: col,
      rotation: [0, 0, Math.PI / 2],
    })
  })
}
