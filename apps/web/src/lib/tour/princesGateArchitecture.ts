import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Space } from './types'

const DARK_STONE = 0x3d352c
const PILASTER_STONE = 0x857a6e
const BRONZE = 0x72604c
const GOLD = 0xd4af37
const STEEL = 0x889098
const GLASS_TINT = 0x4a6070
const LUMEN_WARM = 0xfef5e0
const STATUS_GREEN = 0x28a745
const CARPET_RED = 0x7a1818

interface GateContext {
  into: BanquetDetailBuilder
  floor: number
  ceilingHeight: number
  space: Space
}

function frontPortal(context: GateContext): void {
  const { into, floor, ceilingHeight } = context
  const halfH = ceilingHeight / 2
  const x = 13.25

  // Flanking ceremonial pilasters with bronze bands
  for (const y of [-2.4, 2.4]) {
    into.box([0.36, ceilingHeight, 0.48], {
      at: [x, floor + halfH, y],
      colour: PILASTER_STONE,
    })
    into.box([0.4, 0.12, 0.52], {
      at: [x, floor + 2.4, y],
      colour: BRONZE,
    })
    into.box([0.4, 0.12, 0.52], {
      at: [x, floor + ceilingHeight - 0.3, y],
      colour: BRONZE,
    })
  }

  // Overhead entablature and monumental royal lintel
  into.box([0.38, 0.45, 5.28], {
    at: [x, floor + ceilingHeight - 0.25, 0],
    colour: DARK_STONE,
  })
  // Gold Kakin crest medallion
  into.cylinder(
    { radius: 0.32, height: 0.06, sides: 16 },
    {
      at: [x + 0.05, floor + ceilingHeight - 0.32, 0],
      colour: GOLD,
      rotation: [0, 0, Math.PI / 2],
    },
  )
}

function securityScreening(context: GateContext): void {
  const { into, floor } = context
  const x = 14.2

  // Metal detector scanner archway
  for (const y of [-0.65, 0.65]) {
    into.box([0.16, 2.25, 0.14], {
      at: [x, floor + 1.125, y],
      colour: STEEL,
    })
    // Green indicator light
    into.box([0.18, 0.06, 0.06], {
      at: [x, floor + 1.9, y],
      colour: STATUS_GREEN,
      glow: true,
    })
  }
  // Scanner lintel bar
  into.box([0.16, 0.14, 1.44], {
    at: [x, floor + 2.25, 0],
    colour: STEEL,
  })

  // Turnstile stanchions
  for (const y of [-1.15, 1.15]) {
    into.cylinder({ radius: 0.08, height: 0.95 }, { at: [x, floor + 0.475, y], colour: STEEL })
    into.box([0.04, 0.03, 0.4], {
      at: [x, floor + 0.85, y + (y > 0 ? -0.2 : 0.2)],
      colour: BRONZE,
    })
  }

  // Security glazed screens on flanks
  for (const y of [-3.4, 3.4]) {
    into.box([0.08, 2.1, 2.6], {
      at: [x, floor + 1.05, y],
      colour: GLASS_TINT,
    })
    into.box([0.14, 0.08, 2.66], {
      at: [x, floor + 2.14, y],
      colour: BRONZE,
    })
  }
}

function rearPortal(context: GateContext): void {
  const { into, floor, ceilingHeight } = context
  const halfH = ceilingHeight / 2
  const x = 16.32

  // Rear entrance framing towards cross-gap-1
  for (const y of [-2.4, 2.4]) {
    into.box([0.28, ceilingHeight, 0.42], {
      at: [x, floor + halfH, y],
      colour: PILASTER_STONE,
    })
  }

  // Overhead checkpoint sign plaque
  into.box([0.08, 0.35, 3.6], {
    at: [x, floor + ceilingHeight - 0.45, 0],
    colour: DARK_STONE,
  })
  into.box([0.1, 0.18, 3.2], {
    at: [x, floor + ceilingHeight - 0.45, 0],
    colour: GOLD,
  })
}

function ceilingAndFloor(context: GateContext): void {
  const { into, floor, ceilingHeight } = context
  const topY = floor + ceilingHeight

  // Coffered ceiling transverse beams
  for (const x of [13.6, 14.8, 16.0]) {
    into.box([0.22, 0.18, 13.0], {
      at: [x, topY - 0.09, 0],
      colour: DARK_STONE,
    })
  }

  // Inspection overhead downlights
  for (const x of [13.9, 15.4]) {
    for (const y of [-3.0, 0, 3.0]) {
      into.cylinder(
        { radius: 0.18, height: 0.05 },
        { at: [x, topY - 0.025, y], colour: LUMEN_WARM, glow: true },
      )
    }
  }

  // Central royal carpet runner along the access path
  into.box([3.4, 0.015, 2.2], {
    at: [14.75, floor + 0.008, 0],
    colour: CARPET_RED,
  })
  for (const borderY of [-1.08, 1.08]) {
    into.box([3.4, 0.018, 0.04], {
      at: [14.75, floor + 0.01, borderY],
      colour: GOLD,
    })
  }
}

export function dressPrincesGateArchitecture(context: GateContext): void {
  frontPortal(context)
  securityScreening(context)
  rearPortal(context)
  ceilingAndFloor(context)
}
