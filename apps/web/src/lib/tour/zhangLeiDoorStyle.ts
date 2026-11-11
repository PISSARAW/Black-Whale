import { buildApartmentDoorLeaves, dressApartmentDoorCasing } from './apartmentDoors'
import type { DoorDressContext } from './doorDetailSurface'
import type { LeafBuildOptions } from './doorTierBuilders'

const palette = {
  frame: 0x9f967f,
  trim: 0xc9c2ad,
  sill: 0x837966,
  leaf: 0xc8bfaa,
  handle: 0xa39163,
  inset: 0x776e5c,
  recess: 0xdad1b9,
}
export function dressZhangLeiDoorCasing(context: DoorDressContext): void {
  dressApartmentDoorCasing(context, palette)
}
export function buildZhangLeiDoorLeaves(options: Omit<LeafBuildOptions, 'tier'>) {
  return buildApartmentDoorLeaves({ ...options, palette, name: 'zhang-lei-door-panels' })
}
