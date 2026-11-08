import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  BUTTON_EJECT_RED,
  CABINET_STEEL,
  CHROME_BRIGHT,
  DECK_NON_SKID,
  FIRST_AID_WHITE,
  FLARE_ORANGE,
  HATCH_COAMING_STEEL,
  HATCH_LEAF_STEEL,
  HATCH_LOCK_DOGS,
  HATCH_SEAL_NEOPRENE,
  HATCH_WHEEL_BRASS,
  LED_ALARM_RED,
  LED_ONLINE_GREEN,
  LED_STANDBY_AMBER,
  OXYGEN_CYLINDER_GREEN,
  PANEL_SURFACE,
  RATION_PACK_OLIVE,
  SAFETY_COVER_HAZARD,
  SCREEN_NAVIGATION_AMBER,
  SCREEN_TELEMETRY_CYAN,
  SHELL_RIBS_STEEL,
  STEEL_BRUSHED,
  STEEL_DARK,
  STEEL_GRAPHITE,
  TIE_DOWN_BRASS,
} from './podCabinDetailSurface'
import type { Vec2 } from './types'

export interface EquipmentPlacement {
  into: BanquetDetailBuilder
  floor: number
  at: Vec2
}

/** The central structural column and stepped circular pedestal base (Ch. 383, p. 65). */
export function dressCentralPostAndBase(options: {
  into: BanquetDetailBuilder
  floor: number
  ceilingHeight: number
}): void {
  const { into, floor, ceilingHeight } = options

  // Lower stepped circular base platform (2.2m diameter, 0.25m height)
  into.cylinder(
    { radius: 1.1, height: 0.25, sides: 20 },
    { at: [0, floor + 0.125, 0], colour: STEEL_GRAPHITE },
  )
  // Beveled outer base perimeter ring
  into.cylinder(
    { radius: 1.14, height: 0.06, sides: 20 },
    { at: [0, floor + 0.03, 0], colour: STEEL_DARK },
  )

  // Upper platform tier with diamond non-skid plate (1.9m diameter, 0.2m height)
  into.cylinder(
    { radius: 0.95, height: 0.2, sides: 16 },
    { at: [0, floor + 0.35, 0], colour: DECK_NON_SKID },
  )
  into.cylinder(
    { radius: 0.98, height: 0.04, sides: 16 },
    { at: [0, floor + 0.44, 0], colour: STEEL_BRUSHED },
  )

  // Central mooring post rising from the pedestal through to the ceiling (0.42m diameter, 2.6m tall)
  into.cylinder(
    { radius: 0.21, height: ceilingHeight - 0.45, sides: 16 },
    { at: [0, floor + 0.45 + (ceilingHeight - 0.45) / 2, 0], colour: SHELL_RIBS_STEEL },
  )

  // Four structural gusset brackets bracing the column to the base
  for (let g = 0; g < 4; g++) {
    const angle = (g * Math.PI) / 2
    const gx = Math.sin(angle) * 0.4
    const gz = Math.cos(angle) * 0.4
    into.box([0.06, 0.36, 0.34], {
      at: [gx, floor + 0.58, gz],
      colour: STEEL_GRAPHITE,
      rotation: [0, angle, 0],
    })
  }

  // Mooring eyelet rings and safety harness attachment collars around the post
  into.cylinder(
    { radius: 0.25, height: 0.08, sides: 16 },
    { at: [0, floor + 1.25, 0], colour: STEEL_DARK },
  )
  into.cylinder(
    { radius: 0.25, height: 0.08, sides: 16 },
    { at: [0, floor + 1.85, 0], colour: STEEL_DARK },
  )
  for (let h = 0; h < 4; h++) {
    const hAngle = (h * Math.PI) / 2 + Math.PI / 4
    const hx = Math.sin(hAngle) * 0.28
    const hz = Math.cos(hAngle) * 0.28
    into.box([0.04, 0.12, 0.04], { at: [hx, floor + 1.25, hz], colour: TIE_DOWN_BRASS })
  }
}

/** The circular pressure hatch with 6 locking dogs and brass turning wheel (Ch. 383, p. 60). */
export function dressRoundHatch(placement: EquipmentPlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at
  const cy = floor + 1.45

  // Heavy circular outer bulkhead coaming
  into.cylinder(
    { radius: 0.64, height: 0.18, sides: 20 },
    { at: [x, cy, z], colour: HATCH_COAMING_STEEL, rotation: [Math.PI / 2, 0, 0] },
  )
  into.cylinder(
    { radius: 0.56, height: 0.22, sides: 20 },
    { at: [x, cy, z + 0.02], colour: HATCH_SEAL_NEOPRENE, rotation: [Math.PI / 2, 0, 0] },
  )

  // Convex circular pressure hatch door leaf
  into.cylinder(
    { radius: 0.52, height: 0.14, sides: 20 },
    { at: [x, cy, z + 0.06], colour: HATCH_LEAF_STEEL, rotation: [Math.PI / 2, 0, 0] },
  )

  // 6 radial wedge locking dogs / lugs around the perimeter
  for (let d = 0; d < 6; d++) {
    const angle = (d * Math.PI * 2) / 6
    const dx = Math.sin(angle) * 0.48
    const dy = Math.cos(angle) * 0.48
    into.box([0.08, 0.14, 0.09], {
      at: [x + dx, cy + dy, z + 0.14],
      colour: HATCH_LOCK_DOGS,
      rotation: [0, 0, -angle],
    })
  }

  // Heavy dual-pin articulated hinge assembly on the right
  into.box([0.14, 0.48, 0.16], { at: [x + 0.62, cy, z + 0.08], colour: STEEL_GRAPHITE })
  into.cylinder(
    { radius: 0.04, height: 0.52, sides: 10 },
    { at: [x + 0.65, cy, z + 0.12], colour: CHROME_BRIGHT },
  )

  // Three-spoke rotary brass locking wheel and center hub
  into.cylinder(
    { radius: 0.22, height: 0.05, sides: 16 },
    { at: [x, cy, z + 0.16], colour: HATCH_WHEEL_BRASS, rotation: [Math.PI / 2, 0, 0] },
  )
  into.cylinder(
    { radius: 0.07, height: 0.12, sides: 12 },
    { at: [x, cy, z + 0.18], colour: HATCH_WHEEL_BRASS, rotation: [Math.PI / 2, 0, 0] },
  )
  for (let s = 0; s < 3; s++) {
    const sAngle = (s * Math.PI * 2) / 3
    into.box([0.04, 0.4, 0.04], {
      at: [x, cy, z + 0.16],
      colour: HATCH_WHEEL_BRASS,
      rotation: [0, 0, sAngle],
    })
  }

  // Pressure equalization valve & dual status LEDs
  into.cylinder(
    { radius: 0.05, height: 0.06, sides: 12 },
    { at: [x - 0.32, cy + 0.28, z + 0.14], colour: TIE_DOWN_BRASS, rotation: [Math.PI / 2, 0, 0] },
  )
  into.sphere([0.016, 0.016, 0.016], {
    at: [x - 0.42, cy + 0.28, z + 0.15],
    colour: LED_ONLINE_GREEN,
    glow: true,
  })
  into.sphere([0.016, 0.016, 0.016], {
    at: [x - 0.42, cy + 0.22, z + 0.15],
    colour: LED_ALARM_RED,
    glow: true,
  })
}

function consoleScreens(
  into: BanquetDetailBuilder,
  top: { x: number; y: number; z: number },
): void {
  const { x, y, z } = top

  // Left screen: life-support & atmospheric telemetry (cyan glow)
  into.box([0.48, 0.32, 0.04], {
    at: [x - 0.36, y + 0.18, z - 0.05],
    colour: STEEL_DARK,
    rotation: [-0.35, 0, 0],
  })
  into.box([0.42, 0.26, 0.02], {
    at: [x - 0.36, y + 0.18, z - 0.03],
    colour: SCREEN_TELEMETRY_CYAN,
    rotation: [-0.35, 0, 0],
    glow: true,
  })

  // Right screen: navigation & ejection vector (amber glow)
  into.box([0.48, 0.32, 0.04], {
    at: [x + 0.36, y + 0.18, z - 0.05],
    colour: STEEL_DARK,
    rotation: [-0.35, 0, 0],
  })
  into.box([0.42, 0.26, 0.02], {
    at: [x + 0.36, y + 0.18, z - 0.03],
    colour: SCREEN_NAVIGATION_AMBER,
    rotation: [-0.35, 0, 0],
    glow: true,
  })
}

function consoleControls(
  into: BanquetDetailBuilder,
  top: { x: number; y: number; z: number },
): void {
  const { x, y, z } = top

  // Center control faceplate with emergency launch release button
  into.box([0.34, 0.04, 0.26], { at: [x, y + 0.02, z + 0.12], colour: PANEL_SURFACE })
  // Yellow/black hazard flip guard
  into.box([0.14, 0.06, 0.14], { at: [x, y + 0.05, z + 0.12], colour: SAFETY_COVER_HAZARD })
  // Illuminated ejection trigger button inside guard
  into.cylinder(
    { radius: 0.038, height: 0.04, sides: 12 },
    { at: [x, y + 0.06, z + 0.12], colour: BUTTON_EJECT_RED, glow: true },
  )

  // Row of status toggle switches and indicator LEDs
  for (let i = -2; i <= 2; i++) {
    const swX = x + i * 0.18
    into.box([0.02, 0.03, 0.04], { at: [swX, y + 0.02, z + 0.24], colour: CHROME_BRIGHT })
    into.sphere([0.012, 0.012, 0.012], {
      at: [swX, y + 0.035, z + 0.2],
      colour: i === 0 ? LED_STANDBY_AMBER : LED_ONLINE_GREEN,
      glow: true,
    })
  }

  // Interphone comms microphone and coiled cord on side bracket
  into.box([0.06, 0.16, 0.08], { at: [x - 0.64, y + 0.06, z + 0.08], colour: STEEL_DARK })
  into.cylinder(
    { radius: 0.02, height: 0.12, sides: 8 },
    { at: [x - 0.64, y + 0.18, z + 0.08], colour: STEEL_BRUSHED },
  )
}

/** The low hatch control console standing directly beneath the open round hatch (Ch. 383, p. 60). */
export function dressHatchConsole(placement: EquipmentPlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Ergonomic slanted console body (1.4m wide, 0.65m deep, 0.88m high)
  into.box([1.4, 0.72, 0.65], { at: [x, floor + 0.36, z], colour: STEEL_GRAPHITE })
  into.box([1.44, 0.06, 0.68], { at: [x, floor + 0.74, z], colour: STEEL_BRUSHED })
  into.box([1.42, 0.16, 0.04], { at: [x, floor + 0.08, z + 0.31], colour: STEEL_DARK })

  consoleScreens(into, { x, y: floor + 0.76, z })
  consoleControls(into, { x, y: floor + 0.76, z })
}

/** The separate rectangular survival cabinet standing right of the console (Ch. 383, p. 60). */
export function dressHatchCabinet(placement: EquipmentPlacement): void {
  const { into, floor, at } = placement
  const [x, z] = at

  // Rugged marine equipment locker (0.72m wide, 0.72m deep, 0.95m tall)
  into.box([0.72, 0.95, 0.72], { at: [x, floor + 0.475, z], colour: CABINET_STEEL })
  into.box([0.74, 0.05, 0.74], { at: [x, floor + 0.94, z], colour: STEEL_GRAPHITE })
  into.box([0.74, 0.08, 0.74], { at: [x, floor + 0.04, z], colour: STEEL_DARK })

  // Double doors with center reveal and chrome compression latches
  into.box([0.02, 0.82, 0.02], { at: [x, floor + 0.48, z + 0.37], colour: STEEL_DARK })
  into.box([0.04, 0.12, 0.04], { at: [x - 0.08, floor + 0.55, z + 0.38], colour: CHROME_BRIGHT })
  into.box([0.04, 0.12, 0.04], { at: [x + 0.08, floor + 0.55, z + 0.38], colour: CHROME_BRIGHT })

  // Emergency medical trauma kit case on top (white with red cross)
  into.box([0.34, 0.14, 0.24], { at: [x - 0.14, floor + 1.04, z - 0.1], colour: FIRST_AID_WHITE })
  into.box([0.04, 0.01, 0.14], { at: [x - 0.14, floor + 1.12, z - 0.1], colour: BUTTON_EJECT_RED })
  into.box([0.14, 0.01, 0.04], { at: [x - 0.14, floor + 1.12, z - 0.1], colour: BUTTON_EJECT_RED })

  // Twin high-pressure oxygen cylinders with brass regulator manifolds
  for (const ox of [x + 0.14, x + 0.24]) {
    into.cylinder(
      { radius: 0.05, height: 0.32, sides: 12 },
      { at: [ox, floor + 1.13, z - 0.08], colour: OXYGEN_CYLINDER_GREEN },
    )
    into.cylinder(
      { radius: 0.02, height: 0.06, sides: 8 },
      { at: [ox, floor + 1.31, z - 0.08], colour: TIE_DOWN_BRASS },
    )
  }

  // Emergency pyrotechnic distress signal flares
  into.cylinder(
    { radius: 0.025, height: 0.22, sides: 8 },
    { at: [x - 0.14, floor + 1.08, z + 0.16], colour: FLARE_ORANGE },
  )
  into.cylinder(
    { radius: 0.025, height: 0.22, sides: 8 },
    { at: [x - 0.06, floor + 1.08, z + 0.16], colour: FLARE_ORANGE },
  )

  // Survival ration emergency pack
  into.box([0.22, 0.1, 0.14], { at: [x + 0.16, floor + 1.02, z + 0.16], colour: RATION_PACK_OLIVE })
}
