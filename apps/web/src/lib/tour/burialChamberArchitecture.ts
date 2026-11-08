import type * as Three from 'three'
import { floorOf, ceilingOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Space } from './types'

export const BURIAL_SPACE = 'tier-1-princes-burial-chamber-rotunda'

const OBSIDIAN = 0x24201c,
  DARK_STONE = 0x3d352c,
  PILASTER_STONE = 0x857a6e,
  BRONZE = 0x72604c,
  GOLD = 0xd4af37,
  LUMEN_WHITE = 0xffffff,
  LUMEN_WARM = 0xfef5e0,
  MOMOZE_FLAME = 0xff6600

interface Context {
  into: BanquetDetailBuilder
  floor: number
  ceilingHeight: number
}

function ceilingAndRibs(context: Context): void {
  const { into, floor, ceilingHeight } = context
  const topY = floor + ceilingHeight

  // Central zenithal ring
  into.ring(
    { radius: 2.2, tube: 0.14 },
    { at: [0, topY - 0.12, 0], colour: BRONZE, rotation: [Math.PI / 2, 0, 0] },
  )

  // 14 radial ribs descending from the zenithal ring to the outer wall
  for (let i = 0; i < 14; i++) {
    const angle = (i * 2 * Math.PI) / 14
    const midR = 6.2
    const x = Math.cos(angle) * midR
    const z = Math.sin(angle) * midR
    const length = 8.0
    into.box([0.16, 0.22, length], {
      at: [x, topY - 0.25, z],
      colour: DARK_STONE,
      rotation: [0, -angle + Math.PI / 2, 0],
    })
  }
}

function outerWallPilasters(context: Context): void {
  const { into, floor, ceilingHeight } = context
  const wallRadius = 10.15
  const halfH = ceilingHeight / 2

  for (let i = 0; i < 14; i++) {
    const angle = (i * 2 * Math.PI) / 14
    const x = Math.cos(angle) * wallRadius
    const z = Math.sin(angle) * wallRadius
    // Pilaster body in lighter polished ceremonial stone
    into.box([0.7, ceilingHeight, 0.22], {
      at: [x, floor + halfH, z],
      colour: PILASTER_STONE,
      rotation: [0, -angle + Math.PI / 2, 0],
    })
    // Gold ceremonial banding
    into.box([0.74, 0.08, 0.26], {
      at: [x, floor + 2.5, z],
      colour: GOLD,
      rotation: [0, -angle + Math.PI / 2, 0],
    })
    // Dedicated uplight trough at the base of every pilaster
    into.box([0.76, 0.05, 0.18], {
      at: [x * 0.985, floor + 0.035, z * 0.985],
      colour: LUMEN_WHITE,
      glow: true,
      rotation: [0, -angle + Math.PI / 2, 0],
    })
    // Ceremonial sconce fixture casting warm ascending wash up the wall
    into.box([0.18, 0.08, 0.12], {
      at: [x * 0.98, floor + 2.8, z * 0.98],
      colour: LUMEN_WARM,
      glow: true,
      rotation: [0, -angle + Math.PI / 2, 0],
    })
  }

  // Broad cove uplight ring running along the perimeter floor base
  into.ring(
    { radius: wallRadius - 0.06, tube: 0.024 },
    { at: [0, floor + 0.03, 0], colour: LUMEN_WHITE, glow: true, rotation: [Math.PI / 2, 0, 0] },
  )
}

function floorCircuits(into: BanquetDetailBuilder, floor: number): void {
  const rings = [1.5, 2.2, 2.9, 3.6, 4.3, 5.0, 5.7, 6.4, 7.1, 7.8, 8.5, 9.2, 9.8]
  const tube = 0.01
  const y = floor + tube + 0.003

  // Concentric luminescent circuit rings emitting stark white floor light
  for (const r of rings) {
    into.ring(
      { radius: r, tube },
      { at: [0, y, 0], colour: LUMEN_WHITE, glow: true, rotation: [Math.PI / 2, 0, 0] },
    )
  }

  // Radial maze cross-lines connecting concentric rings
  for (let i = 0; i < 42; i++) {
    const angle = (i * 2 * Math.PI) / 42
    const rStart = rings[i % 5]
    const rEnd = rings[(i % 5) + 2] ?? rings[rings.length - 1]
    const span = rEnd - rStart
    const midR = (rStart + rEnd) / 2
    into.box([0.05, 0.008, span], {
      at: [Math.cos(angle) * midR, y, Math.sin(angle) * midR],
      colour: LUMEN_WHITE,
      glow: true,
      rotation: [0, -angle + Math.PI / 2, 0],
    })
  }

  // 14 glowing junction rings at the soul relay distance (r = 4.15)
  for (let i = 0; i < 14; i++) {
    const angle = (i * 2 * Math.PI) / 14
    into.ring(
      { radius: 0.32, tube: 0.008 },
      {
        at: [Math.cos(angle) * 4.15, y, Math.sin(angle) * 4.15],
        colour: LUMEN_WARM,
        glow: true,
        rotation: [Math.PI / 2, 0, 0],
      },
    )
  }
}

function sunburstSpikes(into: BanquetDetailBuilder, floor: number): void {
  // Manga ch. 371: dramatic starburst of 28 sharp pointed teeth radiating on the floor
  for (let i = 0; i < 14; i++) {
    // 14 primary long razor teeth pointing outward between cables
    const longAngle = (i * 2 * Math.PI) / 14
    const longMidR = 2.125
    into.box([0.08, 0.03, 1.65], {
      at: [Math.cos(longAngle) * longMidR, floor + 0.02, Math.sin(longAngle) * longMidR],
      colour: DARK_STONE,
      rotation: [0, -longAngle + Math.PI / 2, 0],
    })
    into.box([0.03, 0.035, 1.65], {
      at: [Math.cos(longAngle) * longMidR, floor + 0.022, Math.sin(longAngle) * longMidR],
      colour: LUMEN_WHITE,
      glow: true,
      rotation: [0, -longAngle + Math.PI / 2, 0],
    })

    // 14 secondary intermediate sharp teeth
    const shortAngle = longAngle + Math.PI / 14
    const shortMidR = 1.75
    into.box([0.07, 0.025, 0.9], {
      at: [Math.cos(shortAngle) * shortMidR, floor + 0.018, Math.sin(shortAngle) * shortMidR],
      colour: BRONZE,
      rotation: [0, -shortAngle + Math.PI / 2, 0],
    })
    into.box([0.025, 0.03, 0.9], {
      at: [Math.cos(shortAngle) * shortMidR, floor + 0.02, Math.sin(shortAngle) * shortMidR],
      colour: LUMEN_WARM,
      glow: true,
      rotation: [0, -shortAngle + Math.PI / 2, 0],
    })
  }
}

function nozzleCollar(into: BanquetDetailBuilder, floor: number): void {
  // Base stepped pedestal
  into.cylinder(
    { radius: 1.48, height: 0.28, sides: 28 },
    { at: [0, floor + 0.14, 0], colour: DARK_STONE },
  )
  into.cylinder(
    { radius: 1.32, height: 0.18, sides: 28 },
    { at: [0, floor + 0.37, 0], colour: BRONZE },
  )

  // 14 cable nozzle ports docked around base collar
  for (let i = 0; i < 14; i++) {
    const angle = Math.PI / 2 - (i * 2 * Math.PI) / 14 - (2 * Math.PI) / 28
    const coffinNumber = i + 1
    const hasFlame = coffinNumber === 8 || coffinNumber === 10 || coffinNumber === 12
    const nx = Math.cos(angle) * 1.32
    const nz = Math.sin(angle) * 1.32

    into.cylinder(
      { radius: 0.08, height: 0.22, sides: 12 },
      {
        at: [nx, floor + 0.35, nz],
        colour: BRONZE,
        rotation: [Math.PI / 2, 0, -angle + Math.PI / 2],
      },
    )
    into.ring(
      { radius: 0.07, tube: 0.012 },
      {
        at: [Math.cos(angle) * 1.42, floor + 0.35, Math.sin(angle) * 1.42],
        colour: hasFlame ? MOMOZE_FLAME : DARK_STONE,
        glow: hasFlame,
        rotation: [0, -angle, 0],
      },
    )
  }
}

function flutedVesselAndGlyph(into: BanquetDetailBuilder, floor: number): void {
  // Fluted machine vessel
  into.flutedShaft(
    { radius: 0.98, height: 1.55, flutes: 14 },
    { at: [0, floor + 1.25, 0], colour: OBSIDIAN },
  )

  // Dual horizontal brass binding bands
  into.ring(
    { radius: 1.01, tube: 0.02 },
    { at: [0, floor + 0.75, 0], colour: BRONZE, rotation: [Math.PI / 2, 0, 0] },
  )
  into.ring(
    { radius: 1.01, tube: 0.02 },
    { at: [0, floor + 1.75, 0], colour: BRONZE, rotation: [Math.PI / 2, 0, 0] },
  )

  // 14 vertical conduit rods along fluting with warm luminous core
  for (let i = 0; i < 14; i++) {
    const angle = (i * 2 * Math.PI) / 14
    const x = Math.cos(angle) * 1.0
    const z = Math.sin(angle) * 1.0
    into.box([0.05, 1.55, 0.06], {
      at: [x, floor + 1.25, z],
      colour: BRONZE,
      rotation: [0, -angle + Math.PI / 2, 0],
    })
    into.box([0.02, 1.45, 0.04], {
      at: [x * 0.99, floor + 1.25, z * 0.99],
      colour: LUMEN_WARM,
      glow: true,
      rotation: [0, -angle + Math.PI / 2, 0],
    })
  }

  // Manga ch. 371: carved ceremonial Kakin ritual glyph tablet on front chest
  const ga = Math.PI / 2 - (2 * Math.PI) / 28
  const gx = Math.cos(ga) * 1.02
  const gz = Math.sin(ga) * 1.02
  into.box([0.58, 0.72, 0.06], {
    at: [gx, floor + 1.3, gz],
    colour: GOLD,
    rotation: [0, -ga + Math.PI / 2, 0],
  })
  into.box([0.48, 0.62, 0.08], {
    at: [gx, floor + 1.3, gz],
    colour: OBSIDIAN,
    rotation: [0, -ga + Math.PI / 2, 0],
  })
  into.ring(
    { radius: 0.16, tube: 0.016 },
    {
      at: [gx, floor + 1.3, gz],
      colour: GOLD,
      rotation: [Math.PI / 2, 0, -ga + Math.PI / 2],
    },
  )
  into.box([0.12, 0.12, 0.1], {
    at: [gx, floor + 1.3, gz],
    colour: MOMOZE_FLAME,
    glow: true,
    rotation: [0, -ga + Math.PI / 2, 0],
  })
}

function domeAndUmbilical(into: BanquetDetailBuilder, floor: number): void {
  // Luminous halo under the capital cornice
  into.ring(
    { radius: 1.15, tube: 0.014 },
    { at: [0, floor + 2.05, 0], colour: LUMEN_WARM, glow: true, rotation: [Math.PI / 2, 0, 0] },
  )

  // Upper cornice and top dome cap
  into.cylinder(
    { radius: 1.18, height: 0.16, sides: 28 },
    { at: [0, floor + 2.1, 0], colour: BRONZE },
  )
  into.sphere([0.9, 0.45, 0.9], { at: [0, floor + 2.3, 0], colour: DARK_STONE })

  // Sacrificial spire tip
  into.cylinder(
    { radius: 0.08, bottom: 0.16, height: 0.45, sides: 14 },
    { at: [0, floor + 2.7, 0], colour: GOLD },
  )
  into.sphere([0.06, 0.06, 0.06], { at: [0, floor + 2.95, 0], colour: MOMOZE_FLAME, glow: true })

  // Manga ch. 371: prominent umbilical pipe looping from top dome to base
  into.curve(
    [
      [0.15, floor + 2.45, 0.15],
      [0.65, floor + 2.3, 0.65],
      [1.05, floor + 1.5, 0.8],
      [1.1, floor + 0.8, 0.65],
      [0.95, floor + 0.35, 0.5],
    ],
    0.038,
    { at: [0, 0, 0], colour: BRONZE },
  )
}

function centralApparatus(into: BanquetDetailBuilder, floor: number): void {
  sunburstSpikes(into, floor)
  nozzleCollar(into, floor)
  flutedVesselAndGlyph(into, floor)
  domeAndUmbilical(into, floor)
}

function cablesAndRelayNodes(into: BanquetDetailBuilder, floor: number): void {
  for (let i = 0; i < 14; i++) {
    const angle = Math.PI / 2 - (i * 2 * Math.PI) / 14 - (2 * Math.PI) / 28
    const coffinNumber = i + 1
    const isClosed = coffinNumber === 8 || coffinNumber === 10 || coffinNumber === 12
    const hasFlame = isClosed

    // Cable running from central machine (r = 1.2) to coffin head (r = 6.95)
    const cableSpan = 5.75
    const cableMidR = 1.2 + cableSpan / 2
    into.box([0.045, 0.025, cableSpan], {
      at: [Math.cos(angle) * cableMidR, floor + 0.015, Math.sin(angle) * cableMidR],
      colour: hasFlame ? 0xf59e0b : 0x221f1c,
      glow: hasFlame,
      rotation: [0, -angle + Math.PI / 2, 0],
    })

    // Intermediate soul relay node at r = 4.15
    const nodeR = 4.15
    const nx = Math.cos(angle) * nodeR
    const nz = Math.sin(angle) * nodeR

    // Relay pedestal
    into.cylinder(
      { radius: 0.18, height: 0.12, sides: 12 },
      { at: [nx, floor + 0.06, nz], colour: isClosed ? BRONZE : DARK_STONE },
    )

    // Base ring on relay node
    into.ring(
      { radius: 0.2, tube: 0.005 },
      {
        at: [nx, floor + 0.015, nz],
        colour: hasFlame ? 0xf59e0b : DARK_STONE,
        glow: hasFlame,
        rotation: [Math.PI / 2, 0, 0],
      },
    )

    // Relay orb
    into.sphere([0.2, 0.2, 0.2], {
      at: [nx, floor + 0.24, nz],
      colour: hasFlame ? MOMOZE_FLAME : DARK_STONE,
      glow: hasFlame,
    })

    if (hasFlame) {
      // White-hot inner core of aura flame
      into.sphere([0.1, 0.15, 0.1], {
        at: [nx, floor + 0.24, nz],
        colour: LUMEN_WHITE,
        glow: true,
      })
    }
  }
}

export function dressBurialArchitecture(options: {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}): void {
  const { into, plan, space } = options
  const floor = floorOf(space, plan.tier)
  const ceilingHeight = ceilingOf(space, plan.tier)
  const context: Context = { into, floor, ceilingHeight }

  ceilingAndRibs(context)
  outerWallPilasters(context)
  floorCircuits(into, floor)
  centralApparatus(into, floor)
  cablesAndRelayNodes(into, floor)
}
