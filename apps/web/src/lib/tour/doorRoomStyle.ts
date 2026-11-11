import { buildHalkenburgDoorLeaves, dressHalkenburgDoorCasing } from './halkenburgDoorStyle'
import { buildSalesaleDoorLeaves, dressSalesaleDoorCasing } from './salesaleDoorStyle'
import { buildLuzurusDoorLeaves, dressLuzurusDoorCasing } from './luzurusDoorStyle'
import { buildTysonDoorLeaves, dressTysonDoorCasing } from './tysonDoorStyle'
import { buildBenjaminDoorLeaves, dressBenjaminDoorCasing } from './benjaminRoomDoors'
import { buildTierDoorLeaves, dressTierDoorCasing, type LeafBuildOptions } from './doorTierBuilders'
import { buildTserriednichDoorLeaves, dressTserriednichDoorCasing } from './tserriednichDoorStyle'
import type { DoorDressContext } from './doorDetailSurface'
import { buildCamillaDoorLeaves, dressCamillaDoorCasing } from './camillaDoorStyle'
import { buildZhangLeiDoorLeaves, dressZhangLeiDoorCasing } from './zhangLeiDoorStyle'

/** Room-specific source panels override the deck's generic door palette. */
export function roomDoorStyle(options: {
  tierId: string
  spaceId: string
  tier: LeafBuildOptions['tier']
}) {
  if (options.tierId === 'interior-room-1001') {
    return { casing: dressBenjaminDoorCasing, leaves: buildBenjaminDoorLeaves }
  }
  if (options.tierId === 'interior-room-1002') {
    return { casing: dressCamillaDoorCasing, leaves: buildCamillaDoorLeaves }
  }
  if (options.tierId === 'interior-room-1003') {
    return { casing: dressZhangLeiDoorCasing, leaves: buildZhangLeiDoorLeaves }
  }
  if (options.tierId === 'interior-room-1009') {
    return { casing: dressHalkenburgDoorCasing, leaves: buildHalkenburgDoorLeaves }
  }
  if (options.tierId === 'interior-room-1008') {
    return { casing: dressSalesaleDoorCasing, leaves: buildSalesaleDoorLeaves }
  }
  if (options.tierId === 'interior-room-1007') {
    return { casing: dressLuzurusDoorCasing, leaves: buildLuzurusDoorLeaves }
  }
  if (options.tierId === 'interior-room-1006') {
    return { casing: dressTysonDoorCasing, leaves: buildTysonDoorLeaves }
  }
  if (
    [
      'interior-room-1004',
      'interior-room-1005',
      'interior-room-1010',
      'interior-room-1011',
      'interior-room-1012',
    ].includes(options.tierId)
  ) {
    return { casing: dressTserriednichDoorCasing, leaves: buildTserriednichDoorLeaves }
  }
  return {
    casing: (context: DoorDressContext) => dressTierDoorCasing(context, options.tier),
    leaves: (input: Omit<LeafBuildOptions, 'tier'>) =>
      buildTierDoorLeaves({ ...input, tier: options.tier }),
  }
}
