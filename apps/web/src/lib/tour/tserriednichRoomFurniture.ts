import type { TserriednichRoomSurface } from './tserriednichRoomDetailSurface'
import { dressApartmentFurniture } from './apartmentFurniture'
import { dressApartmentSeat } from './apartmentSeating'
import { dressTserriednichClock } from './tserriednichRoomClock'

function floralSideTable(surface: TserriednichRoomSurface): void {
  const w = surface.width,
    d = surface.depth
  surface.box([w, 0.68, d], [0, 0.34, 0], 0xa39780)
  surface.box([w - 0.06, 0.52, 0.025], [0, 0.34, d / 2], 0xc6bda5)
  surface.cylinder({ radius: 0.09, height: 0.22 }, [0, 0.8, 0], 0x7b8774)
  for (let i = 0; i < 9; i++) {
    const a = (i * Math.PI * 2) / 9,
      x = Math.cos(a) * 0.17,
      z = Math.sin(a) * 0.17,
      y = 1 + (i % 3) * 0.06
    surface.curve(
      [
        [0, 0.9, 0],
        [x * 0.5, 0.96, z * 0.5],
        [x, y, z],
      ],
      0.007,
      0x647153,
    )
    surface.sphere([0.07, 0.035, 0.035], [x * 0.7, 0.95, z * 0.7], 0x788367)
    surface.sphere([0.045, 0.04, 0.045], [x, y, z], 0xd1ccb6)
  }
}

function screenPanel(surface: TserriednichRoomSurface): void {
  const w = surface.width,
    h = surface.structure.height,
    front = surface.depth / 2 - 0.025
  surface.box([w * 0.92, h * 0.87, 0.06], [0, h * 0.52, front], 0x615d51)
  surface.box([w * 0.84, h * 0.77, 0.015], [0, h * 0.52, front + 0.038], 0x8b9487)
  surface.box([w * 0.4, 0.04, surface.depth * 0.7], [0, 0.025, 0], 0x615d51)
}

export function dressTserriednichLivingFurniture(surface: TserriednichRoomSurface): void {
  const { id, kind } = surface.structure
  if (id.endsWith('-mantel-clock')) dressTserriednichClock(surface)
  else if (id.endsWith('-urn-pedestal')) floralSideTable(surface)
  else if (id.endsWith('-screen-panel')) screenPanel(surface)
  else if (kind === 'seat') dressApartmentSeat(surface)
  else dressApartmentFurniture(surface)
}

export function dressTserriednichKitchenFurniture(surface: TserriednichRoomSurface): void {
  dressApartmentFurniture(surface)
}
