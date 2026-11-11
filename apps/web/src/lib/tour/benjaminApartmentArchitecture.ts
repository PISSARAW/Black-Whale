import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { floorOf, ceilingOf, type TierPlan } from './blueprint'
import { clipSegment, plateSeams } from './geometry'
import type { Space } from './types'

interface Context {
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

/** Plain finishes for the programme-type rooms, without extending the salon's painted panels. */
export function dressBenjaminApartmentArchitecture(context: Context): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier),
    top = floor + ceilingOf(space, plan.tier)
  const wet = /-(kitchen|bathroom|servants-wc)$/.test(space.id)
  for (const run of banquetWallRuns(plan, space)) {
    for (const [y, height] of [
      [0.06, 0.12],
      [top - floor - 0.1, 0.07],
    ]) {
      into.box([run.length, height, 0.05], {
        at: wallPoint(run, { along: run.length / 2, y: floor + y, inset: 0.03 }),
        rotation: [0, run.angle, 0],
        colour: wet ? 0x91988a : 0x6a5d49,
      })
    }
  }
  if (wet) {
    for (const [a, b] of plateSeams(space.footprint, 0.6)) {
      const dx = b[0] - a[0],
        dz = b[1] - a[1]
      into.box([Math.hypot(dx, dz), 0.008, 0.012], {
        at: [(a[0] + b[0]) / 2, floor + 0.01, (a[1] + b[1]) / 2],
        rotation: [0, -Math.atan2(dz, dx), 0],
        colour: 0x6c7569,
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
        colour: 0x746b59,
      })
    }
  }
}
