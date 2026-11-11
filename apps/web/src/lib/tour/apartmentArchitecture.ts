import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { floorOf, ceilingOf, type TierPlan } from './blueprint'
import { clipSegment, plateSeams } from './geometry'
import { appearanceOf } from './roomAppearance'
import type { Space } from './types'

interface Context {
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

const wetRoom = (space: Space): boolean => /-(bathroom|servants-wc)$/.test(space.id)
const publicRoom = (space: Space): boolean => /-(entrance|dining|living|bedroom)$/.test(space.id)

function wallFinish(context: Context): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)
  const height = ceilingOf(space, plan.tier)
  const appearance = appearanceOf(space, plan.tier)
  const wet = wetRoom(space)
  for (const run of banquetWallRuns(plan, space)) {
    for (const [y, trimHeight, depth, colour] of [
      [0.08, 0.16, 0.08, wet ? appearance.metal : appearance.wood],
      [0.92, 0.065, 0.065, wet ? appearance.metal : appearance.wood],
      [height - 0.26, 0.07, 0.09, appearance.accent],
      [height - 0.1, 0.12, 0.12, wet ? appearance.metal : appearance.wood],
    ]) {
      into.box([run.length, trimHeight, depth], {
        at: wallPoint(run, { along: run.length / 2, y: floor + y, inset: 0.03 }),
        rotation: [0, run.angle, 0],
        colour,
      })
    }
    if (!publicRoom(space)) continue
    const count = Math.max(1, Math.floor(run.length / 1.55))
    const pitch = run.length / count
    for (let index = 0; index < count; index++) {
      const centre = (index + 0.5) * pitch
      const width = Math.max(0.45, pitch - 0.24)
      for (const y of [1.13, height - 0.42]) {
        into.box([width, 0.045, 0.045], {
          at: wallPoint(run, { along: centre, y: floor + y, inset: 0.055 }),
          rotation: [0, run.angle, 0],
          colour: appearance.accent,
        })
      }
      for (const side of [-1, 1]) {
        into.box([0.045, height - 1.55, 0.045], {
          at: wallPoint(run, {
            along: centre + (side * width) / 2,
            y: floor + (height + 0.71) / 2,
            inset: 0.055,
          }),
          rotation: [0, run.angle, 0],
          colour: appearance.accent,
        })
      }
    }
  }
}

function line(
  context: Context,
  ends: readonly [[number, number], [number, number]],
  y: number,
): void {
  const appearance = appearanceOf(context.space, context.plan.tier)
  for (const [a, b] of clipSegment(context.space.footprint, ...ends)) {
    const dx = b[0] - a[0]
    const dz = b[1] - a[1]
    context.into.box([Math.hypot(dx, dz), 0.055, 0.055], {
      at: [(a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2],
      rotation: [0, -Math.atan2(dz, dx), 0],
      colour: appearance.accent,
    })
  }
}

/** Chs. 371 and 376 show the shared royal rooms under a restrained coffer grid. */
function ceilingFinish(context: Context): void {
  if (!publicRoom(context.space)) return
  const { space, plan } = context
  const xs = space.footprint.map(([x]) => x)
  const zs = space.footprint.map(([, z]) => z)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)
  const y = floorOf(space, plan.tier) + ceilingOf(space, plan.tier) - 0.07
  for (let x = minX + 0.8; x < maxX; x += 1.8)
    line(
      context,
      [
        [x, minZ],
        [x, maxZ],
      ],
      y,
    )
  for (let z = minZ + 0.8; z < maxZ; z += 1.6)
    line(
      context,
      [
        [minX, z],
        [maxX, z],
      ],
      y,
    )
}

function floorFinish(context: Context): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)
  const appearance = appearanceOf(space, plan.tier)
  if (wetRoom(space)) {
    for (const [a, b] of plateSeams(space.footprint, 0.6)) {
      const dx = b[0] - a[0],
        dz = b[1] - a[1]
      into.box([Math.hypot(dx, dz), 0.008, 0.012], {
        at: [(a[0] + b[0]) / 2, floor + 0.01, (a[1] + b[1]) / 2],
        rotation: [0, -Math.atan2(dz, dx), 0],
        colour: appearance.metal,
      })
    }
    return
  }
  const xs = space.footprint.map(([x]) => x),
    zs = space.footprint.map(([, z]) => z)
  const minZ = Math.min(...zs),
    maxZ = Math.max(...zs)
  for (let x = Math.min(...xs) + 0.28; x < Math.max(...xs); x += 0.28) {
    for (const [a, b] of clipSegment(space.footprint, [x, minZ], [x, maxZ])) {
      into.box([0.01, 0.008, b[1] - a[1]], {
        at: [x, floor + 0.01, (a[1] + b[1]) / 2],
        colour: appearance.wood,
      })
    }
  }
}

/** Shared programme-type shell, enriched only by finishes repeatedly visible in the manga. */
export function dressApartmentArchitecture(context: Context): void {
  wallFinish(context)
  ceilingFinish(context)
  floorFinish(context)
}
