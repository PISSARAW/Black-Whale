import type { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentFurniture } from './apartmentFurniture'
import { dressLuzurusSeat } from './luzurusSeating'
import { dressLuzurusTableObjects } from './luzurusTableObjects'
import { dressLuzurusShelf, dressLuzurusPlant, dressLuzurusPicture } from './luzurusDecor'

export function dressLuzurusFurniture(surface: ApartmentSurface): void {
  const { id, kind } = surface.structure
  if (kind === 'painting') dressLuzurusPicture(surface)
  else if (kind === 'seat') dressLuzurusSeat(surface)
  else if (id.includes('-shelving')) dressLuzurusShelf(surface)
  else if (id.includes('-topiary-')) dressLuzurusPlant(surface)
  else {
    dressApartmentFurniture(surface)
    if (kind === 'table') dressLuzurusTableObjects(surface)
  }
}
