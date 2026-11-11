import { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentSeat } from './apartmentSeating'
import { dressPrinceBedroomBed } from './princeBedroomBed'

const WOOD = 0x6a5845,
  EDGE = 0x403a30,
  LINEN = 0xcac7b9,
  FABRIC = 0x6b7363,
  METAL = 0x9c927a

function bedLegs(surface: ApartmentSurface, height: number): void {
  const x = surface.width / 2 - 0.09
  const z = surface.depth / 2 - 0.1
  for (const sideX of [-1, 1]) {
    for (const sideZ of [-1, 1]) {
      surface.box([0.065, height, 0.065], [sideX * x, height / 2, sideZ * z], EDGE)
    }
  }
}

function headboard(surface: ApartmentSurface, mattress: number): void {
  const w = surface.width,
    d = surface.depth,
    height = Math.max(0.82, mattress + 0.38)
  surface.box([w, height, 0.09], [0, height / 2, -d / 2 + 0.045], WOOD)
  const panels = w > 1.4 ? 3 : 2,
    pitch = (w - 0.14) / panels
  for (let index = 0; index < panels; index++) {
    surface.box(
      [pitch - 0.035, height - 0.18, 0.025],
      [(index + 0.5) * pitch - (w - 0.14) / 2, height / 2, -d / 2 + 0.1],
      0x837057,
    )
  }
}

function bed(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  const legHeight = Math.max(0.1, h * 0.2),
    frameY = legHeight + 0.1,
    mattressY = frameY + 0.13
  bedLegs(surface, legHeight)
  surface.box([w, 0.18, d], [0, frameY, 0], WOOD)
  surface.box([w - 0.08, 0.2, d - 0.08], [0, mattressY, 0], LINEN)
  headboard(surface, mattressY + 0.1)
  surface.box([w - 0.12, 0.035, d * 0.68], [0, mattressY + 0.12, d * 0.14], FABRIC)
  surface.box([w - 0.13, 0.12, 0.04], [0, mattressY + 0.07, d * 0.47], FABRIC)
  const pillows = w > 1.4 ? [-w * 0.23, w * 0.23] : [0]
  for (const x of pillows)
    surface.sphere([Math.min(w * 0.2, 0.34), 0.075, 0.2], [x, mattressY + 0.15, -d * 0.31], LINEN)
}

function drawerFronts(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  const drawers = h < 0.8 ? 2 : 3,
    pitch = (h - 0.18) / drawers
  for (let index = 0; index < drawers; index++) {
    const y = 0.1 + (index + 0.5) * pitch
    surface.box([w - 0.1, pitch - 0.035, 0.028], [0, y, d / 2 + 0.008], 0x8b7960)
    surface.box([0.13, 0.018, 0.03], [0, y, d / 2 + 0.03], METAL)
  }
}

function cabinetDoors(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  const doors = Math.max(2, Math.round(w / 0.7)),
    pitch = w / doors
  for (let index = 0; index < doors; index++) {
    const x = (index + 0.5) * pitch - w / 2
    surface.box([pitch - 0.04, h - 0.24, 0.028], [x, h / 2 + 0.02, d / 2 + 0.006], 0x8b7960)
    surface.box([pitch - 0.14, h - 0.4, 0.018], [x, h / 2 + 0.02, d / 2 + 0.027], 0x75634e)
    surface.sphere(
      [0.025, 0.025, 0.025],
      [x + (index % 2 ? -1 : 1) * pitch * 0.27, h * 0.52, d / 2 + 0.05],
      METAL,
    )
  }
}

function cabinet(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, h - 0.08, d], [0, (h + 0.08) / 2, 0], WOOD)
  surface.box([w - 0.05, 0.08, d - 0.04], [0, 0.04, 0], EDGE)
  surface.box([w + 0.04, 0.055, d + 0.04], [0, h - 0.0275, 0], 0x806c54)
  if (h < 0.9) drawerFronts(surface)
  else cabinetDoors(surface)
}

function table(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, 0.07, d], [0, h - 0.035, 0], WOOD)
  surface.box([w - 0.06, 0.015, d - 0.06], [0, h + 0.007, 0], 0xa28d6e)
  surface.box([w - 0.18, 0.1, d - 0.18], [0, h - 0.12, 0], 0x584938)
  for (const x of [-1, 1]) {
    for (const z of [-1, 1])
      surface.box(
        [0.075, h - 0.07, 0.075],
        [x * (w / 2 - 0.1), (h - 0.07) / 2, z * (d / 2 - 0.1)],
        WOOD,
      )
  }
  if (h < 0.62) surface.box([w - 0.26, 0.035, d - 0.22], [0, h * 0.35, 0], 0x7b674f)
}

export function dressApartmentFurniture(surface: ApartmentSurface): void {
  if (surface.structure.kind === 'seat') dressApartmentSeat(surface)
  if (surface.structure.kind === 'bed' && !dressPrinceBedroomBed(surface)) bed(surface)
  if (surface.structure.kind === 'cabinet') cabinet(surface)
  if (surface.structure.kind === 'table') table(surface)
}
