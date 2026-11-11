import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint, type BanquetWallRun } from './banquetWallLayout'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import { clipSegment } from './geometry'
import type { Space, Vec2 } from './types'
import { BENJAMIN_DARK_WOOD, BENJAMIN_BRONZE } from './benjaminRoomDetailSurface'

interface ArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

/** Ch. 363 p. 13 and 366 p. 16: low timber wainscot, tall light framed wall panels. */
function wallPanelling(context: ArchitectureContext, run: BanquetWallRun): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)
  const box = (
    size: readonly [number, number, number],
    placement: { along: number; y: number; inset: number; colour: number },
  ) => {
    into.box(size, {
      at: wallPoint(run, { ...placement, y: floor + placement.y }),
      rotation: [0, run.angle, 0],
      colour: placement.colour,
    })
  }
  box([run.length, 0.85, 0.055], {
    along: run.length / 2,
    y: 0.425,
    inset: 0.033,
    colour: 0x9c8c75,
  })
  for (let along = 0.2; along < run.length; along += 0.22) {
    box([0.012, 0.73, 0.025], { along, y: 0.43, inset: 0.065, colour: 0x665c4c })
  }
  for (const [y, h, depth] of [
    [0.08, 0.16, 0.08],
    [0.89, 0.08, 0.09],
    [3.72, 0.08, 0.12],
    [3.84, 0.08, 0.15],
  ]) {
    box([run.length, h, depth], {
      along: run.length / 2,
      y,
      inset: depth / 2 + 0.01,
      colour: BENJAMIN_DARK_WOOD,
    })
  }
  const count = Math.max(1, Math.floor(run.length / 1.2)),
    pitch = run.length / count
  for (let index = 0; index < count; index++) {
    const along = (index + 0.5) * pitch
    box([pitch - 0.08, 2.65, 0.035], { along, y: 2.28, inset: 0.035, colour: 0xbbb7a8 })
    box([pitch - 0.2, 2.5, 0.035], { along, y: 2.28, inset: 0.06, colour: 0x797a70 })
    box([pitch - 0.3, 2.4, 0.025], { along, y: 2.28, inset: 0.08, colour: 0xa6a396 })
    // Irregular small tonal marks evoke the printed mottling without inventing a crest.
    for (let mark = 0; mark < 24; mark++) {
      const phase = Math.sin(index * 43 + mark * 17) * 437.1
      const fraction = phase - Math.floor(phase)
      box([0.025 + fraction * 0.035, 0.04, 0.008], {
        along: along + (fraction - 0.5) * (pitch - 0.38),
        y: 1.14 + (mark / 24) * 2.25,
        inset: 0.097,
        colour: 0x817e70,
      })
    }
  }
}

function roomLine(
  context: ArchitectureContext,
  ends: readonly [Vec2, Vec2],
  style: { y: number; width: number; height: number; colour: number },
): void {
  for (const [a, b] of clipSegment(context.space.footprint, ...ends)) {
    const dx = b[0] - a[0],
      dz = b[1] - a[1]
    context.into.box([Math.hypot(dx, dz), style.height, style.width], {
      at: [(a[0] + b[0]) / 2, style.y, (a[1] + b[1]) / 2],
      rotation: [0, -Math.atan2(dz, dx), 0],
      colour: style.colour,
    })
  }
}

/** Every strip is clipped to the L-shaped walked room; nothing crosses into neighbouring rooms. */
function floorAndCeiling(context: ArchitectureContext): void {
  const floor = floorOf(context.space, context.plan.tier)
  const ceiling = floor + ceilingOf(context.space, context.plan.tier)
  for (let x = -10.4; x < 10.5; x += 0.24) {
    roomLine(
      context,
      [
        [x, -2.7],
        [x, 5.7],
      ],
      { y: floor + 0.008, width: 0.012, height: 0.01, colour: 0x746b59 },
    )
  }
  for (let x = -10.4; x < 10.5; x += 1.6) {
    roomLine(
      context,
      [
        [x, -2.7],
        [x, 5.7],
      ],
      { y: floor + 0.016, width: 0.07, height: 0.012, colour: 0x393a35 },
    )
    roomLine(
      context,
      [
        [x, -2.7],
        [x, 5.7],
      ],
      { y: ceiling - 0.055, width: 0.07, height: 0.08, colour: 0x8d887b },
    )
  }
  for (let z = -2.7; z <= 5.7; z += 1.4) {
    roomLine(
      context,
      [
        [-10.5, z],
        [10.5, z],
      ],
      { y: floor + 0.017, width: 0.07, height: 0.012, colour: 0x393a35 },
    )
    roomLine(
      context,
      [
        [-10.5, z],
        [10.5, z],
      ],
      { y: ceiling - 0.055, width: 0.07, height: 0.08, colour: BENJAMIN_BRONZE },
    )
  }
}

export function dressBenjaminRoomArchitecture(context: ArchitectureContext): void {
  for (const run of banquetWallRuns(context.plan, context.space)) wallPanelling(context, run)
  floorAndCeiling(context)
}
