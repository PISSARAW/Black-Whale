import {
  wallBays,
  wallBox,
  wallPoint,
  type WallSurface,
} from './corridorWallLayout'

const WEB_FRAME = 0x2e333a
const GUSSET_STEEL = 0x24282f
const STRINGER_BEAM = 0x363c44
const VENT_TRUNK = 0x485058
const FLANGE_RING = 0x272c33
const CABLE_BLACK = 0x181a1c
const STRAP_METAL = 0x6e7680
const SLIDING_DOOR = 0x2f343b
const SCUPPER_BASE = 0x1f2328
const LAMP_GREEN = 0x3a4539
const LAMP_GLOW = 0xf9df9b

interface Tier5WallContext {
  floor: number
  ceiling: number
}

function baseScupper(wall: WallSurface, floor: number): void {
  const { length } = wall.run
  // Deep steel scupper gutter / kickplate along wall base
  wallBox(wall, [length, 0.16, 0.08], {
    along: length / 2,
    y: floor + 0.08,
    colour: SCUPPER_BASE,
    inset: 0.04,
  })
}

function webGussets(
  wall: WallSurface,
  along: number,
  context: Tier5WallContext,
): void {
  const { floor, ceiling } = context
  // Bottom triangular bracket gusset
  wallBox(wall, [0.14, 0.28, 0.18], {
    along,
    y: floor + 0.22,
    colour: GUSSET_STEEL,
    inset: 0.16,
  })
  wallBox(wall, [0.14, 0.16, 0.28], {
    along,
    y: floor + 0.12,
    colour: GUSSET_STEEL,
    inset: 0.22,
  })

  // Top triangular bracket gusset
  wallBox(wall, [0.14, 0.28, 0.18], {
    along,
    y: ceiling - 0.22,
    colour: GUSSET_STEEL,
    inset: 0.16,
  })
  wallBox(wall, [0.14, 0.16, 0.28], {
    along,
    y: ceiling - 0.12,
    colour: GUSSET_STEEL,
    inset: 0.22,
  })
}

function transverseWebFrames(
  wall: WallSurface,
  context: Tier5WallContext,
): void {
  const { floor, ceiling } = context
  const height = ceiling - floor
  const pitch = 2.8
  const { length } = wall.run

  for (let along = 1.4; along < length; along += pitch) {
    // Deep structural vertical frame (transverse web frame)
    wallBox(wall, [0.16, height, 0.24], {
      along,
      y: floor + height / 2,
      colour: WEB_FRAME,
      inset: 0.12,
    })
    webGussets(wall, along, context)

    // Vapor-proof marine work lamp mounted directly on frame face
    const pt = wallPoint(wall.run, { along, y: floor + 2.0, inset: 0.26 })
    wall.into.box([0.1, 0.16, 0.06], {
      at: pt,
      rotation: [0, wall.run.angle, 0],
      colour: LAMP_GREEN,
    })
    const bulbPt = wallPoint(wall.run, { along, y: floor + 2.0, inset: 0.3 })
    wall.into.cylinder(
      { radius: 0.04, height: 0.08, sides: 6 },
      { at: bulbPt, colour: LAMP_GLOW, glow: true },
    )
  }
}

function horizontalGirdersAndCables(
  wall: WallSurface,
  context: Tier5WallContext,
): void {
  const { floor, ceiling } = context
  const midY = floor + (ceiling - floor) * 0.45
  const { length } = wall.run

  // Heavy longitudinal stringer beam
  wallBox(wall, [length, 0.14, 0.12], {
    along: length / 2,
    y: midY,
    colour: STRINGER_BEAM,
    inset: 0.08,
  })

  // Heavy marine cable bundle resting atop the stringer
  wallBox(wall, [length, 0.05, 0.05], {
    along: length / 2,
    y: midY + 0.1,
    colour: CABLE_BLACK,
    inset: 0.07,
  })

  // Metal strapping bands along cable bundle
  const step = 1.4
  for (let along = 0.7; along < length; along += step) {
    wallBox(wall, [0.03, 0.07, 0.06], {
      along,
      y: midY + 0.1,
      colour: STRAP_METAL,
      inset: 0.072,
    })
  }
}

function massiveVentilationTrunk(
  wall: WallSurface,
  context: Tier5WallContext,
): void {
  const { ceiling } = context
  const { length } = wall.run
  // Colossal upper ventilation duct
  wallBox(wall, [length, 0.34, 0.34], {
    along: length / 2,
    y: ceiling - 0.25,
    colour: VENT_TRUNK,
    inset: 0.2,
  })

  // Flanged connecting rings every 2.8m
  const pitch = 2.8
  for (let along = 1.4; along < length; along += pitch) {
    wallBox(wall, [0.06, 0.38, 0.38], {
      along,
      y: ceiling - 0.25,
      colour: FLANGE_RING,
      inset: 0.2,
    })
  }
}

function slidingCargoGate(
  wall: WallSurface,
  along: number,
  floor: number,
): void {
  // Overhead heavy roller track
  wallBox(wall, [1.4, 0.1, 0.1], {
    along,
    y: floor + 2.3,
    colour: WEB_FRAME,
    inset: 0.09,
  })
  // Massive corrugated sliding door leaf
  wallBox(wall, [1.1, 2.15, 0.06], {
    along,
    y: floor + 1.1,
    colour: SLIDING_DOOR,
    inset: 0.08,
  })
}

/** Dresses a Tier 5 steerage/cargo passage with colossal web frames, stringers and ducts. */
export function dressTier5CorridorWall(
  wall: WallSurface,
  context: Tier5WallContext,
): void {
  const { floor } = context
  baseScupper(wall, floor)
  transverseWebFrames(wall, context)
  horizontalGirdersAndCables(wall, context)
  massiveVentilationTrunk(wall, context)

  const bays = wallBays(wall.run, 4.2)
  for (const bay of bays) {
    if (bay.index % 2 === 0) {
      slidingCargoGate(wall, bay.along, floor)
    }
  }
}
