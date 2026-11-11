import type { PrincelyWallContext } from './princelyWallPanels'
import { dressPrincelyWallPanels } from './princelyWallPanels'
import { clipSegment } from './geometry'
import { floorOf, ceilingOf } from './blueprint'

/** Ch. 366 p. 9: narrow parallel floorboards; ch. 388 p. 16: floral panels and coffers. */
export function dressTubeppaArchitecture(context: PrincelyWallContext): void {
  dressPrincelyWallPanels(context)
  const { into, plan, space } = context
  const xs = space.footprint.map(([x]) => x),
    zs = space.footprint.map(([, z]) => z)
  const x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    z0 = Math.min(...zs),
    z1 = Math.max(...zs)
  const floor = floorOf(space, plan.tier),
    ceiling = floor + ceilingOf(space, plan.tier)
  for (let x = x0 + 0.28; x < x1; x += 0.28) {
    for (const [a, b] of clipSegment(space.footprint, [x, z0], [x, z1]))
      into.box([0.009, 0.008, b[1] - a[1]], {
        at: [x, floor + 0.009, (a[1] + b[1]) / 2],
        colour: 0x796f5d,
      })
  }
  for (let x = x0 + 0.8; x < x1; x += 1.8) {
    for (const [a, b] of clipSegment(space.footprint, [x, z0], [x, z1]))
      into.box([0.055, 0.045, b[1] - a[1]], {
        at: [x, ceiling - 0.04, (a[1] + b[1]) / 2],
        colour: 0xb8b1a0,
      })
  }
  for (let z = z0 + 0.8; z < z1; z += 1.6) {
    for (const [a, b] of clipSegment(space.footprint, [x0, z], [x1, z]))
      into.box([b[0] - a[0], 0.045, 0.055], {
        at: [(a[0] + b[0]) / 2, ceiling - 0.04, z],
        colour: 0xb8b1a0,
      })
  }
}
