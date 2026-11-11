import type * as Three from 'three'
import type { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentFurniture } from './apartmentFurniture'
import { dressFugetsuBed } from './fugetsuBed'
import { dressFugetsuClock, dressFugetsuKeepsakes, dressFugetsuWardrobe } from './fugetsuObjects'

export function dressFugetsuFurniture(THREE: typeof Three, surface: ApartmentSurface): void {
  const { id, kind } = surface.structure
  if (kind === 'bed') dressFugetsuBed(THREE, surface)
  else if (id.endsWith('-clock-and-photos')) dressFugetsuClock(surface)
  else if (id.endsWith('-book-stack')) dressFugetsuKeepsakes(surface)
  else if (id.endsWith('-cabinet-03')) dressFugetsuWardrobe(surface)
  else dressApartmentFurniture(surface)
}
