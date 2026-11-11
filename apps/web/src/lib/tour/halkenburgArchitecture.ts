import { dressPrincelyWallPanels, type PrincelyWallContext } from './princelyWallPanels'
import { dressPrincelyRoomGrid } from './princelyRoomGrid'
import { dressHalkenburgCartouches } from './halkenburgCartouches'
import { dressHalkenburgFloor } from './halkenburgFloor'
import { dressApartmentArchitecture } from './apartmentArchitecture'

/** Ch. 382 p. 11: floral panels, fluted dado, upper frames and a broad rectangular floor grid. */
export function dressHalkenburgArchitecture(context: PrincelyWallContext): void {
  if (context.space.id.endsWith('-bedroom')) {
    dressApartmentArchitecture(context)
    return
  }
  dressPrincelyWallPanels(context)
  dressHalkenburgCartouches(context)
  dressPrincelyRoomGrid(context, true)
  dressPrincelyRoomGrid(context, false)
  dressHalkenburgFloor(context)
}
