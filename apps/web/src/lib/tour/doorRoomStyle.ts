import { buildBenjaminDoorLeaves, dressBenjaminDoorCasing } from './benjaminRoomDoors'
import { buildTierDoorLeaves, dressTierDoorCasing, type LeafBuildOptions } from './doorTierBuilders'
import { buildTserriednichDoorLeaves, dressTserriednichDoorCasing } from './tserriednichDoorStyle'
import type { DoorDressContext } from './doorDetailSurface'

/** Room-specific source panels override the deck's generic door palette. */
export function roomDoorStyle(options: {
  tierId: string
  spaceId: string
  tier: LeafBuildOptions['tier']
}) {
  if (options.tierId === 'interior-room-1001') {
    return { casing: dressBenjaminDoorCasing, leaves: buildBenjaminDoorLeaves }
  }
  if (options.spaceId.startsWith('tier-1-royal-residential-sector-room-1004')) {
    return { casing: dressTserriednichDoorCasing, leaves: buildTserriednichDoorLeaves }
  }
  return {
    casing: (context: DoorDressContext) => dressTierDoorCasing(context, options.tier),
    leaves: (input: Omit<LeafBuildOptions, 'tier'>) =>
      buildTierDoorLeaves({ ...input, tier: options.tier }),
  }
}
