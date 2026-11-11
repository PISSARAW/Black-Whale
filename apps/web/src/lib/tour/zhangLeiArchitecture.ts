import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { dressPrincelyWallPanels as wallPanelling } from './princelyWallPanels'
import { floorOf, type TierPlan } from './blueprint'
import type { Space } from './types'

export interface ArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

/** Broad light boards crossed by narrow dark bands, rather than alternating dark square tiles. */
function parquetFlooring({ into, space, plan }: ArchitectureContext): void {
  const floor = floorOf(space, plan.tier),
    xs = space.footprint.map(([x]) => x),
    zs = space.footprint.map(([, z]) => z)
  const x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    z0 = Math.min(...zs),
    z1 = Math.max(...zs)
  for (let z = z0; z < z1; z += 0.3) {
    const d = Math.min(0.3, z1 - z)
    into.box([x1 - x0, 0.008, d - 0.008], {
      at: [(x0 + x1) / 2, floor + 0.005, z + d / 2],
      colour: 0xb9a88a,
    })
  }
  for (let x = x0 + 0.4; x < x1; x += 1.4)
    into.box([0.065, 0.01, z1 - z0], { at: [x, floor + 0.012, (z0 + z1) / 2], colour: 0x4e493d })
  for (let z = z0 + 0.4; z < z1; z += 1.25)
    into.box([x1 - x0, 0.01, 0.065], { at: [(x0 + x1) / 2, floor + 0.012, z], colour: 0x4e493d })
}

export function dressZhangLeiArchitecture(context: ArchitectureContext): void {
  wallPanelling(context)
  parquetFlooring(context)
}
