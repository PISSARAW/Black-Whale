import type * as Three from 'three'
import { BanquetDetailBuilder, disposeBanquetDetails } from './banquetDetailBuilder'
import {
  SPIRAL_CENTRE,
  SPIRAL_GATE_HEIGHT,
  SPIRAL_GATE_WIDTH,
  SPIRAL_INNER_RADIUS,
  SPIRAL_OUTER_RADIUS,
  SPIRAL_RUN,
} from './casinoSpiralLayout'
import {
  spiralAngle,
  spiralPoint,
  spiralTreadFloor,
  type SpiralLanding,
  type SpiralPath,
} from './casinoSpiralWalk'

const STONE = 0xa69b89
const PLASTER = 0x776b62
const BRASS = 0xb69861
const RAIL = 0x454449
const SHAFT_RADIUS = 1.8

function westWall(
  into: BanquetDetailBuilder,
  path: SpiralPath,
  bounds: { bottom: number; top: number },
) {
  const [x, z] = SPIRAL_CENTRE
  const near = z - SHAFT_RADIUS
  const far = z + SHAFT_RADIUS
  const wall = (y0: number, y1: number, span: readonly [number, number]) =>
    into.box([0.07, y1 - y0, span[1] - span[0]], {
      at: [x - SPIRAL_RUN + 0.035, (y0 + y1) / 2, (span[0] + span[1]) / 2],
      colour: PLASTER,
    })
  wall(bounds.bottom, path.lower.floor, [near, far])
  wall(path.lower.floor + SPIRAL_GATE_HEIGHT, path.upper.floor, [near, far])
  wall(path.upper.floor + SPIRAL_GATE_HEIGHT, bounds.top, [near, far])
  for (const landing of [path.lower, path.upper]) {
    wall(landing.floor, landing.floor + SPIRAL_GATE_HEIGHT, [
      near,
      landing.at[1] - SPIRAL_GATE_WIDTH / 2,
    ])
    wall(landing.floor, landing.floor + SPIRAL_GATE_HEIGHT, [
      landing.at[1] + SPIRAL_GATE_WIDTH / 2,
      far,
    ])
  }
}

function shaft(into: BanquetDetailBuilder, path: SpiralPath) {
  const [x, z] = SPIRAL_CENTRE
  const bottom = path.lower.floor - 0.34
  const top = path.upper.floor + 4.6
  const height = top - bottom
  const centre = [(x - SPIRAL_RUN + x + SHAFT_RADIUS) / 2, (top + bottom) / 2, z] as const
  const width = SPIRAL_RUN + SHAFT_RADIUS
  westWall(into, path, { bottom, top })
  into.box([0.07, height, 2 * SHAFT_RADIUS], {
    at: [x + SHAFT_RADIUS - 0.035, centre[1], z],
    colour: PLASTER,
  })
  for (const sign of [-1, 1]) {
    into.box([width, height, 0.07], {
      at: [centre[0], centre[1], z + sign * (SHAFT_RADIUS - 0.035)],
      colour: PLASTER,
    })
  }
  for (const y of [bottom, top]) {
    into.box([width, 0.1, 2 * SHAFT_RADIUS], {
      at: [centre[0], y, z],
      colour: PLASTER,
    })
  }
}

function landingFloor(into: BanquetDetailBuilder, landing: SpiralLanding) {
  const [x, z] = landing.at
  into.box([SPIRAL_RUN, 0.18, SPIRAL_GATE_WIDTH], {
    at: [x + SPIRAL_RUN / 2, landing.floor - 0.09, z],
    colour: STONE,
  })
  for (const offset of [-SPIRAL_GATE_WIDTH / 2, SPIRAL_GATE_WIDTH / 2]) {
    into.box([SPIRAL_RUN, 0.06, 0.045], {
      at: [x + SPIRAL_RUN / 2, landing.floor + 0.94, z + offset],
      colour: BRASS,
    })
    for (const run of [0.12, SPIRAL_RUN - 0.06]) {
      into.box([0.04, 0.94, 0.04], {
        at: [x + run, landing.floor + 0.47, z + offset],
        colour: RAIL,
      })
    }
  }
}

function tread(
  THREE: typeof Three,
  into: BanquetDetailBuilder,
  data: { start: number; end: number; floor: number },
) {
  const { start, end, floor } = data
  const corners = [
    spiralPoint(start, SPIRAL_INNER_RADIUS),
    spiralPoint(start, SPIRAL_OUTER_RADIUS),
    spiralPoint(end, SPIRAL_OUTER_RADIUS),
    spiralPoint(end, SPIRAL_INNER_RADIUS),
  ]
  const shape = new THREE.Shape(corners.map(([x, z]) => new THREE.Vector2(x, -z)))
  into.add(new THREE.ExtrudeGeometry(shape, { bevelEnabled: false, depth: 0.115 }), {
    at: [0, floor - 0.115, 0],
    rotation: [-Math.PI / 2, 0, 0],
    colour: STONE,
  })
  const [x, z] = spiralPoint(start, (SPIRAL_INNER_RADIUS + SPIRAL_OUTER_RADIUS) / 2)
  into.box([SPIRAL_GATE_WIDTH, 0.017, 0.042], {
    at: [x, floor + 0.007, z],
    rotation: [0, -start, 0],
    colour: BRASS,
  })
}

function railing(into: BanquetDetailBuilder, path: SpiralPath, radius: number) {
  const points: [number, number, number][] = []
  const risers = path.steps * 3
  for (let index = 0; index <= risers; index++) {
    const [x, z] = spiralPoint(spiralAngle(index / risers), radius)
    const floor = spiralTreadFloor(path, index / 3)
    points.push([x, floor + 0.95, z])
    if (index % 6 === 0) {
      into.box([0.04, 1.16, 0.04], { at: [x, floor + 0.43, z], colour: RAIL })
    }
  }
  into.curve(points, 0.034, { at: [0, 0, 0], colour: BRASS })
}

export function buildCasinoSpiralView(THREE: typeof Three, path: SpiralPath | null) {
  if (!path) return null
  const into = new BanquetDetailBuilder(THREE)
  shaft(into, path)
  const shaftDrop = path.upper.floor - path.lower.floor
  into.cylinder(
    { radius: 0.16, height: shaftDrop + 2.4 },
    {
      at: [SPIRAL_CENTRE[0], path.lower.floor + (shaftDrop + 2.4) / 2, SPIRAL_CENTRE[1]],
      colour: STONE,
    },
  )
  landingFloor(into, path.upper)
  landingFloor(into, path.lower)
  for (let step = 0; step < path.steps; step++) {
    tread(THREE, into, {
      start: spiralAngle(step / path.steps),
      end: spiralAngle((step + 1) / path.steps),
      floor: spiralTreadFloor(path, step + 1),
    })
  }
  railing(into, path, SPIRAL_INNER_RADIUS)
  railing(into, path, SPIRAL_OUTER_RADIUS)
  for (let y = path.lower.floor + 1.65; y < path.upper.floor; y += 2.6) {
    into.box([0.38, 0.1, 0.12], {
      at: [SPIRAL_CENTRE[0], y, SPIRAL_CENTRE[1] + 1.72],
      colour: 0xffdda3,
      glow: true,
    })
  }
  const root = into.finish('casino-walkable-spiral')
  return { root, dispose: () => disposeBanquetDetails(root) }
}
