import type { ApartmentSurface } from './apartmentDetailSurface'

export function dressLuzurusShelf(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, h, 0.04], [0, h / 2, -d / 2 + 0.02], 0x655a48)
  for (const x of [-w / 2 + 0.035, 0, w / 2 - 0.035])
    surface.box([0.07, h, d], [x, h / 2, 0], 0x82715a)
  for (let row = 0; row < 5; row++) {
    const y = 0.08 + (row * (h - 0.16)) / 4
    surface.box([w, 0.05, d], [0, y, 0], 0x9d8a6c)
    if (row === 4) continue
    for (let i = 0; i < 8; i++) {
      const x = ((i + 0.5) * w) / 8 - w / 2,
        ph = 0.17 + ((i * 3 + row) % 4) * 0.045
      if ((i + row) % 3 === 0) {
        surface.cylinder({ radius: 0.035, height: ph }, [x, y + ph / 2 + 0.03, 0], 0x8c967a)
        surface.cylinder({ radius: 0.021, height: 0.04 }, [x, y + ph + 0.05, 0], 0xc7c1a3)
      } else {
        surface.box(
          [w / 10, ph, d * 0.67],
          [x, y + ph / 2 + 0.03, 0],
          (i + row) % 2 ? 0xb7ae91 : 0x7d856e,
        )
        surface.box([w / 11, 0.015, 0.008], [x, y + ph * 0.6, d * 0.34], 0xd0c8ad)
      }
    }
  }
}

export function dressLuzurusPlant(surface: ApartmentSurface): void {
  surface.cylinder({ radius: 0.14, height: 0.3, bottom: 0.1 }, [0, 0.15, 0], 0xa49577)
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4,
      x = Math.cos(a) * 0.18,
      z = Math.sin(a) * 0.18,
      y = 0.75 + (i % 3) * 0.15
    surface.curve(
      [
        [0, 0.25, 0],
        [x * 0.3, y * 0.8, z * 0.3],
        [x, y, z],
      ],
      0.007,
      0x697450,
    )
    surface.sphere([0.085, 0.19, 0.06], [x, y, z], 0x79825e)
  }
}

export function dressLuzurusPicture(surface: ApartmentSurface): void {
  const w = surface.width,
    h = surface.structure.height,
    z = surface.depth / 2
  const screen = surface.structure.id.endsWith('-television')
  surface.box([w, h, 0.03], [0, h / 2, z - 0.015], 0x685f4d)
  surface.box([w - 0.09, h - 0.09, 0.015], [0, h / 2, z + 0.01], screen ? 0xb6c3b7 : 0xd1c9b0)
  for (const side of [-1, 1]) {
    surface.box([w, 0.04, 0.025], [0, (h * (side + 1)) / 2, z + 0.025], 0xab9874)
    surface.box([0.04, h, 0.025], [side * (w / 2 - 0.02), h / 2, z + 0.025], 0xab9874)
  }
  if (screen) {
    // Original monochrome performance silhouette; no copied still or invented programme title.
    surface.sphere([w * 0.12, h * 0.21, 0.009], [-w * 0.1, h * 0.6, z + 0.025], 0x555d50)
    surface.sphere([w * 0.2, h * 0.13, 0.008], [-w * 0.08, h * 0.23, z + 0.026], 0x555d50)
    surface.box([w * 0.2, 0.018, 0.015], [w * 0.13, h * 0.41, z + 0.025], 0x4c5148)
  } else {
    for (let i = 0; i < 6; i++) {
      const x = (i - 2.5) * w * 0.12
      surface.curve(
        [
          [x, h * 0.75, z + 0.026],
          [x - w * 0.07, h * 0.55, z + 0.026],
          [x + w * 0.05, h * 0.35, z + 0.026],
        ],
        0.012,
        0x6b6d57,
      )
    }
  }
}
