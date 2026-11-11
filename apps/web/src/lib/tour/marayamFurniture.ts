import type * as Three from 'three'
import type { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentFurniture } from './apartmentFurniture'
import { dressMomozeChair } from './momozeLiving'
import {
  dressMarayamMealTable,
  dressMarayamDiningChair,
  dressMarayamSideboard,
  dressMarayamGlazing,
} from './marayamDining'
import {
  dressMarayamPlayArea,
  dressMarayamToyBox,
  dressMarayamShelf,
  dressMarayamGrille,
  dressMarayamPainting,
  dressMarayamSideTable,
} from './marayamLiving'
import {
  dressMarayamBunk,
  dressMarayamCrib,
  dressMarayamAdultBed,
  dressMarayamStaffCabinet,
  dressMarayamCalendar,
} from './marayamBeds'

function bedroom(s: ApartmentSurface): void {
  if (s.structure.id.endsWith('-child-crib')) dressMarayamCrib(s)
  else if (s.structure.kind === 'bed') dressMarayamAdultBed(s)
  else dressApartmentFurniture(s)
}

function dining(s: ApartmentSurface): void {
  const { kind } = s.structure
  if (kind === 'table') dressMarayamMealTable(s)
  else if (kind === 'seat') dressMarayamDiningChair(s)
  else if (kind === 'window') dressMarayamGlazing(s)
  else if (kind === 'painting') dressMarayamPainting(s)
  else dressMarayamSideboard(s)
}

function living(THREE: typeof Three, s: ApartmentSurface): void {
  const { id, kind } = s.structure
  if (id.endsWith('-child-table')) dressMarayamPlayArea(THREE, s)
  else if (id.endsWith('-toy-chest')) dressMarayamToyBox(s)
  else if (kind === 'vent') dressMarayamGrille(s)
  else if (kind === 'seat') dressMomozeChair(s)
  else if (kind === 'cabinet') dressMarayamShelf(s)
  else if (kind === 'table') dressMarayamSideTable(s)
  else dressApartmentFurniture(s)
}

export function dressMarayamFurniture(THREE: typeof Three, s: ApartmentSurface): void {
  const room = s.structure.spaceId
  if (room.endsWith('-bedroom')) bedroom(s)
  else if (room.endsWith('-dining')) dining(s)
  else if (room.endsWith('-servants')) {
    if (s.structure.kind === 'bed') dressMarayamBunk(s)
    else if (s.structure.kind === 'painting') dressMarayamCalendar(s)
    else dressMarayamStaffCabinet(s)
  } else living(THREE, s)
}
