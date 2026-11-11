import type { ApartmentSurface } from './apartmentDetailSurface'

function service(surface: ApartmentSurface): void {
  const h = surface.structure.height
  surface.box([0.45, 0.015, 0.32], [0, h + 0.025, 0], 0xb9b8a9)
  for (const x of [-0.14, 0.14]) {
    surface.cylinder({ radius: 0.055, height: 0.012 }, [x, h + 0.04, 0], 0xd6d4c4)
    surface.cylinder({ radius: 0.035, height: 0.06 }, [x, h + 0.075, 0], 0xd6d4c4)
  }
}

/** A bouquet, cups and a closed book can be read in the salon overview (ch. 375 p. 1). */
export function dressTysonTableObjects(surface: ApartmentSurface): void {
  if (surface.structure.id.endsWith('-service-table')) return service(surface)
  const h = surface.structure.height
  surface.cylinder({ radius: 0.07, height: 0.16, bottom: 0.05 }, [0, h + 0.085, 0], 0x9f9d80)
  for (let i = 0; i < 7; i++) {
    const a = (i * Math.PI * 2) / 7,
      x = Math.cos(a) * 0.12,
      z = Math.sin(a) * 0.12
    surface.curve(
      [
        [0, h + 0.15, 0],
        [x * 0.5, h + 0.24, z * 0.5],
        [x, h + 0.3, z],
      ],
      0.006,
      0x697557,
    )
    surface.sphere([0.045, 0.04, 0.045], [x, h + 0.3, z], 0xc9bc9f)
  }
  for (const x of [-surface.width * 0.3, surface.width * 0.3]) {
    surface.cylinder({ radius: 0.075, height: 0.012 }, [x, h + 0.02, 0.34], 0xd6d4c4)
    surface.cylinder({ radius: 0.04, height: 0.065 }, [x, h + 0.055, 0.34], 0xd6d4c4)
    surface.cylinder({ radius: 0.032, height: 0.006 }, [x, h + 0.09, 0.34], 0x615347)
  }
  surface.box([0.22, 0.035, 0.28], [surface.width * 0.28, h + 0.04, -0.28], 0x988b73)
  surface.box([0.19, 0.02, 0.25], [surface.width * 0.28, h + 0.041, -0.28], 0xd7d1bd)
  surface.box([0.22, 0.006, 0.28], [surface.width * 0.28, h + 0.058, -0.28], 0x988b73)
}
