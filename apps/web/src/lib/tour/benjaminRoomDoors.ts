import { buildApartmentDoorLeaves, dressApartmentDoorCasing } from './apartmentDoors'
import type { DoorDressContext } from './doorDetailSurface'
import type { LeafBuildOptions } from './doorTierBuilders'

const PALETTE = {
  frame: 0x746b5a,
  trim: 0xaea38c,
  sill: 0x7d7768,
  leaf: 0x998e79,
  handle: 0x554e40,
  inset: 0x5c574c,
  recess: 0xb7ad96,
}

export function dressBenjaminDoorCasing(context: DoorDressContext): void {
  dressApartmentDoorCasing(context, PALETTE)
}
export function buildBenjaminDoorLeaves(options: Omit<LeafBuildOptions, 'tier'>) {
  return buildApartmentDoorLeaves({ ...options, palette: PALETTE, name: 'benjamin-door-panels' })
}
