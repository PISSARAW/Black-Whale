import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import type { Space } from './types'
import { CAMILLA_SALON_LAMP } from './camillaLighting'
import {
  CAMILLA_GOLD as GOLD,
  CAMILLA_STONE as STONE,
  CAMILLA_WOOD as WOOD,
} from './camillaDetailSurface'

interface ArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

/** Plain framed wall panels and a stepped cornice, ch. 389, reading pp. 16–17. */
function mouldings(context: ArchitectureContext): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier),
    height = ceilingOf(space, plan.tier)
  for (const run of banquetWallRuns(plan, space)) {
    const box = (
      size: readonly [number, number, number],
      p: { along: number; y: number; inset?: number },
      colour: number,
    ) => {
      into.box(size, {
        at: wallPoint(run, { ...p, y: floor + p.y }),
        rotation: [0, run.angle, 0],
        colour,
      })
    }
    for (const [y, h, depth] of [
      [0.1, 0.16, 0.1],
      [0.87, 0.07, 0.08],
      [height - 0.3, 0.09, 0.13],
      [height - 0.13, 0.11, 0.18],
    ]) {
      box([run.length, h, depth], { along: run.length / 2, y, inset: depth / 2 }, STONE)
    }
    const count = Math.max(1, Math.floor(run.length / 1.65)),
      pitch = run.length / count
    for (let i = 0; i < count; i++) {
      const along = (i + 0.5) * pitch,
        width = Math.min(1.3, pitch - 0.2)
      for (const y of [0.27, 0.71]) box([width, 0.03, 0.03], { along, y }, GOLD)
      for (const side of [-1, 1]) {
        box([0.03, 0.44, 0.03], { along: along + (side * width) / 2, y: 0.49 }, GOLD)
        box([0.045, 2.32, 0.04], { along: along + (side * width) / 2, y: 2.18 }, STONE)
      }
      for (const y of [1.02, 3.34]) box([width, 0.045, 0.04], { along, y }, STONE)
    }
  }
}

function salonCeiling(context: ArchitectureContext): void {
  const { into, plan, space } = context
  const top = floorOf(space, plan.tier) + ceilingOf(space, plan.tier)
  const [x, z] = CAMILLA_SALON_LAMP
  for (const inset of [0, 0.18, 0.35]) {
    const w = 8 - inset * 2,
      d = 4 - inset * 2
    for (const side of [-1, 1]) {
      into.box([w, 0.06, 0.06], {
        at: [x, top - 0.13 + inset * 0.18, z + (side * d) / 2],
        colour: STONE,
      })
      into.box([0.06, 0.06, d], {
        at: [x + (side * w) / 2, top - 0.13 + inset * 0.18, z],
        colour: STONE,
      })
    }
  }
  // The chandelier belongs to the assembly room; no low dining chandelier is inferred.
  const y = top - 0.85
  into.cylinder({ radius: 0.02, height: 0.65 }, { at: [x, top - 0.35, z], colour: GOLD })
  into.sphere([0.14, 0.18, 0.14], { at: [x, y, z], colour: GOLD })
  for (let arm = 0; arm < 6; arm++) {
    const a = (arm * Math.PI) / 3,
      dx = Math.cos(a),
      dz = Math.sin(a)
    into.curve(
      [
        [x, y, z],
        [x + dx * 0.32, y - 0.17, z + dz * 0.32],
        [x + dx * 0.56, y - 0.07, z + dz * 0.56],
        [x + dx * 0.56, y + 0.13, z + dz * 0.56],
      ],
      0.022,
      { at: [0, 0, 0], colour: GOLD },
    )
    into.sphere([0.04, 0.09, 0.04], {
      at: [x + dx * 0.56, y + 0.23, z + dz * 0.56],
      colour: 0xf0e5ca,
      glow: true,
    })
  }
}

function corridorFloor(context: ArchitectureContext): void {
  const floor = floorOf(context.space, context.plan.tier)
  for (let z = -9.75; z < -3; z += 0.85) {
    context.into.box([2.74, 0.009, 0.04], { at: [0, floor + 0.008, z], colour: WOOD })
  }
}

export function dressCamillaArchitecture(context: ArchitectureContext): void {
  mouldings(context)
  if (context.space.id.endsWith('-living')) salonCeiling(context)
  if (context.space.id.endsWith('-entrance')) corridorFloor(context)
}
