import type { PrincelyWallContext } from './princelyWallPanels'
import { floorOf } from './blueprint'
import { clipSegment } from './geometry'

/** Chs. 382 p. 11 and 386 p. 13: fine parallel joints flank the broader dark grid. */
export function dressHalkenburgFloor({ into, plan, space }: PrincelyWallContext): void {
  const xs = space.footprint.map(([x]) => x),
    zs = space.footprint.map(([, z]) => z)
  const x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    z0 = Math.min(...zs),
    z1 = Math.max(...zs)
  const y = floorOf(space, plan.tier) + 0.012
  for (const vertical of [false, true]) {
    const start = vertical ? x0 + 0.5 : z0 + 0.4,
      end = vertical ? x1 : z1,
      pitch = vertical ? 1.4 : 1.2
    for (let p = start; p < end; p += pitch) {
      for (const offset of [-0.1, 0.1]) {
        const a = vertical ? ([p + offset, z0] as const) : ([x0, p + offset] as const)
        const b = vertical ? ([p + offset, z1] as const) : ([x1, p + offset] as const)
        for (const [from, to] of clipSegment(space.footprint, a, b)) {
          const dx = to[0] - from[0],
            dz = to[1] - from[1]
          into.box([Math.hypot(dx, dz), 0.008, 0.012], {
            at: [(from[0] + to[0]) / 2, y, (from[1] + to[1]) / 2],
            rotation: [0, -Math.atan2(dz, dx), 0],
            colour: 0x6e6e60,
          })
        }
      }
    }
  }
}
