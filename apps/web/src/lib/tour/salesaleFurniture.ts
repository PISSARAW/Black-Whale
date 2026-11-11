import type * as Three from 'three'
import type { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentFurniture } from './apartmentFurniture'
import { dressSalesaleBed } from './salesaleBed'

function audioCabinet(surface: ApartmentSurface): void {
  dressApartmentFurniture(surface)
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  for (let row = 0; row < 4; row++) {
    const y = 0.17 + (row * (h - 0.25)) / 4
    surface.box([w - 0.18, 0.13, 0.025], [0, y, d / 2 + 0.045], 0x53574e)
    surface.box([w * 0.5, 0.012, 0.012], [-w * 0.1, y, d / 2 + 0.065], 0xa7a38c)
    for (const x of [w * 0.3, w * 0.37])
      surface.sphere([0.015, 0.015, 0.012], [x, y, d / 2 + 0.065], 0xb3aa8e)
  }
}

function screen(surface: ApartmentSurface): void {
  const w = surface.width,
    h = surface.structure.height,
    d = surface.depth
  surface.box([w, h, d], [0, h / 2, 0], 0x4c4f46)
  surface.box([w - 0.13, h - 0.13, 0.025], [0, h / 2, d / 2 + 0.018], 0xc9c9b8)
  surface.box([w - 0.24, h - 0.24, 0.012], [0, h / 2, d / 2 + 0.04], 0xa6b1a6)
  // The cloth hanging over one screen is visible in ch. 381 p. 15.
  if (surface.structure.id.endsWith('-television-west'))
    surface.box([w * 0.22, h * 0.5, 0.045], [w * 0.22, h * 0.79, d / 2 + 0.07], 0xd1c8b4)
}

function drinks(surface: ApartmentSurface): void {
  surface.box([surface.width, 0.025, surface.depth], [0, 0.025, 0], 0x8f846e)
  for (const x of [-0.09, 0.08]) {
    surface.cylinder({ radius: 0.04, height: 0.18 }, [x, 0.14, -0.05], 0x879078)
    surface.cylinder({ radius: 0.02, height: 0.07 }, [x, 0.265, -0.05], 0x6e755d)
    surface.cylinder({ radius: 0.041, height: 0.05 }, [x, 0.15, -0.05], 0xd2cbb4)
  }
  surface.cylinder({ radius: 0.06, height: 0.02 }, [0, 0.052, 0.2], 0xcac4af)
}

export function dressSalesaleFurniture(THREE: typeof Three, surface: ApartmentSurface): void {
  const { id, kind } = surface.structure
  if (kind === 'bed') dressSalesaleBed(THREE, surface)
  else if (id.includes('-television')) screen(surface)
  else if (id.endsWith('-cabinet-02') || id.endsWith('-entertainment-console'))
    audioCabinet(surface)
  else if (id.endsWith('-party-table')) drinks(surface)
  else if (id.includes('-floor-cushion-'))
    surface.sphere([surface.width / 2, 0.13, surface.depth / 2], [0, 0.14, 0], 0xbcb29b)
  else dressApartmentFurniture(surface)
}
