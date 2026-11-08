import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import {
  CABLE_BLACK,
  CCTV_GLOW_BLUE,
  CCTV_GLOW_GREEN,
  CCTV_SCREEN_FRAME,
  CHROME_BRIGHT,
  EXTINGUISHER_RED,
  KEYBOARD_KEY,
  LED_AMBER,
  LED_CYAN,
  LED_ONLINE_GREEN,
  LED_RECORDING_RED,
  MONITOR_HOUSING,
  PANEL_ENCLOSURE,
  PANEL_SWITCH,
  RACK_CABINET,
  STATUS_SCREEN_AMBER,
  STEEL_BRUSHED,
  STEEL_DARK,
  STEEL_GRAPHITE,
} from './chaROfficeDetailSurface'
import type { Vec2 } from './types'

export interface SurveillancePlacement {
  into: BanquetDetailBuilder
  floor: number
  at: Vec2
}

export interface CornerCameraOptions {
  into: BanquetDetailBuilder
  floor: number
  at: Point3
  rotation?: [number, number, number]
}

function monitorGrid(into: BanquetDetailBuilder, origin: { x: number; y: number; z: number }): void {
  const cols = 4
  const rows = 3
  const colW = 1.85
  const rowH = 0.62
  const startX = origin.x - ((cols - 1) * colW) / 2
  const startY = origin.y

  for (let r = 0; r < rows; r++) {
    const my = startY + r * rowH
    for (let c = 0; c < cols; c++) {
      const mx = startX + c * colW
      // Beveled CRT outer bezel
      into.box([1.68, 0.54, 0.08], { at: [mx, my, origin.z + 0.44], colour: CCTV_SCREEN_FRAME })
      into.box([1.58, 0.46, 0.04], { at: [mx, my, origin.z + 0.47], colour: MONITOR_HOUSING })

      // Glowing phosphor surveillance screen
      const glowColour = (r + c) % 2 === 0 ? CCTV_GLOW_GREEN : CCTV_GLOW_BLUE
      into.box([1.5, 0.4, 0.02], { at: [mx, my, origin.z + 0.49], colour: glowColour, glow: true })

      // Channel placard & status LEDs
      into.box([0.22, 0.04, 0.02], { at: [mx - 0.55, my - 0.22, origin.z + 0.49], colour: STEEL_DARK })
      into.sphere([0.016, 0.016, 0.016], {
        at: [mx + 0.68, my - 0.22, origin.z + 0.5],
        colour: LED_RECORDING_RED,
        glow: true,
      })
      into.sphere([0.012, 0.012, 0.012], {
        at: [mx + 0.62, my - 0.22, origin.z + 0.5],
        colour: LED_ONLINE_GREEN,
        glow: true,
      })
    }
  }
}

/** The monumental multi-screen CCTV surveillance server bank covering Tier 5. */
export function dressCCTVMonitorBank(placement: SurveillancePlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Large equipment rack casing (9.5m wide, 2.5m high, 0.85m deep)
  into.box([9.4, 2.5, 0.88], { at: [x, floor + 1.25, z], colour: RACK_CABINET })
  into.box([9.5, 0.08, 0.92], { at: [x, floor + 2.5, z], colour: STEEL_GRAPHITE })
  into.box([9.5, 0.08, 0.92], { at: [x, floor + 0.04, z], colour: STEEL_GRAPHITE })

  // 12 CRT surveillance monitors in a 4-column x 3-row grid
  monitorGrid(into, { x, y: floor + 0.65, z })

  // Lower rack-mounted DVR recording decks
  for (let b = -3.4; b <= 3.4; b += 1.7) {
    into.box([1.55, 0.28, 0.78], { at: [x + b, floor + 0.22, z + 0.04], colour: MONITOR_HOUSING })
    // Cassette slot & jog dial
    into.box([0.7, 0.04, 0.02], { at: [x + b - 0.25, floor + 0.26, z + 0.44], colour: STEEL_DARK })
    into.cylinder(
      { radius: 0.04, height: 0.02, sides: 12 },
      { at: [x + b + 0.45, floor + 0.22, z + 0.44], colour: CHROME_BRIGHT, rotation: [Math.PI / 2, 0, 0] },
    )
    into.sphere([0.012, 0.012, 0.012], { at: [x + b - 0.65, floor + 0.22, z + 0.44], colour: LED_AMBER, glow: true })
  }

  // Overhead cable management bridge routing cables into ceiling
  into.box([9.0, 0.12, 0.3], { at: [x, floor + 2.65, z], colour: STEEL_DARK })
  for (let c = -3.6; c <= 3.6; c += 1.8) {
    into.cylinder({ radius: 0.035, height: 0.8, sides: 8 }, { at: [x + c, floor + 3.0, z], colour: CABLE_BLACK })
  }
}

function operatorScreens(into: BanquetDetailBuilder, deskCenter: { x: number; y: number; z: number }): void {
  const { x, y, z } = deskCenter

  // Two primary widescreen displays angled toward the operator
  for (const side of [-1, 1]) {
    const sx = x + side * 1.15
    const angle = -side * 0.22
    into.box([0.92, 0.58, 0.06], {
      at: [sx, y + 0.42, z - 0.2],
      colour: CCTV_SCREEN_FRAME,
      rotation: [0, angle, 0],
    })
    into.box([0.84, 0.5, 0.02], {
      at: [sx, y + 0.42, z - 0.16],
      colour: side < 0 ? CCTV_GLOW_BLUE : CCTV_GLOW_GREEN,
      rotation: [0, angle, 0],
      glow: true,
    })
    // Heavy articulated gas-spring monitor stand
    into.cylinder({ radius: 0.025, height: 0.32, sides: 8 }, { at: [sx, y + 0.16, z - 0.28], colour: CHROME_BRIGHT })
    into.cylinder({ radius: 0.1, height: 0.02, sides: 12 }, { at: [sx, y + 0.01, z - 0.28], colour: STEEL_DARK })
  }

  // Vertical auxiliary status readout screen
  into.box([0.42, 0.68, 0.05], {
    at: [x + 2.2, y + 0.46, z - 0.1],
    colour: CCTV_SCREEN_FRAME,
    rotation: [0, -0.45, 0],
  })
  into.box([0.36, 0.6, 0.02], {
    at: [x + 2.2, y + 0.46, z - 0.07],
    colour: STATUS_SCREEN_AMBER,
    rotation: [0, -0.45, 0],
    glow: true,
  })
}

function operatorControls(into: BanquetDetailBuilder, deskTop: { x: number; y: number; z: number }): void {
  const { x, y, z } = deskTop

  // Main backlit keyboard & palmrest
  into.box([0.9, 0.03, 0.28], { at: [x - 0.2, y + 0.02, z + 0.15], colour: PANEL_ENCLOSURE })
  into.box([0.82, 0.02, 0.2], { at: [x - 0.2, y + 0.035, z + 0.12], colour: KEYBOARD_KEY })

  // PTZ surveillance joystick console with zoom knob
  into.box([0.32, 0.06, 0.28], { at: [x + 0.68, y + 0.03, z + 0.15], colour: PANEL_ENCLOSURE })
  into.cylinder({ radius: 0.018, height: 0.14, sides: 8 }, { at: [x + 0.68, y + 0.12, z + 0.15], colour: CHROME_BRIGHT })
  into.sphere([0.032, 0.032, 0.032], { at: [x + 0.68, y + 0.19, z + 0.15], colour: STEEL_DARK })
  into.sphere([0.01, 0.01, 0.01], { at: [x + 0.6, y + 0.07, z + 0.22], colour: LED_CYAN, glow: true })

  // Video switcher keypad unit & red emergency hot-line telephone
  into.box([0.48, 0.04, 0.24], { at: [x - 1.1, y + 0.02, z + 0.15], colour: PANEL_SWITCH })
  into.box([0.22, 0.08, 0.2], { at: [x + 1.45, y + 0.04, z + 0.12], colour: EXTINGUISHER_RED })
  into.cylinder(
    { radius: 0.035, height: 0.24, sides: 8 },
    { at: [x + 1.45, y + 0.1, z + 0.12], colour: EXTINGUISHER_RED, rotation: [0, 0, Math.PI / 2] },
  )
}

/** Operator surveillance watch desk with curved console, triple displays and PTZ controls. */
export function dressWatchDesk(placement: SurveillancePlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Ergonomic operator desk table (5.4m wide, 1.2m deep)
  into.box([5.4, 0.08, 1.2], { at: [x, floor + 0.74, z], colour: STEEL_GRAPHITE })
  into.box([0.12, 0.7, 1.1], { at: [x - 2.55, floor + 0.35, z], colour: STEEL_DARK })
  into.box([0.12, 0.7, 1.1], { at: [x + 2.55, floor + 0.35, z], colour: STEEL_DARK })
  into.box([5.1, 0.55, 0.04], { at: [x, floor + 0.42, z - 0.52], colour: STEEL_DARK })

  // Triple monitor array
  operatorScreens(into, { x, y: floor + 0.78, z })

  // Controls, keyboard, joystick, and hotline
  operatorControls(into, { x, y: floor + 0.78, z })

  // High-back ergonomic mesh swivel operator chair
  into.box([0.56, 0.08, 0.52], { at: [x, floor + 0.46, z + 0.72], colour: STEEL_GRAPHITE })
  into.box([0.52, 0.65, 0.08], { at: [x, floor + 0.78, z + 0.98], colour: STEEL_DARK })
  into.cylinder({ radius: 0.04, height: 0.42, sides: 8 }, { at: [x, floor + 0.21, z + 0.72], colour: CHROME_BRIGHT })
  // 5-star wheeled base
  for (let b = 0; b < 5; b++) {
    const angle = (b * Math.PI * 2) / 5
    const bx = Math.sin(angle) * 0.28
    const bz = Math.cos(angle) * 0.28
    into.box([0.04, 0.03, 0.28], {
      at: [x + bx / 2, floor + 0.04, z + 0.72 + bz / 2],
      colour: CHROME_BRIGHT,
      rotation: [0, angle, 0],
    })
  }
}

/** Dual high-security surveillance cameras mounted over the entrance. */
export function dressEntranceCameras(placement: SurveillancePlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at
  const barY = floor + 2.85

  // Heavy steel wall mounting bracket and crossbar
  into.box([1.1, 0.08, 0.08], { at: [x, barY, z + 0.22], colour: STEEL_DARK })
  into.box([0.08, 0.26, 0.12], { at: [x, barY - 0.09, z + 0.16], colour: STEEL_DARK })

  for (const side of [-0.4, 0.4]) {
    const cx = x + side
    // Heavy cylindrical camera housing with sunshield visor
    into.box([0.16, 0.14, 0.32], {
      at: [cx, barY - 0.1, z + 0.32],
      colour: MONITOR_HOUSING,
      rotation: [0.38, side < 0 ? -0.28 : 0.28, 0],
    })
    into.box([0.18, 0.03, 0.36], {
      at: [cx, barY - 0.02, z + 0.34],
      colour: STEEL_BRUSHED,
      rotation: [0.38, side < 0 ? -0.28 : 0.28, 0],
    })
    // Optical lens element and infrared ring
    into.cylinder(
      { radius: 0.045, height: 0.02, sides: 12 },
      { at: [cx, barY - 0.15, z + 0.46], colour: STEEL_DARK, rotation: [0.38, side < 0 ? -0.28 : 0.28, 0] },
    )
    into.sphere([0.016, 0.016, 0.016], {
      at: [cx, barY - 0.12, z + 0.48],
      colour: LED_RECORDING_RED,
      glow: true,
    })
  }
}

/** Corner surveillance mini-dome camera for interior room angles. */
export function dressCornerCamera(options: CornerCameraOptions): void {
  const { into, at, rotation = [0, 0, 0] } = options
  const [x, y, z] = at

  // Ceiling/wall mounting base plate
  into.cylinder({ radius: 0.08, height: 0.02, sides: 12 }, { at: [x, y, z], colour: STEEL_DARK, rotation })
  // Smoked acrylic mini-dome
  into.sphere([0.055, 0.045, 0.055], { at: [x, y - 0.03, z], colour: MONITOR_HOUSING })
  // Blinking LED status indicator
  into.sphere([0.01, 0.01, 0.01], { at: [x, y - 0.06, z], colour: LED_RECORDING_RED, glow: true })
}
