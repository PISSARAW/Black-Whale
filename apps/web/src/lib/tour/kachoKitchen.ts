import type { ApartmentSurface } from './apartmentDetailSurface'

const BODY = 0xbcbcae,
  DOOR = 0xd2d0c2,
  METAL = 0x9ca59c,
  DARK = 0x424a44

function doors(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, h - 0.06, d], [0, (h + 0.06) / 2, 0], BODY)
  const count = Math.max(1, Math.round(w / 0.72)),
    pitch = (w - 0.05) / count
  for (let i = 0; i < count; i++) {
    const x = (i + 0.5) * pitch - (w - 0.05) / 2
    surface.box([pitch - 0.02, h - 0.12, 0.025], [x, h / 2 + 0.02, d / 2 + 0.008], DOOR)
    surface.box([0.13, 0.015, 0.035], [x, h - 0.1, d / 2 + 0.027], METAL)
  }
}

function sink(surface: ApartmentSurface): void {
  const h = surface.structure.height,
    x = surface.width * 0.23
  surface.box([1.05, 0.025, 0.55], [x, h + 0.015, 0], METAL)
  for (const side of [-1, 1]) {
    surface.box([0.42, 0.015, 0.4], [x + side * 0.24, h + 0.032, 0], DARK)
    surface.box([0.35, 0.01, 0.34], [x + side * 0.24, h + 0.04, 0], 0x9da99e)
  }
  surface.curve(
    [
      [x, h + 0.03, -0.2],
      [x, h + 0.27, -0.2],
      [x, h + 0.29, 0.03],
      [x, h + 0.16, 0.06],
    ],
    0.014,
    METAL,
  )
}

function hobAndOven(surface: ApartmentSurface): void {
  const h = surface.structure.height,
    d = surface.depth
  surface.box([1.05, 0.025, d * 0.86], [0, h + 0.012, 0], DARK)
  for (const x of [-0.27, 0.27]) {
    for (const z of [-0.17, 0.17])
      surface.flatRing({ radius: 0.12, tube: 0.008 }, [x, h + 0.034, z], METAL)
  }
  surface.box([0.85, 0.52, 0.035], [0, 0.42, d / 2 + 0.035], 0x707b73)
  surface.box([0.72, 0.36, 0.025], [0, 0.39, d / 2 + 0.06], 0x2e3731)
  surface.box([0.58, 0.025, 0.055], [0, 0.65, d / 2 + 0.08], METAL)
  for (const x of [-0.3, -0.1, 0.1, 0.3])
    surface.sphere([0.025, 0.025, 0.014], [x, 0.75, d / 2 + 0.06], METAL)
  surface.cylinder({ radius: 0.17, height: 0.2 }, [-0.27, h + 0.14, 0.17], METAL)
  surface.cylinder({ radius: 0.185, height: 0.025 }, [-0.27, h + 0.25, 0.17], 0xc4c6b9)
  surface.sphere([0.035, 0.028, 0.035], [-0.27, h + 0.28, 0.17], DARK)
  for (const side of [-1, 1])
    surface.box([0.085, 0.025, 0.045], [-0.27 + side * 0.2, h + 0.17, 0.17], DARK)
  surface.box([1.1, 0.14, d * 0.95], [0, 1.66, -0.02], 0xb2b8ad)
  surface.box([0.7, 0.33, 0.2], [0, 1.88, -d * 0.26], BODY)
}

function refrigerator(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, h, d], [0, h / 2, 0], 0xc9ccc1)
  for (const [y, height] of [
    [h * 0.65, h * 0.65 - 0.06],
    [h * 0.17, h * 0.33 - 0.06],
  ]) {
    surface.box([w - 0.07, height, 0.045], [0, y, d / 2 + 0.025], DOOR)
    surface.box([0.035, height * 0.55, 0.045], [w * 0.34, y, d / 2 + 0.065], METAL)
  }
}

/** Ch. 376 p. 11: left-hand cooker return, rear sink/cupboards, wall units and right refrigerator. */
export function dressKachoKitchen(surface: ApartmentSurface): void {
  if (surface.structure.id.endsWith('-fridge')) {
    refrigerator(surface)
    return
  }
  doors(surface)
  if (surface.structure.id.endsWith('-cabinet-15')) return
  const h = surface.structure.height
  surface.box([surface.width, 0.04, surface.depth], [0, h, 0], 0xc5c3b2)
  if (surface.structure.id.endsWith('-counter-16')) hobAndOven(surface)
  else sink(surface)
}
