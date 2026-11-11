import { buildApartmentDoorLeaves, dressApartmentDoorCasing } from './apartmentDoors'
import type { DoorDressContext } from './doorDetailSurface'
import type { LeafBuildOptions } from './doorTierBuilders'
import { CAMILLA_STONE, CAMILLA_GOLD } from './camillaDetailSurface'

const PALETTE = {
  frame: 0xa69d86,
  trim: CAMILLA_STONE,
  sill: 0x8c846f,
  leaf: 0xb3a88f,
  handle: CAMILLA_GOLD,
  inset: 0x807966,
  recess: 0xd0c7b1,
}

/** Framed double doors behind Sarahell in ch. 389 p. 16, rather than solid gold panels. */
export function dressCamillaDoorCasing(context: DoorDressContext): void {
  dressApartmentDoorCasing(context, PALETTE)
}
export function buildCamillaDoorLeaves(options: Omit<LeafBuildOptions, 'tier'>) {
  return buildApartmentDoorLeaves({ ...options, palette: PALETTE, name: 'camilla-door-panels' })
}
