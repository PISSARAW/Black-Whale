import { buildApartmentDoorLeaves, dressApartmentDoorCasing } from './apartmentDoors'
import type { DoorDressContext } from './doorDetailSurface'
import type { LeafBuildOptions } from './doorTierBuilders'

const palette = {
  frame: 0xa89e86,
  trim: 0xd1c8b3,
  sill: 0x8a806b,
  leaf: 0xcac1ac,
  handle: 0x9f906a,
  inset: 0x8e8571,
  recess: 0xddd4bd,
}

/** Chs. 366 p. 8 and 375 p. 1: pale framed leaves with two rectangular panels. */
export function dressTysonDoorCasing(context: DoorDressContext): void {
  dressApartmentDoorCasing(context, palette)
}
export function buildTysonDoorLeaves(options: Omit<LeafBuildOptions, 'tier'>) {
  return buildApartmentDoorLeaves({ ...options, palette, name: 'tyson-panelled-door' })
}
