import { dressPrincelyWallPanels, type PrincelyWallContext } from './princelyWallPanels'
import { dressPrincelyRoomGrid } from './princelyRoomGrid'

/** Ch. 366 p. 3 and ch. 374 p. 11: floral wall fields, striped dado and dark rectangular floor bands. */
export function dressFugetsuArchitecture(context: PrincelyWallContext): void {
  dressPrincelyWallPanels(context)
  dressPrincelyRoomGrid(context, false)
  dressPrincelyRoomGrid(context, true)
}
