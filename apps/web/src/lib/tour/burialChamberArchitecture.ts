import type * as Three from 'three'
import { floorOf, ceilingOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Space } from './types'

export const BURIAL_SPACE = 'tier-1-princes-burial-chamber-rotunda'

const OBSIDIAN = 0x141211,
  DARK_STONE = 0x25211d,
  BRONZE = 0x4a4035,
  GOLD = 0xbda062,
  CIRCUIT_LINE = 0x6e6350,
  MOMOZE_GLOW = 0xf59e0b

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
    // Pilaster body
    into.box([0.7, ceilingHeight, 0.22], {
      at: [x, floor + halfH, z],
      colour: DARK_STONE,
      rotation: [0, -angle + Math.PI / 2, 0],
    })
    // Gold ceremonial banding
    into.box([0.74, 0.08, 0.26], {
      at: [x, floor + 2.5, z],
      colour: GOLD,
      rotation: [0, -angle + Math.PI / 2, 0],
    })
  }
}

function floorCircuits(into: BanquetDetailBuilder, floor: number): void {
  const rings = [1.8, 3.1, 4.4, 5.7, 7.0, 8.3, 9.6]
  const tube = 0.006
  const y = floor + tube + 0.002

  // Concentric circuit rings
  for (const r of rings) {
    into.ring(
      { radius: r, tube },
      { at: [0, y, 0], colour: CIRCUIT_LINE, rotation: [Math.PI / 2, 0, 0] },
    )
  }

  // Radial maze cross-lines connecting concentric rings
  for (let i = 0; i < 28; i++) {
    const angle = (i * 2 * Math.PI) / 28
    const rStart = rings[i % 4]
    const rEnd = rings[(i % 4) + 2] ?? rings[6]
    const span = rEnd - rStart
    const midR = (rStart + rEnd) / 2
    into.box([0.04, 0.006, span], {
      at: [Math.cos(angle) * midR, y, Math.sin(angle) * midR],
      colour: CIRCUIT_LINE,
      rotation: [0, -angle + Math.PI / 2, 0],
    })
  }
}

function centralApparatus(into: BanquetDetailBuilder, floor: number): void {
  // 14 starburst base spikes radiating on the floor
  for (let i = 0; i < 14; i++) {
    const angle = (i * 2 * Math.PI) / 14
    const midR = 1.85
    into.box([0.12, 0.06, 1.3], {
      at: [Math.cos(angle) * midR, floor + 0.03, Math.sin(angle) * midR],
      colour: BRONZE,
      rotation: [0, -angle + Math.PI / 2, 0],
    })
  }

  // Base plinth
  into.cylinder(
    { radius: 1.45, height: 0.35, sides: 28 },
    { at: [0, floor + 0.175, 0], colour: DARK_STONE },
  )

  // Stepped bronze collar
  into.cylinder(
    { radius: 1.22, height: 0.18, sides: 28 },
    { at: [0, floor + 0.44, 0], colour: BRONZE },
  )

  // Fluted machine body
  into.cylinder(
    { radius: 0.95, height: 1.55, sides: 28 },
    { at: [0, floor + 1.3, 0], colour: OBSIDIAN },
  )

  // 14 vertical conduit rods around the cylinder
  for (let i = 0; i < 14; i++) {
    const angle = (i * 2 * Math.PI) / 14
    into.box([0.06, 1.55, 0.08], {
      at: [Math.cos(angle) * 0.97, floor + 1.3, Math.sin(angle) * 0.97],
      colour: BRONZE,
      rotation: [0, -angle + Math.PI / 2, 0],
    })
  }

  // Upper cornice and top dome cap
  into.cylinder(
    { radius: 1.15, height: 0.16, sides: 28 },
    { at: [0, floor + 2.15, 0], colour: BRONZE },
  )
  into.sphere([0.88, 0.42, 0.88], { at: [0, floor + 2.36, 0], colour: DARK_STONE })
  into.box([0.28, 0.28, 0.28], { at: [0, floor + 2.62, 0], colour: GOLD })
}

function cablesAndRelayNodes(into: BanquetDetailBuilder, floor: number): void {
  for (let i = 0; i < 14; i++) {
    const angle = Math.PI / 2 - (i * 2 * Math.PI) / 14 - (2 * Math.PI) / 28
    const isMomoze = i === 0

    // Cable running from central machine (r = 1.2) to coffin head (r = 6.95)
    const cableSpan = 5.75
    const cableMidR = 1.2 + cableSpan / 2
    into.box([0.045, 0.025, cableSpan], {
      at: [Math.cos(angle) * cableMidR, floor + 0.015, Math.sin(angle) * cableMidR],
      colour: isMomoze ? BRONZE : 0x2a2520,
      rotation: [0, -angle + Math.PI / 2, 0],
    })

    // Intermediate soul relay node at r = 4.15
    const nodeR = 4.15
    const nx = Math.cos(angle) * nodeR
    const nz = Math.sin(angle) * nodeR

    // Relay pedestal
    into.cylinder(
      { radius: 0.18, height: 0.12, sides: 12 },
      { at: [nx, floor + 0.06, nz], colour: BRONZE },
    )

    // Relay orb
    into.sphere([0.2, 0.2, 0.2], {
      at: [nx, floor + 0.24, nz],
      colour: isMomoze ? MOMOZE_GLOW : DARK_STONE,
      glow: isMomoze,
    })

    if (isMomoze) {
      // White-hot inner core of Momoze's aura flame
      into.sphere([0.09, 0.13, 0.09], {
        at: [nx, floor + 0.24, nz],
        colour: 0xffffff,
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
