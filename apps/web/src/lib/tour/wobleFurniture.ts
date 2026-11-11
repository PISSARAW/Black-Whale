import type * as Three from 'three'
import type { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentFurniture } from './apartmentFurniture'
import { dressApartmentUtilities } from './apartmentUtilities'
import { dressMomozeChair } from './momozeLiving'
import { dressWobleBed } from './wobleBed'
import { dressWobleCounter, dressWobleUpperCabinets } from './wobleKitchen'
import { dressWobleMealTable } from './wobleMeals'
import {
  dressWobleDisplay,
  dressWoblePedestal,
  dressWobleCaneChair,
  dressWobleCabinet,
  dressWobleTelephone,
  dressWoblePainting,
} from './wobleReception'

function living(s: ApartmentSurface): void {
  const { kind, id } = s.structure
  if (kind === 'telephone') dressWobleTelephone(s)
  else if (kind === 'painting') dressWoblePainting(s)
  else if (kind === 'seat') dressWobleCaneChair(s)
  else if (kind === 'table') dressWobleDisplay(s)
  else if (id.endsWith('-cabinet-19')) dressWoblePedestal(s)
  else dressWobleCabinet(s)
}

function bathroom(THREE: typeof Three, s: ApartmentSurface): void {
  dressApartmentUtilities(s)
  if (!s.structure.id.endsWith('-wc-pan')) return
  s.sphere([0.25, 0.3, 0.025], [0, 0.92, -s.depth * 0.28], 0xd9d1c1)
  s.sphere([0.2, 0.24, 0.025], [0, 0.92, -s.depth * 0.28 + 0.025], 0xb6b9a9)
  s.box([0.2, 0.04, 0.15], [-0.45, 0.92, -0.2], 0x93816a)
  const roll = new THREE.CylinderGeometry(0.065, 0.065, 0.13, 12).rotateZ(Math.PI / 2)
  s.add(roll, [-0.45, 0.85, -0.15], 0xe2ded0)
}

export function dressWobleFurniture(THREE: typeof Three, s: ApartmentSurface): void {
  const room = s.structure.spaceId
  if (room.endsWith('-living')) living(s)
  else if (room.endsWith('-bedroom')) {
    if (s.structure.kind === 'bed') dressWobleBed(THREE, s)
    else dressApartmentFurniture(s)
  } else if (room.endsWith('-kitchen')) {
    if (s.structure.kind === 'cabinet') dressWobleUpperCabinets(s)
    else dressWobleCounter(s)
  } else if (room.endsWith('-dining')) {
    if (s.structure.kind === 'seat') dressMomozeChair(s)
    else dressWobleMealTable(s)
  } else bathroom(THREE, s)
}
