import { dressPrincelyWallPanels, type PrincelyWallContext } from './princelyWallPanels'
import { dressPrincelyRoomGrid } from './princelyRoomGrid'
import { clipSegment } from './geometry'
import { floorOf } from './blueprint'
import { dressSalesaleCartouches } from './salesaleCartouches'

/** Ch. 381 p. 15 shows timber floor strips beneath the loose textiles. */
export function dressSalesaleArchitecture(context: PrincelyWallContext): void {
  dressPrincelyWallPanels(context)
  dressSalesaleCartouches(context)
  dressPrincelyRoomGrid(context, true)
  const { space, plan, into } = context,
    floor = floorOf(space, plan.tier)
  const xs = space.footprint.map(([x]) => x),
    zs = space.footprint.map(([, z]) => z)
  const x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    z0 = Math.min(...zs),
    z1 = Math.max(...zs)
  for (let x = x0 + 0.24; x < x1; x += 0.24)
    for (const [a, b] of clipSegment(space.footprint, [x, z0], [x, z1]))
      into.box([0.008, 0.008, b[1] - a[1]], {
        at: [x, floor + 0.01, (a[1] + b[1]) / 2],
        colour: 0x8d8068,
      })
}
