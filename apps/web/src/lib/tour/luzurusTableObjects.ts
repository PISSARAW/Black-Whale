import type { ApartmentSurface } from './apartmentDetailSurface'

function hookah(surface: ApartmentSurface): void {
  const h = surface.structure.height
  surface.sphere([0.1, 0.11, 0.1], [0, h + 0.12, 0], 0x81978c)
  surface.cylinder({ radius: 0.025, height: 0.37 }, [0, h + 0.38, 0], 0xab9973)
  surface.cylinder({ radius: 0.085, height: 0.025 }, [0, h + 0.54, 0], 0xab9973)
  surface.cylinder({ radius: 0.04, height: 0.075 }, [0, h + 0.59, 0], 0x8b745b)
  surface.curve(
    [
      [0, h + 0.23, 0],
      [0.26, h + 0.12, 0.05],
      [0.38, h + 0.04, 0.2],
      [0.47, h + 0.2, 0.24],
    ],
    0.012,
    0x5f5a49,
  )
}

function bottles(surface: ApartmentSurface): void {
  const h = surface.structure.height
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * Math.min(surface.width * 0.16, 0.16),
      z = i % 2 ? 0.12 : -0.12
    surface.cylinder({ radius: 0.042, height: 0.17 }, [x, h + 0.1, z], i % 2 ? 0x737b60 : 0x9b8d68)
    surface.cylinder({ radius: 0.021, height: 0.08 }, [x, h + 0.22, z], 0x72775d)
    surface.cylinder({ radius: 0.044, height: 0.055 }, [x, h + 0.11, z], 0xc0bba1)
  }
  surface.cylinder(
    { radius: 0.065, height: 0.015 },
    [surface.width * 0.32, h + 0.02, 0.2],
    0xc2bda6,
  )
  surface.box([0.2, 0.015, 0.14], [-surface.width * 0.3, h + 0.03, 0.24], 0xb4ad96)
}

export function dressLuzurusTableObjects(surface: ApartmentSurface): void {
  if (surface.structure.id.endsWith('-smoking-table')) hookah(surface)
  else bottles(surface)
}
