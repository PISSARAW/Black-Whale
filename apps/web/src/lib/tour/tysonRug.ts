import type { BanquetDetailBuilder } from './banquetDetailBuilder'

/** Ch. 375 p. 1: a flush floor finish, never a solid that blocks the walking plan. */
export function dressTysonCheckerRug(into: BanquetDetailBuilder, floor: number): void {
  const w = 5.8,
    d = 4.6,
    nx = 12,
    nz = 8
  into.box([w, 0.014, d], { at: [6.8, floor + 0.018, 3], colour: 0x827360 })
  const px = (w - 0.25) / nx,
    pz = (d - 0.25) / nz
  for (let x = 0; x < nx; x++)
    for (let z = 0; z < nz; z++)
      into.box([px, 0.005, pz], {
        at: [
          6.8 + (x + 0.5) * px - (w - 0.25) / 2,
          floor + 0.028,
          3 + (z + 0.5) * pz - (d - 0.25) / 2,
        ],
        colour: (x + z) % 2 ? 0x3c4038 : 0xc6c1ae,
      })
}
