import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { floorOf, ceilingOf, type TierPlan } from './blueprint'
import { clipSegment } from './geometry'
import { dressPrincelyWallPanels } from './princelyWallPanels'
import type { Space } from './types'

export interface TserriednichArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

/** Ch. 366 p. 10, ch. 385 pp. 1, 5–7: a rectangular floor grid, not a diagonal gold lattice. */
function roomGrid(context: TserriednichArchitectureContext, ceiling: boolean): void {
  const { into, space, plan } = context
  const xs = space.footprint.map(([x]) => x),
    zs = space.footprint.map(([, z]) => z)
  const x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    z0 = Math.min(...zs),
    z1 = Math.max(...zs)
  const floor = floorOf(space, plan.tier),
    y = ceiling ? floor + ceilingOf(space, plan.tier) - 0.035 : floor + 0.012
  const line = (a: readonly [number, number], b: readonly [number, number], width: number) => {
    for (const [start, end] of clipSegment(space.footprint, a, b)) {
      const dx = end[0] - start[0],
        dz = end[1] - start[1]
      into.box([Math.hypot(dx, dz), 0.018, width], {
        at: [(start[0] + end[0]) / 2, y, (start[1] + end[1]) / 2],
        rotation: [0, -Math.atan2(dz, dx), 0],
        colour: ceiling ? 0xbcb6a3 : 0x48463c,
      })
    }
  }
  for (let x = x0 + 0.5; x < x1; x += 1.4) line([x, z0], [x, z1], ceiling ? 0.045 : 0.08)
  for (let z = z0 + 0.4; z < z1; z += 1.2) line([x0, z], [x1, z], ceiling ? 0.045 : 0.08)
}

export function dressTserriednichRoomArchitecture(context: TserriednichArchitectureContext): void {
  dressPrincelyWallPanels(context)
  roomGrid(context, false)
  roomGrid(context, true)
}
