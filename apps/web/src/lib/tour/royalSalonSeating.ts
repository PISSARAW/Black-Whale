import { SALON_FABRIC, SALON_GOLD, SALON_WOOD, type SalonSurface } from './royalSalonDetailSurface'

/** Ch. 382 pp. 3–7: low carved seats; the king's chair has a long foot section. */
export function dressRoyalSalonSeat(s: SalonSurface): void {
  const { width: w, depth: d, structure } = s
  const h = structure.height,
    royal = structure.id.endsWith('-royal-chaise')
  s.box([w * 0.9, 0.13, d * 0.88], [0, h - 0.05, 0], SALON_WOOD)
  s.sphere([w * 0.44, 0.11, d * 0.43], [0, h + 0.07, 0], SALON_FABRIC)
  for (const side of [-1, 1]) {
    for (const z of [-d * 0.35, d * 0.35]) {
      s.curve(
        [
          [side * w * 0.38, 0.03, z - 0.04],
          [side * w * 0.4, h * 0.45, z],
          [side * w * 0.37, h - 0.08, z],
        ],
        0.045,
        SALON_WOOD,
      )
      s.sphere([0.065, 0.035, 0.065], [side * w * 0.38, 0.045, z - 0.04], SALON_GOLD)
    }
    s.curve(
      [
        [side * w * 0.45, h + 0.2, -d * 0.28],
        [side * w * 0.48, h + 0.39, -d * 0.37],
        [side * w * 0.43, h + 0.42, -d * 0.22],
        [side * w * 0.43, h + 0.27, d * 0.3],
      ],
      0.065,
      SALON_WOOD,
    )
    s.sphere([0.08, 0.09, 0.1], [side * w * 0.46, h + 0.37, -d * 0.31], SALON_GOLD)
  }
  if (royal) recliningBack(s)
  else {
    s.sphere([w * 0.47, 0.44, 0.11], [0, h + 0.44, d * 0.36], SALON_WOOD)
    s.sphere([w * 0.41, 0.37, 0.115], [0, h + 0.44, d * 0.32], SALON_FABRIC)
    for (const x of [-0.25, 0, 0.25])
      s.sphere([0.02, 0.02, 0.015], [x * w, h + 0.5, d * 0.32 - 0.114], SALON_GOLD)
  }
}

function recliningBack(s: SalonSurface): void {
  const { width: w, depth: d, structure } = s,
    h = structure.height
  const placement = { at: s.point([0, h + 0.64, d * 0.31]), rotation: [-0.3, s.angle, 0] as const }
  s.into.sphere([w * 0.47, 0.74, 0.15], { ...placement, colour: SALON_WOOD })
  s.into.sphere([w * 0.41, 0.65, 0.14], {
    ...placement,
    at: s.point([0, h + 0.65, d * 0.27]),
    colour: SALON_FABRIC,
  })
  for (const x of [-0.25, 0, 0.25])
    s.sphere([0.027, 0.027, 0.018], [x * w, h + 0.95, d * 0.21], SALON_GOLD)
  s.sphere([w * 0.34, 0.12, 0.17], [0, h + 1.12, d * 0.12], SALON_FABRIC)
  for (const side of [-1, 1])
    s.curve(
      [
        [side * w * 0.42, h + 1.08, d * 0.2],
        [side * w * 0.49, h + 1.31, d * 0.35],
        [side * w * 0.32, h + 1.36, d * 0.38],
      ],
      0.038,
      SALON_GOLD,
    )
}
