import type { ApartmentSurface } from './apartmentDetailSurface'

const WOOD = 0x91816a,
  TRIM = 0xbfb297,
  FABRIC = 0xccc5b6,
  LEAF = 0x61705b

/** Ch. 361 pp. 18–19: curved upholstered armchair, distinct from the inherited sofa. */
export function dressMomozeChair(s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth
  for (const x of [-w * 0.4, w * 0.4]) {
    for (const z of [-d * 0.37, d * 0.37])
      s.cylinder({ radius: 0.035, height: 0.35 }, [x, 0.18, z], WOOD)
    s.box([0.08, 0.38, d], [x, 0.61, 0], WOOD)
    s.sphere([0.1, 0.08, d * 0.46], [x, 0.83, 0.02], TRIM)
  }
  s.box([w, 0.12, d], [0, 0.38, 0], WOOD)
  s.sphere([w * 0.46, 0.11, d * 0.43], [0, 0.48, 0], FABRIC)
  s.sphere([w * 0.46, 0.48, 0.07], [0, 0.92, -d * 0.4], FABRIC)
  s.curve(
    [
      [-w * 0.47, 0.47, -d * 0.4],
      [-w * 0.48, 1.18, -d * 0.4],
      [0, 1.45, -d * 0.4],
      [w * 0.48, 1.18, -d * 0.4],
      [w * 0.47, 0.47, -d * 0.4],
    ],
    0.035,
    TRIM,
  )
}

function lamp(s: ApartmentSurface, x: number): void {
  const h = s.structure.height
  s.cylinder({ radius: 0.11, height: 0.035 }, [x, h + 0.025, 0], TRIM)
  s.cylinder({ radius: 0.018, height: 0.37 }, [x, h + 0.22, 0], WOOD)
  s.cylinder({ radius: 0.17, bottom: 0.26, height: 0.28, sides: 4 }, [x, h + 0.5, 0], FABRIC)
}

/** Lamps are objects, not extra scene lights. */
export function dressMomozeTable(s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth,
    h = s.structure.height
  s.box([w, 0.065, d], [0, h - 0.035, 0], TRIM)
  for (const x of [-w / 2 + 0.08, w / 2 - 0.08]) {
    for (const z of [-d / 2 + 0.08, d / 2 - 0.08])
      s.box([0.055, h - 0.07, 0.055], [x, (h - 0.07) / 2, z], WOOD)
  }
  for (const x of [-w * 0.32, w * 0.32]) lamp(s, x)
  s.cylinder({ radius: 0.09, bottom: 0.06, height: 0.18 }, [0, h + 0.09, 0], TRIM)
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4,
      x = Math.cos(a) * 0.16,
      z = Math.sin(a) * 0.12
    s.curve(
      [
        [0, h + 0.12, 0],
        [x * 0.6, h + 0.31, z * 0.6],
        [x, h + 0.38, z],
      ],
      0.006,
      LEAF,
    )
    s.sphere([0.065, 0.04, 0.055], [x, h + 0.39, z], FABRIC)
  }
}

/** Original palm silhouette from the broad fronds visible beside the table, ch. 361 p. 18. */
export function dressMomozePalm(s: ApartmentSurface): void {
  s.cylinder({ radius: 0.19, bottom: 0.13, height: 0.34 }, [0, 0.17, 0], 0x978b73)
  s.cylinder({ radius: 0.035, height: 0.85 }, [0, 0.75, 0], WOOD)
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4,
      dx = Math.cos(a),
      dz = Math.sin(a),
      length = 0.48 + (i % 3) * 0.09
    s.curve(
      [
        [0, 0.9, 0],
        [dx * length * 0.6, 1.65, dz * length * 0.6],
        [dx * length, 1.25, dz * length],
      ],
      0.012,
      LEAF,
    )
    for (let j = 1; j < 6; j++) {
      const t = j / 6,
        x = dx * length * t,
        z = dz * length * t,
        y = 0.9 + Math.sin(t * Math.PI * 0.75) * 0.65
      for (const side of [-1, 1])
        s.curve(
          [
            [x, y, z],
            [x - dz * side * 0.13, y - 0.1, z + dx * side * 0.13],
            [x - dz * side * 0.2 + dx * 0.06, y - 0.2, z + dx * side * 0.2 + dz * 0.06],
          ],
          0.014,
          LEAF,
        )
    }
  }
}

/** The small woven basket rests on the floor in ch. 361 p. 19. */
export function dressMomozeBasket(s: ApartmentSurface): void {
  s.box([s.width, 0.19, s.depth], [0, 0.1, 0], 0xb7a98c)
  for (let y = 0.025; y < 0.2; y += 0.035) {
    for (const side of [-1, 1]) s.box([s.width, 0.012, 0.015], [0, y, (side * s.depth) / 2], WOOD)
  }
  for (let x = -s.width / 2 + 0.02; x < s.width / 2; x += 0.045) {
    for (const side of [-1, 1]) s.box([0.012, 0.19, 0.015], [x, 0.1, (side * s.depth) / 2], TRIM)
  }
}
