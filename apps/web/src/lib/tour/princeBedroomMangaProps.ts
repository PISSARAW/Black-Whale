import { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentFurniture } from './apartmentFurniture'
import type { Structure } from './types'

const DETAIL_SUFFIX = new RegExp(
  '-bedroom-(party-table|entertainment-console|television|clock-and-photos|' +
    'book-stack|telephone|canopy-headboard|vent-15)$',
)

const GOLD = 0xb19359,
  DARK = 0x202326,
  PAPER = 0xd4ccb9

export const isPrinceBedroomMangaFixture = (structure: Structure): boolean =>
  DETAIL_SUFFIX.test(structure.id)

function partyTable(surface: ApartmentSurface): void {
  dressApartmentFurniture(surface)
  const h = surface.structure.height
  for (const [x, z, colour] of [
    [-0.2, -0.12, 0x6e3c2f],
    [0.02, 0.14, 0x526649],
    [0.22, -0.04, 0xa78a58],
  ] as const) {
    surface.cylinder({ radius: 0.045, height: 0.22, sides: 12 }, [x, h + 0.12, z], colour)
    surface.box([0.028, 0.06, 0.028], [x, h + 0.26, z], GOLD)
  }
  surface.box([0.34, 0.025, 0.25], [0, h + 0.035, 0], GOLD)
}

function entertainmentConsole(surface: ApartmentSurface): void {
  dressApartmentFurniture(surface)
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  for (const x of [-w * 0.36, w * 0.36]) {
    surface.box([0.42, h - 0.2, 0.035], [x, h / 2, d / 2 + 0.04], DARK)
    for (const y of [h * 0.34, h * 0.68]) {
      surface.ring(0.12, [x, y, d / 2 + 0.065], 0x5f6260)
    }
  }
  for (const y of [h * 0.32, h * 0.61]) {
    surface.box([w * 0.34, 0.045, 0.04], [0, y, d / 2 + 0.045], GOLD)
  }
  surface.box([0.48, 0.12, 0.04], [0, h * 0.78, d / 2 + 0.05], 0x151719)
}

function television(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, h, d], [0, h / 2, 0], DARK)
  surface.box([w - 0.16, h - 0.16, 0.035], [0, h / 2, d / 2 + 0.03], 0x101619)
  surface.box([w - 0.26, h - 0.26, 0.018], [0, h / 2, d / 2 + 0.055], 0x35464b)
  surface.box([0.18, 0.025, 0.025], [w * 0.3, 0.08, d / 2 + 0.08], GOLD)
}

function clockAndPhotos(surface: ApartmentSurface): void {
  dressApartmentFurniture(surface)
  const h = surface.structure.height,
    d = surface.depth
  surface.box([0.28, 0.15, 0.12], [-0.2, h + 0.09, 0], DARK)
  surface.box([0.22, 0.075, 0.015], [-0.2, h + 0.1, d * 0.1], 0x7f342d)
  for (const [x, y, width] of [
    [0.05, h + 0.15, 0.18],
    [0.25, h + 0.19, 0.16],
  ] as const) {
    surface.box([width, 0.27, 0.025], [x, y, 0], GOLD)
    surface.box([width - 0.035, 0.235, 0.012], [x, y, d * 0.08], PAPER)
  }
  for (const x of [-0.27, -0.19, -0.11]) {
    surface.box([0.035, 0.055, 0.018], [x, h + 0.1, d * 0.13], 0xe0b56a)
  }
}

function bookStack(surface: ApartmentSurface): void {
  const colours = [0x63513f, 0x41566a, 0x70494e, 0x7a704c]
  for (let index = 0; index < 7; index++) {
    const width = surface.width - 0.05 - (index % 3) * 0.07
    surface.box(
      [width, 0.045, surface.depth - 0.08],
      [(index % 2 ? 1 : -1) * 0.035, 0.025 + index * 0.048, 0],
      colours[index % colours.length],
    )
    surface.box(
      [width - 0.035, 0.01, surface.depth - 0.095],
      [(index % 2 ? 1 : -1) * 0.035, 0.052 + index * 0.048, 0],
      PAPER,
    )
  }
}

function telephone(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, h, d * 0.5], [0, h / 2, 0], 0x777468)
  surface.box([w - 0.12, h * 0.55, 0.035], [0, h * 0.48, d * 0.27], 0xaaa393)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      surface.box([0.035, 0.03, 0.02], [-0.06 + col * 0.06, h * 0.35 + row * 0.055, d * 0.31], DARK)
    }
  }
  surface.box([w * 0.75, 0.07, 0.08], [0, h + 0.06, 0], DARK)
  for (const x of [-w * 0.3, w * 0.3]) {
    surface.sphere([0.08, 0.07, 0.065], [x, h + 0.06, 0], DARK)
  }
  surface.curve(
    [
      [w * 0.32, h + 0.04, 0],
      [w * 0.48, h - 0.16, 0.04],
      [w * 0.36, h - 0.3, 0.08],
    ],
    0.012,
    DARK,
  )
}

function canopyHeadboard(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, 0.09, d], [0, h - 0.05, 0], GOLD)
  for (const x of [-w * 0.43, w * 0.43]) {
    surface.box([0.24, h - 0.2, d], [x, (h - 0.2) / 2, 0], 0x815760)
    surface.sphere([0.11, 0.11, 0.11], [x, h - 0.02, 0], GOLD)
  }
  surface.box([w * 0.65, 0.22, d], [0, h - 0.18, 0], 0xd9d2c2)
}

function vent(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, h, d * 0.35], [0, h / 2, 0], DARK)
  surface.box([w - 0.06, h - 0.06, 0.025], [0, h / 2, d * 0.2], 0x71746e)
  for (let x = -w / 2 + 0.1; x < w / 2 - 0.04; x += 0.095) {
    surface.box([0.025, h - 0.1, 0.025], [x, h / 2, d * 0.25], 0x303330)
  }
}

export function dressPrinceBedroomMangaProp(surface: ApartmentSurface): void {
  const id = surface.structure.id
  if (id.endsWith('-party-table')) partyTable(surface)
  else if (id.endsWith('-entertainment-console')) entertainmentConsole(surface)
  else if (id.endsWith('-television')) television(surface)
  else if (id.endsWith('-clock-and-photos')) clockAndPhotos(surface)
  else if (id.endsWith('-book-stack')) bookStack(surface)
  else if (id.endsWith('-telephone')) telephone(surface)
  else if (id.endsWith('-canopy-headboard')) canopyHeadboard(surface)
  else if (id.endsWith('-vent-15')) vent(surface)
}
