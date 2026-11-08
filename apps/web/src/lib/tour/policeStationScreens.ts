import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  POLICE_ALERT_GREEN,
  POLICE_ALERT_RED,
  POLICE_GOLD,
  POLICE_METAL,
  POLICE_NAVY,
  POLICE_SCREEN_FRAME,
  POLICE_SCREEN_GLOW,
} from './policeStationDetailSurface'

interface ScreenOptions {
  into: BanquetDetailBuilder
  floor: number
}

/** CCTV surveillance command video wall in the main atrium (12-screen matrix) */
function dressCCTVVideoWall(into: BanquetDetailBuilder, floor: number): void {
  const wallX = 0
  const wallZ = -9.8
  const baseH = floor + 1.2

  // Heavy steel structural mounting rig against the back wall
  into.box([5.4, 3.6, 0.12], { at: [wallX, baseH + 1.7, wallZ], colour: POLICE_METAL })
  into.box([5.2, 0.08, 0.2], { at: [wallX, baseH - 0.04, wallZ + 0.05], colour: POLICE_METAL })
  into.box([5.2, 0.08, 0.2], { at: [wallX, baseH + 3.44, wallZ + 0.05], colour: POLICE_METAL })

  // 4 columns x 3 rows of CCTV surveillance screens
  const cols = [-1.8, -0.6, 0.6, 1.8]
  const rows = [baseH + 0.55, baseH + 1.65, baseH + 2.75]

  for (const cx of cols) {
    for (const cy of rows) {
      // Monitor bezel frame
      into.box([1.12, 0.98, 0.08], {
        at: [wallX + cx, cy, wallZ + 0.08],
        colour: POLICE_SCREEN_FRAME,
      })
      // Glowing surveillance monitor face
      into.box([1.04, 0.9, 0.02], {
        at: [wallX + cx, cy, wallZ + 0.13],
        colour: POLICE_SCREEN_GLOW,
        glow: true,
      })
      // Status indicator LED (green active, red alert on select feeds)
      const isAlert = cx === 0.6 && cy === rows[1]
      into.box([0.04, 0.04, 0.02], {
        at: [wallX + cx + 0.46, cy - 0.4, wallZ + 0.15],
        colour: isAlert ? POLICE_ALERT_RED : POLICE_ALERT_GREEN,
        glow: true,
      })
    }
  }

  // Operator command console desk below video wall
  into.box([4.6, 0.78, 0.9], { at: [wallX, floor + 0.39, wallZ + 0.6], colour: POLICE_METAL })
  into.box([4.8, 0.05, 0.95], { at: [wallX, floor + 0.8, wallZ + 0.6], colour: POLICE_NAVY })

  // 3 operator command consoles with keyboard and PTZ joystick
  for (const ox of [-1.4, 0, 1.4]) {
    into.box([0.5, 0.02, 0.2], {
      at: [wallX + ox, floor + 0.84, wallZ + 0.45],
      colour: POLICE_SCREEN_FRAME,
    })
    into.cylinder(
      { radius: 0.015, height: 0.12 },
      { at: [wallX + ox + 0.35, floor + 0.88, wallZ + 0.45], colour: POLICE_GOLD },
    )
    into.sphere([0.025, 0.025, 0.025], {
      at: [wallX + ox + 0.35, floor + 0.94, wallZ + 0.45],
      colour: POLICE_ALERT_RED,
    })
  }
}

/** Suspended electronic tier security advisory status board */
function dressAtriumStatusBoard(into: BanquetDetailBuilder, floor: number): void {
  const boardY = floor + 3.8
  // Suspended status board above front desk
  into.box([2.8, 0.65, 0.16], { at: [7.5, boardY, -5.8], colour: POLICE_SCREEN_FRAME })
  into.box([2.6, 0.52, 0.02], { at: [7.5, boardY, -5.71], colour: POLICE_GOLD, glow: true })
  into.box([2.6, 0.52, 0.02], { at: [7.5, boardY, -5.89], colour: POLICE_GOLD, glow: true })

  // Suspension steel cables up to the gallery ceiling
  into.cylinder(
    { radius: 0.01, height: 2.8 },
    { at: [6.3, boardY + 1.4, -5.8], colour: POLICE_METAL },
  )
  into.cylinder(
    { radius: 0.01, height: 2.8 },
    { at: [8.7, boardY + 1.4, -5.8], colour: POLICE_METAL },
  )
}

/** Emergency dispatch radio telemetry racks in the community safety section */
export function dressPoliceRadioRacks(options: ScreenOptions): void {
  const { into, floor } = options
  const rackX = -9.8
  const rackZ = -14.6
  const rackY = floor + 1.1

  // Dual equipment racks for VHF/UHF police telemetry
  for (const rx of [rackX, rackX + 1.1]) {
    into.box([0.95, 2.2, 0.65], { at: [rx, rackY, rackZ], colour: POLICE_METAL })
    into.box([0.88, 0.04, 0.6], { at: [rx, floor + 2.22, rackZ], colour: POLICE_SCREEN_FRAME })

    // Illuminated audio oscilloscope and telemetry panel
    into.box([0.75, 0.38, 0.02], {
      at: [rx, floor + 1.6, rackZ + 0.34],
      colour: POLICE_SCREEN_GLOW,
      glow: true,
    })

    // Frequency channel dials and LED status matrix
    for (let row = 0; row < 3; row++) {
      const ledY = floor + 0.6 + row * 0.25
      into.box([0.7, 0.18, 0.02], { at: [rx, ledY, rackZ + 0.34], colour: POLICE_SCREEN_FRAME })
      into.box([0.03, 0.03, 0.02], {
        at: [rx - 0.25, ledY, rackZ + 0.36],
        colour: POLICE_ALERT_GREEN,
        glow: true,
      })
      into.box([0.03, 0.03, 0.02], {
        at: [rx + 0.25, ledY, rackZ + 0.36],
        colour: POLICE_ALERT_RED,
        glow: true,
      })
    }
  }
}

/** Baggage inspection monitor atop the security scanner at entrance */
export function dressPoliceXRayMonitor(options: ScreenOptions): void {
  const { into, floor } = options
  const monX = 2.8
  const monZ = 6.8
  const monY = floor + 1.55

  // Swivel mount pole from inspection tunnel
  into.cylinder(
    { radius: 0.02, height: 0.4 },
    { at: [monX, monY - 0.2, monZ], colour: POLICE_METAL },
  )
  // Dual-display inspection monitor housing
  into.box([0.62, 0.44, 0.1], { at: [monX, monY, monZ], colour: POLICE_SCREEN_FRAME })
  // Illuminated X-ray color density screen
  into.box([0.56, 0.38, 0.02], {
    at: [monX, monY, monZ - 0.06],
    colour: POLICE_SCREEN_GLOW,
    glow: true,
  })
}

/** Complete screens and telemetry for the central police atrium */
export function dressPoliceAtriumScreens(options: ScreenOptions): void {
  const { into, floor } = options
  dressCCTVVideoWall(into, floor)
  dressAtriumStatusBoard(into, floor)
}
