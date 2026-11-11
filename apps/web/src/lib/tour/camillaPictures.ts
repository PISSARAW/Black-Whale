import { CamillaSurface, CAMILLA_GOLD, CAMILLA_WOOD, CAMILLA_STONE } from './camillaDetailSurface'

/** Small framed landscapes are original silhouettes, never sampled manga textures. */
export function dressCamillaPicture(surface: CamillaSurface): void {
  surface.box([0.98, 0.98, 0.7], [0, 0.5, 0], CAMILLA_WOOD)
  surface.box([0.86, 0.8, 0.04], [0, 0.5, 0.38], 0x6e796c)
  for (const side of [-1, 1]) {
    surface.box([0.97, 0.045, 0.09], [0, 0.5 + side * 0.46, 0.4], CAMILLA_GOLD)
    surface.box([0.045, 0.97, 0.09], [side * 0.46, 0.5, 0.4], CAMILLA_GOLD)
    surface.box([0.86, 0.018, 0.02], [0, 0.5 + side * 0.4, 0.46], CAMILLA_STONE)
  }
  surface.sphere([0.055, 0.08, 0.008], [-0.2, 0.7, 0.42], 0xb9ba9d)
  surface.sphere([0.38, 0.15, 0.008], [-0.05, 0.28, 0.42], 0x3c5041)
  surface.sphere([0.2, 0.24, 0.008], [0.22, 0.37, 0.44], 0x526452)
}
