import { BanquetDetailBuilder } from './banquetDetailBuilder'

const STEEL = 0x697276,
  DARK = 0x444e54,
  EDGE = 0x939a9a

/** Flanges and web catch different light, instead of reading as flat dark strips. */
function girder(
  into: BanquetDetailBuilder,
  options: {
    x: number
    y: number
    z: number
    length: number
  },
): void {
  const { x, y, z, length } = options
  into.box([length, 0.19, 0.055], { at: [x, y, z], colour: DARK })
  for (const dy of [-0.1, 0.1]) {
    into.box([length, 0.025, 0.22], { at: [x, y + dy, z], colour: STEEL })
  }
}

export function roofTruss(
  into: BanquetDetailBuilder,
  options: {
    z: number
    span: [number, number]
    top: number
  },
): void {
  const {
    z,
    span: [minX, maxX],
    top,
  } = options
  const width = maxX - minX,
    midX = (minX + maxX) / 2
  const low = top - 1.05,
    high = top - 0.15
  girder(into, { x: midX, y: high, z, length: width })
  girder(into, { x: midX, y: low, z, length: width })
  const bays = Math.ceil(width / 3.5),
    step = width / bays
  for (let index = 0; index <= bays; index++) {
    const x = minX + index * step
    into.box([0.07, high - low, 0.07], { at: [x, (high + low) / 2, z], colour: STEEL })
    into.box([0.24, 0.22, 0.075], {
      at: [Math.max(minX + 0.13, Math.min(maxX - 0.13, x)), low + 0.08, z],
      colour: EDGE,
    })
    if (index === bays) continue
    const angle = Math.atan2(high - low, step) * (index % 2 ? -1 : 1)
    into.box([Math.hypot(step, high - low), 0.075, 0.075], {
      at: [x + step / 2, (high + low) / 2, z],
      rotation: [0, 0, angle],
      colour: STEEL,
    })
  }
  for (const x of [minX + 0.17, maxX - 0.17]) {
    into.box([0.34, 1.2, 0.32], { at: [x, top - 0.6, z], colour: DARK })
    into.box([0.42, 0.08, 0.4], { at: [x, low - 0.1, z], colour: EDGE })
  }
}

/** Open grating, with crossbars through which the trusses remain visible from below. */
export function catwalk(
  into: BanquetDetailBuilder,
  options: {
    x: number
    span: [number, number]
    y: number
    ceiling: number
  },
): void {
  const {
    x,
    span: [minZ, maxZ],
    y,
    ceiling,
  } = options
  const length = maxZ - minZ,
    z = (minZ + maxZ) / 2
  for (const side of [-0.42, 0.42]) {
    into.box([0.07, 0.12, length], { at: [x + side, y - 0.03, z], colour: DARK })
    for (const rise of [0.5, 0.95]) {
      into.box([0.035, 0.035, length], { at: [x + side, y + rise, z], colour: STEEL })
    }
    for (let pz = minZ + 2; pz < maxZ; pz += 3.5) {
      into.box([0.035, 0.95, 0.035], { at: [x + side, y + 0.475, pz], colour: STEEL })
      const drop = ceiling - y - 0.95
      into.box([0.035, drop, 0.035], { at: [x + side, ceiling - drop / 2, pz], colour: STEEL })
    }
  }
  for (let pz = minZ + 0.05; pz < maxZ; pz += 0.24) {
    into.box([0.82, 0.04, 0.045], { at: [x, y, pz], colour: EDGE })
  }
  for (const pz of [minZ + 0.08, maxZ - 0.08]) {
    into.box([1, 0.35, 0.16], { at: [x, y - 0.15, pz], colour: DARK })
  }
}
