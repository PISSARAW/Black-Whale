import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import type { Space } from './types'
import {
  UNMA_GOLD,
  UNMA_WOOD,
} from './queenUnmaDetailSurface'

export interface ArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

function wallPanelling(context: ArchitectureContext): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)

  for (const run of banquetWallRuns(plan, space)) {
    // Base plinth, dado rail, and upper cornice
    for (const [y, height, depth, col] of [
      [0.16, 0.28, 0.08, UNMA_WOOD],
      [0.92, 0.06, 0.09, UNMA_WOOD],
      [0.96, 0.02, 0.095, UNMA_GOLD],
      [2.5, 0.04, 0.06, UNMA_GOLD],
      [3.8, 0.14, 0.16, UNMA_WOOD],
      [3.92, 0.05, 0.18, UNMA_GOLD],
    ]) {
      into.box([run.length, height, depth], {
        at: wallPoint(run, { along: run.length / 2, y: floor + y, inset: depth / 2 }),
        rotation: [0, run.angle, 0],
        colour: col,
      })
    }

    // Repeated moulded vertical panels
    const panelCount = Math.max(1, Math.floor(run.length / 1.6))
    for (let i = 0; i < panelCount; i++) {
      const along = ((i + 0.5) * run.length) / panelCount
      into.box([0.95, 1.25, 0.035], {
        at: wallPoint(run, { along, y: floor + 1.75, inset: 0.04 }),
        rotation: [0, run.angle, 0],
        colour: UNMA_WOOD,
      })
      into.box([0.85, 1.15, 0.04], {
        at: wallPoint(run, { along, y: floor + 1.75, inset: 0.045 }),
        rotation: [0, run.angle, 0],
        colour: UNMA_GOLD,
      })
      into.box([0.75, 1.05, 0.045], {
        at: wallPoint(run, { along, y: floor + 1.75, inset: 0.05 }),
        rotation: [0, run.angle, 0],
        colour: 0x332219,
      })
    }
  }
}

function nurseryPartition(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const z = -28.2
  const wallH = 4.0

  // Left solid partition wall (from X = -72 to X = -68.2)
  into.box([3.8, wallH, 0.18], {
    at: [-70.1, floor + wallH / 2, z],
    colour: UNMA_WOOD,
  })

  // Right solid partition wall (from X = -65.2 to X = -61)
  into.box([4.2, wallH, 0.18], {
    at: [-63.1, floor + wallH / 2, z],
    colour: UNMA_WOOD,
  })

  // Moulded doorway lintel over the open passage (X: -68.2 to -65.2)
  into.box([3.2, 1.2, 0.22], {
    at: [-66.7, floor + 3.4, z],
    colour: UNMA_WOOD,
  })
  into.box([3.3, 0.08, 0.26], {
    at: [-66.7, floor + 2.82, z],
    colour: UNMA_GOLD,
  })

  // Doorway vertical jambs
  into.box([0.16, 2.8, 0.22], {
    at: [-68.2, floor + 1.4, z],
    colour: UNMA_WOOD,
  })
  into.box([0.16, 2.8, 0.22], {
    at: [-65.2, floor + 1.4, z],
    colour: UNMA_WOOD,
  })

  // Open door leaf swung open against the left wall into the nursery
  into.box([0.08, 2.7, 1.35], {
    at: [-68.12, floor + 1.38, z + 0.72],
    colour: UNMA_WOOD,
  })
  into.box([0.09, 2.5, 1.15], {
    at: [-68.12, floor + 1.38, z + 0.72],
    colour: UNMA_GOLD,
  })
  into.sphere([0.035, 0.035, 0.035], {
    at: [-68.06, floor + 1.05, z + 1.2],
    colour: UNMA_GOLD,
  })
}

function parquetFlooring(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier) + 0.008
  const xs = space.footprint.map(([x]) => x)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const midX = (minX + maxX) / 2
  const borderZ1 = -46.0
  const borderZ2 = -29.5

  into.box([maxX - minX - 0.8, 0.008, 0.12], {
    at: [midX, floor, borderZ1],
    colour: UNMA_GOLD,
  })
  into.box([maxX - minX - 0.8, 0.008, 0.12], {
    at: [midX, floor, borderZ2],
    colour: UNMA_GOLD,
  })
  into.box([0.12, 0.008, borderZ2 - borderZ1], {
    at: [minX + 0.5, floor, (borderZ1 + borderZ2) / 2],
    colour: UNMA_GOLD,
  })
  into.box([0.12, 0.008, borderZ2 - borderZ1], {
    at: [maxX - 0.5, floor, (borderZ1 + borderZ2) / 2],
    colour: UNMA_GOLD,
  })

  // Central salon rug underneath Queen's armchair and coffee table
  into.box([4.8, 0.012, 8.8], {
    at: [-65.06, floor + 0.004, -34.0],
    colour: 0x42232f,
  })
  into.box([4.95, 0.01, 8.95], {
    at: [-65.06, floor + 0.003, -34.0],
    colour: UNMA_GOLD,
  })
}

function ceilingCornice(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const ceil = ceilingOf(space, plan.tier)
  const topY = floor + ceil - 0.08
  const xs = space.footprint.map(([x]) => x)
  const zs = space.footprint.map(([, z]) => z)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)
  const midX = (minX + maxX) / 2

  // Longitudinal ceiling beams
  for (const bx of [minX + 2.5, midX, maxX - 2.5]) {
    into.box([0.22, 0.16, maxZ - minZ], {
      at: [bx, topY, (minZ + maxZ) / 2],
      colour: UNMA_WOOD,
    })
    into.box([0.12, 0.03, maxZ - minZ], {
      at: [bx, topY - 0.09, (minZ + maxZ) / 2],
      colour: UNMA_GOLD,
    })
  }

  // Transverse ceiling beams
  for (let z = minZ + 3; z <= maxZ - 3; z += 4) {
    into.box([maxX - minX, 0.18, 0.22], {
      at: [midX, topY, z],
      colour: UNMA_WOOD,
    })
    into.box([maxX - minX, 0.03, 0.12], {
      at: [midX, topY - 0.09, z],
      colour: UNMA_GOLD,
    })
  }
}

function wallSconces(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)

  for (const run of banquetWallRuns(plan, space)) {
    if (run.length < 3.2) continue
    const count = Math.max(1, Math.floor(run.length / 4.2))

    for (let i = 0; i < count; i++) {
      const along = ((i + 0.5) * run.length) / count
      const baseAt = wallPoint(run, { along, y: floor + 2.3, inset: 0.05 })

      // Gilded ornamental backplate
      into.box([0.12, 0.28, 0.025], {
        at: baseAt,
        rotation: [0, run.angle, 0],
        colour: UNMA_GOLD,
      })

      // Two gooseneck arms with warm glowing light globes
      for (const side of [-1, 1]) {
        const armAt = wallPoint(run, { along: along + side * 0.16, y: floor + 2.45, inset: 0.18 })
        into.sphere([0.02, 0.02, 0.02], { at: armAt, colour: UNMA_GOLD })
        into.cylinder({ radius: 0.025, height: 0.04 }, { at: armAt, colour: UNMA_GOLD })
        into.sphere([0.045, 0.065, 0.045], {
          at: [armAt[0], armAt[1] + 0.05, armAt[2]],
          colour: 0xfff2d4,
          glow: true,
        })
      }
    }
  }
}

function grandChandelier(context: ArchitectureContext): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)
  const ceil = ceilingOf(space, plan.tier)
  const center: [number, number, number] = [-65.06, floor + ceil - 1.4, -34.0]

  // Ceiling rosette and golden suspension chain
  into.cylinder({ radius: 0.32, height: 0.04 }, { at: [-65.06, floor + ceil - 0.1, -34.0], colour: UNMA_GOLD })
  into.cylinder({ radius: 0.018, height: 1.2 }, { at: [-65.06, floor + ceil - 0.7, -34.0], colour: UNMA_GOLD })

  // Central turned baluster spindle
  into.sphere([0.12, 0.16, 0.12], { at: center, colour: UNMA_GOLD })
  into.cylinder({ radius: 0.06, height: 0.35 }, { at: [center[0], center[1] + 0.15, center[2]], colour: UNMA_GOLD })

  // 6 radial curved arms with glowing candle lights and crystals
  const numArms = 6
  const armRadius = 0.82
  for (let i = 0; i < numArms; i++) {
    const angle = (i * 2 * Math.PI) / numArms
    const ax = center[0] + Math.cos(angle) * armRadius
    const az = center[2] + Math.sin(angle) * armRadius
    const ay = center[1] + 0.12

    // Brass arm
    into.box([0.03, 0.03, armRadius], {
      at: [(center[0] + ax) / 2, center[1], (center[2] + az) / 2],
      rotation: [0, -angle + Math.PI / 2, 0],
      colour: UNMA_GOLD,
    })
    into.cylinder({ radius: 0.035, height: 0.04 }, { at: [ax, ay, az], colour: UNMA_GOLD })

    // Glowing candle flame / crystal globe
    into.sphere([0.04, 0.065, 0.04], {
      at: [ax, ay + 0.06, az],
      colour: 0xfff6dd,
      glow: true,
    })

    // Crystal teardrop pendant hanging below
    into.sphere([0.02, 0.05, 0.02], {
      at: [ax, ay - 0.07, az],
      colour: 0xf3f5f8,
      glow: true,
    })
  }
}

function nurseryLantern(context: ArchitectureContext): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)
  const ceil = ceilingOf(space, plan.tier)
  const center: [number, number, number] = [-70.429, floor + ceil - 1.8, -24.41]

  // Ceiling plate & suspension rod
  into.cylinder({ radius: 0.18, height: 0.03 }, { at: [-70.429, floor + ceil - 0.1, -24.41], colour: UNMA_GOLD })
  into.cylinder({ radius: 0.012, height: 1.6 }, { at: [-70.429, floor + ceil - 0.9, -24.41], colour: UNMA_GOLD })

  // Lantern cage in warm bronze
  into.box([0.28, 0.36, 0.28], { at: center, colour: UNMA_GOLD })
  // Soft glowing warm nursery nightlight core
  into.sphere([0.09, 0.12, 0.09], {
    at: center,
    colour: 0xffe6b8,
    glow: true,
  })
}

function alcoveBedsideLighting(context: ArchitectureContext): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)

  // Two bedside lamps on the wall flanking Queen Unma's bed
  for (const zOffset of [-2.8, 2.8]) {
    const lampPos: [number, number, number] = [-71.85, floor + 1.8, -43.145 + zOffset]
    into.box([0.04, 0.14, 0.08], { at: lampPos, colour: UNMA_GOLD })
    into.cylinder({ radius: 0.07, bottom: 0.11, height: 0.14 }, {
      at: [lampPos[0] + 0.12, lampPos[1] + 0.05, lampPos[2]],
      colour: 0xfdf2d8,
      glow: true,
    })
  }
}

export function dressQueenUnmaArchitecture(context: ArchitectureContext): void {
  wallPanelling(context)
  nurseryPartition(context)
  parquetFlooring(context)
  ceilingCornice(context)
  wallSconces(context)
  grandChandelier(context)
  nurseryLantern(context)
  alcoveBedsideLighting(context)
}
