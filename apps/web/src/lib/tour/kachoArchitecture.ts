import { dressPrincelyWallPanels, type PrincelyWallContext } from './princelyWallPanels'
import { dressPrincelyRoomGrid } from './princelyRoomGrid'
import { dressApartmentArchitecture } from './apartmentArchitecture'
import { clipSegment } from './geometry'
import { floorOf } from './blueprint'

function diningBoards({ into, plan, space }: PrincelyWallContext): void {
  const xs = space.footprint.map(([x]) => x),
    zs = space.footprint.map(([, z]) => z)
  const x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    z0 = Math.min(...zs),
    z1 = Math.max(...zs)
  const y = floorOf(space, plan.tier) + 0.012
  for (let x = x0 + 0.25; x < x1; x += 0.25) {
    for (const [a, b] of clipSegment(space.footprint, [x, z0], [x, z1]))
      into.box([0.008, 0.008, b[1] - a[1]], { at: [x, y, (a[1] + b[1]) / 2], colour: 0x938b78 })
  }
}

/** Ch. 376 p. 10 and ch. 366 p. 4: floral panels, fluted dado and rectangular ceiling/floor grids. */
export function dressKachoArchitecture(context: PrincelyWallContext): void {
  if (context.space.id.endsWith('-kitchen')) {
    dressApartmentArchitecture(context)
    return
  }
  dressPrincelyWallPanels(context)
  dressPrincelyRoomGrid(context, true)
  dressPrincelyRoomGrid(context, false)
  if (context.space.id.endsWith('-dining')) diningBoards(context)
}
