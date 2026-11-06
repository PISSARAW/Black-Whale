import { PrisonFixture, PRISON } from './prisonFixture'

export function buildPrisonBed(f: PrisonFixture): void {
  const {
    size: [length, width],
    height,
  } = f.placement.structure
  f.box([length, 0.09, width], [0, height - 0.21, 0], PRISON.dark)
  f.box([length - 0.025, 0.2, width - 0.025], [0, height - 0.065, 0], PRISON.linen)
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      f.box(
        [0.055, height - 0.2, 0.055],
        [x * (length / 2 - 0.08), (height - 0.2) / 2, z * (width / 2 - 0.08)],
        PRISON.dark,
      )
    }
  }
  f.pillow([0.42, 0.19, width * 0.48], [-length / 2 + 0.45, height + 0.18, 0])
  // The panel's plain sheet has a turned edge, rather than a patterned cover.
  f.box([length * 0.55, 0.025, width], [length * 0.2, height + 0.04, 0], PRISON.linen)
  f.box([0.035, 0.035, width], [-length * 0.075, height + 0.055, 0], PRISON.seam)
  for (const side of [-1, 1]) {
    f.box(
      [length * 0.55, 0.15, 0.018],
      [length * 0.2, height - 0.025, side * (width / 2 - 0.005)],
      PRISON.linen,
    )
  }
}

export function buildPrisonTable(f: PrisonFixture): void {
  const {
    size: [width, depth],
    height,
    id,
  } = f.placement.structure
  f.box([width, 0.055, depth], [0, height - 0.0275, 0], PRISON.wood)
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      f.box(
        [0.045, height - 0.055, 0.045],
        [x * (width / 2 - 0.05), (height - 0.055) / 2, z * (depth / 2 - 0.05)],
        PRISON.dark,
      )
    }
  }
  if (!id.endsWith('-side-table')) return
  // Ch. 359: a drink can. Its illegible branding is deliberately left blank.
  f.cylinder([0.035, 0.115], [0, height + 0.0575, 0], PRISON.steel)
  f.ring([0, height + 0.116, 0], { radius: 0.025, tube: 0.003, rotation: [Math.PI / 2, 0, 0] })
}

export function buildPrisonBench(f: PrisonFixture): void {
  const {
    size: [width, depth],
    height,
    id,
  } = f.placement.structure
  if (id.includes('-cushion-')) {
    f.box([width, height * 0.75, depth], [0, height * 0.4, 0], PRISON.seam)
    f.pillow([width / 2, height * 0.45, depth / 2], [0, height * 0.65, 0])
    return
  }
  f.box([width, 0.12, depth], [0, height - 0.06, 0], PRISON.wood)
  for (const side of [-1, 1]) {
    f.box(
      [0.09, height - 0.12, depth * 0.8],
      [side * (width / 2 - 0.15), (height - 0.12) / 2, 0],
      PRISON.dark,
    )
  }
}

export function buildPrisonShelves(f: PrisonFixture): void {
  const {
    size: [width, depth],
    height,
  } = f.placement.structure
  f.box([width, height, 0.035], [0, height / 2, depth / 2 - 0.0175], PRISON.wood)
  for (const side of [-1, 1]) {
    f.box([0.045, height, depth], [side * (width / 2 - 0.0225), height / 2, 0], PRISON.wood)
  }
  for (let shelf = 0; shelf < 5; shelf++) {
    f.box([width, 0.04, depth], [0, 0.02 + (shelf * (height - 0.04)) / 4, 0], PRISON.wood)
  }
}

/** Retained from the previous local map; the consulted panel does not attest it. */
export function buildPrisonUrinal(f: PrisonFixture): void {
  const {
    size: [width, depth],
    height,
  } = f.placement.structure
  f.box([width * 0.22, height * 0.8, depth], [-width * 0.36, height * 0.6, 0], PRISON.ceramic)
  f.pillow([width * 0.45, height * 0.3, depth * 0.48], [0, height * 0.4, 0])
  f.box([width * 0.65, 0.025, depth * 0.68], [0, height * 0.61, 0], PRISON.dark)
}

export function buildPrisonIntercom(f: PrisonFixture): void {
  const {
    size: [width, depth],
    height,
  } = f.placement.structure
  f.box([width, height, depth * 0.22], [0, height / 2, -depth * 0.35], PRISON.dark)
  for (let slit = 0; slit < 5; slit++) {
    f.box(
      [width * 0.55, 0.018, 0.015],
      [width * 0.08, height * (0.36 + slit * 0.09), -depth * 0.23],
      PRISON.steel,
    )
  }
  f.box(
    [width * 0.14, height * 0.72, depth * 0.3],
    [-width * 0.34, height / 2, -depth * 0.15],
    PRISON.steel,
  )
}
