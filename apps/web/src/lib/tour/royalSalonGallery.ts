import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { SALON_GOLD, SALON_STONE, SALON_WOOD } from './royalSalonDetailSurface'
import type { Space } from './types'

interface RoyalSalonGalleryOptions {
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

interface SidePictureOptions {
  side: -1 | 1
  z: number
  width: number
  height: number
  y: number
  index: number
}

function sidePicture(
  context: { into: BanquetDetailBuilder; floor: number },
  options: SidePictureOptions,
): void {
  const { into, floor } = context
  const { side, z, width, height, y, index } = options
  const x = side * 11.86
  const face = x - side * 0.07
  into.box([0.08, height + 0.18, width + 0.18], {
    at: [x, floor + y, z],
    colour: SALON_GOLD,
  })
  into.box([0.085, height, width], {
    at: [face, floor + y, z],
    colour: index % 3 === 0 ? 0x314437 : index % 2 ? 0x302927 : 0x4b392f,
  })
  into.sphere([0.045, height * 0.13, width * 0.11], {
    at: [face - side * 0.05, floor + y + height * 0.18, z],
    colour: 0xd2c3a7,
  })
  into.sphere([0.04, height * 0.24, width * 0.22], {
    at: [face - side * 0.052, floor + y - height * 0.13, z],
    colour: index % 2 ? 0x75523f : 0x7d715d,
  })
}

function wallGallery(options: RoyalSalonGalleryOptions): void {
  const floor = floorOf(options.space, options.plan.tier)
  const pictures = [
    { side: -1, z: -6.5, width: 0.9, height: 0.9, y: 3.2 },
    { side: -1, z: -3.3, width: 1, height: 0.65, y: 2.3 },
    { side: -1, z: -0.2, width: 0.8, height: 0.65, y: 2.2 },
    { side: -1, z: 3.2, width: 1, height: 0.8, y: 2.7 },
    { side: -1, z: 6.6, width: 0.9, height: 1, y: 3 },
    { side: 1, z: 3.8, width: 1, height: 0.65, y: 1.7 },
    { side: 1, z: 5.8, width: 0.8, height: 0.7, y: 3.8 },
    { side: 1, z: -7, width: 0.6, height: 0.8, y: 3.4 },
  ]
  pictures.forEach((picture, index) =>
    sidePicture({ into: options.into, floor }, { ...picture, side: picture.side as -1 | 1, index }),
  )
}

function landscapeSurround(options: RoyalSalonGalleryOptions): void {
  const floor = floorOf(options.space, options.plan.tier)
  const z = -8.13
  options.into.box([10.9, 0.2, 0.2], {
    at: [0, floor + 0.66, z],
    colour: SALON_STONE,
  })
  options.into.box([10.9, 0.25, 0.22], {
    at: [0, floor + 4.68, z],
    colour: SALON_GOLD,
  })
  for (const side of [-1, 1]) {
    options.into.box([0.24, 4.2, 0.22], {
      at: [side * 5.33, floor + 2.65, z],
      colour: SALON_STONE,
    })
    options.into.box([0.09, 4.05, 0.25], {
      at: [side * 5.16, floor + 2.65, z + 0.03],
      colour: SALON_GOLD,
    })
    options.into.box([0.62, 0.16, 0.34], {
      at: [side * 5.33, floor + 0.48, z + 0.05],
      colour: SALON_WOOD,
    })
  }
}

export function dressRoyalSalonGallery(options: RoyalSalonGalleryOptions): void {
  if (options.plan.structures.some((s) => s.id.endsWith('-landscape-panel')))
    landscapeSurround(options)
  wallGallery(options)
}
