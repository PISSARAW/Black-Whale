import type { ApartmentSurface } from './apartmentDetailSurface'

const WOOD = 0x9e9176,
  EDGE = 0x665f50,
  METAL = 0x8b908a,
  PAPER = 0xe3e0d3

function desk(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, 0.06, d], [0, h - 0.03, 0], WOOD)
  surface.box([w - 0.08, 0.018, d - 0.06], [0, h + 0.004, 0], 0xc3b69a)
  for (const x of [-w / 2 + 0.07, w / 2 - 0.07])
    for (const z of [-d / 2 + 0.07, d / 2 - 0.07])
      surface.box([0.055, h - 0.06, 0.055], [x, (h - 0.06) / 2, z], EDGE)
  surface.box([w - 0.16, 0.2, 0.035], [0, h - 0.17, d / 2 - 0.05], WOOD)
  // The laptop's blank outer lid faces the visitor; keyboard and trackpad face Tubeppa.
  surface.box([0.52, 0.018, 0.36], [-0.12, h + 0.025, -0.05], METAL)
  surface.box([0.52, 0.34, 0.018], [-0.12, h + 0.2, 0.1], 0x9fa39a)
  surface.box([0.46, 0.28, 0.006], [-0.12, h + 0.2, 0.087], 0x34413f)
  for (let row = 0; row < 4; row++)
    surface.box([0.41, 0.004, 0.008], [-0.12, h + 0.037, -0.13 + row * 0.04], 0x4e5550)
  surface.box([0.13, 0.004, 0.065], [-0.12, h + 0.037, -0.18], 0xc2c5bb)
  for (let index = 0; index < 5; index++) {
    const y = h + 0.018 + index * 0.026,
      x = w * 0.34 + (index % 2) * 0.02
    surface.box([0.38, 0.021, 0.28], [x, y, 0.03], index % 2 ? PAPER : 0xa8a99b)
    surface.box([0.33, 0.006, 0.23], [x, y + 0.012, 0.03], PAPER)
  }
  surface.box([0.2, 0.024, 0.27], [-w * 0.35, h + 0.028, 0.15], PAPER)
  surface.box([0.018, 0.012, 0.18], [-w * 0.32, h + 0.048, 0.15], EDGE)
  const bottleX = w * 0.18
  surface.cylinder({ radius: 0.055, height: 0.22 }, [bottleX, h + 0.13, -0.28], 0xb8c8bf)
  surface.cylinder({ radius: 0.035, height: 0.055 }, [bottleX, h + 0.267, -0.28], PAPER)
  surface.cylinder({ radius: 0.058, height: 0.07 }, [bottleX, h + 0.12, -0.28], 0xd5d8c9)
}

function chair(surface: ApartmentSurface): void {
  surface.cylinder({ radius: 0.04, height: 0.36 }, [0, 0.23, 0], METAL)
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5,
      x = Math.cos(a) * 0.28,
      z = Math.sin(a) * 0.28
    surface.curve(
      [
        [0, 0.13, 0],
        [x * 0.6, 0.09, z * 0.6],
        [x, 0.06, z],
      ],
      0.022,
      METAL,
    )
    surface.sphere([0.035, 0.04, 0.035], [x, 0.045, z], EDGE)
  }
  surface.box([0.64, 0.1, 0.6], [0, 0.45, 0], 0xb9b5a3)
  surface.box([0.64, 0.75, 0.09], [0, 0.83, -0.27], 0xb9b5a3)
  for (const side of [-1, 1]) {
    surface.box([0.04, 0.25, 0.04], [side * 0.34, 0.56, 0.04], METAL)
    surface.box([0.065, 0.04, 0.43], [side * 0.34, 0.69, 0], EDGE)
  }
}

export function dressTubeppaWorkstation(surface: ApartmentSurface): void {
  if (surface.structure.kind === 'seat') chair(surface)
  else desk(surface)
}
