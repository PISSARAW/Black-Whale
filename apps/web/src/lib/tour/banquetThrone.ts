import type * as Three from 'three'
import type { Structure } from './types'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import { CARVED, CARVED_SHADE, rosette, scroll } from './banquetOrnaments'

interface ThroneContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  dais: Structure
  floor: number
}

/** Ch. 359, the panel behind Benjamin: rounded shoulders and a carved crest. */
function backProfile(THREE: typeof Three): Three.Shape {
  const shape = new THREE.Shape()
  shape.moveTo(-1.05, 0.62)
  shape.lineTo(-1.05, 1.95)
  shape.bezierCurveTo(-1.3, 2.3, -1.35, 2.8, -0.98, 2.9)
  shape.bezierCurveTo(-0.85, 3.08, -0.4, 2.96, -0.3, 3.16)
  shape.quadraticCurveTo(0, 3.4, 0.3, 3.16)
  shape.bezierCurveTo(0.4, 2.96, 0.85, 3.08, 0.98, 2.9)
  shape.bezierCurveTo(1.35, 2.8, 1.3, 2.3, 1.05, 1.95)
  shape.lineTo(1.05, 0.62)
  shape.closePath()
  return shape
}

function carvedBack({ THREE, into, dais, floor }: ThroneContext): void {
  const [x, z] = dais.at
  const y = floor + dais.height
  const profile = backProfile(THREE)
  const frame = new THREE.ExtrudeGeometry(profile, {
    depth: 0.2,
    bevelEnabled: true,
    bevelSize: 0.045,
    bevelThickness: 0.035,
    bevelSegments: 1,
    curveSegments: 8,
  })
  into.add(frame, { at: [x, y, z - 0.6], colour: CARVED })
  const cushion = new THREE.ExtrudeGeometry(profile, {
    depth: 0.11,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.025,
    bevelSegments: 1,
    curveSegments: 8,
  }).scale(0.84, 0.84, 1)
  into.add(cushion, { at: [x, y + 0.13, z - 0.36], colour: 0x513b40 })
  // The floral crest replaces the unsourced seven crown spikes.
  rosette(into, [x, y + 3.17, z - 0.28], 0.23)
  for (const side of [-1, 1]) {
    scroll(into, { at: [x + side * 0.65, y + 2.88, z - 0.28], size: 0.23, mirror: side })
    scroll(into, { at: [x + side * 1.06, y + 2.61, z - 0.26], size: 0.21, mirror: -side })
    into.curve(
      [
        [side * 1.02, 0.77, 0],
        [side * 1.04, 1.8, 0],
        [side * 1.17, 2.35, 0],
        [side * 1.02, 2.78, 0],
      ],
      0.045,
      { at: [x, y, z - 0.23], colour: CARVED_SHADE },
    )
  }
}

function seatAndArms({ into, dais, floor }: ThroneContext): void {
  const [x, z] = dais.at
  const y = floor + dais.height
  into.box([2.55, 0.17, 1.3], { at: [x, y + 0.63, z + 0.02], colour: CARVED })
  into.sphere([1.15, 0.15, 0.61], { at: [x, y + 0.77, z + 0.05], colour: 0x513b40 })
  for (const side of [-1, 1]) {
    for (const depth of [-0.43, 0.47]) {
      into.curve(
        [
          [side * 1.01, 0.6, depth],
          [side * 1.14, 0.36, depth + 0.04],
          [side * 1.02, 0.14, depth + 0.06],
          [side * 1.18, 0.065, depth + 0.09],
        ],
        0.085,
        { at: [x, y, z], colour: CARVED },
      )
    }
    into.curve(
      [
        [side * 1.07, 0.72, 0.48],
        [side * 1.23, 1.0, 0.55],
        [side * 1.2, 1.25, 0.47],
        [side * 1.16, 1.31, -0.36],
      ],
      0.11,
      { at: [x, y, z], colour: CARVED },
    )
    scroll(into, { at: [x + side * 1.13, y + 1.13, z + 0.58], size: 0.15, mirror: side })
    rosette(into, [x + side * 1.13, y + 0.58, z + 0.69], 0.1)
  }
}

/** The little round pedestal table visible beside the seated king in ch. 359. */
function royalTable({ into, dais, floor }: ThroneContext): void {
  const [x, z] = [dais.at[0] - 1.93, dais.at[1] + 0.23]
  const y = floor + dais.height
  into.cylinder({ radius: 0.7, height: 0.12, sides: 32 }, { at: [x, y + 0.98, z], colour: CARVED })
  into.cylinder(
    { radius: 0.65, height: 0.035, sides: 32 },
    { at: [x, y + 1.06, z], colour: 0x85745c },
  )
  into.cylinder(
    { radius: 0.13, bottom: 0.2, height: 0.73 },
    { at: [x, y + 0.52, z], colour: CARVED },
  )
  for (let foot = 0; foot < 3; foot++) {
    const angle = (foot * Math.PI * 2) / 3
    const path: Point3[] = [
      [0, 0.35, 0],
      [Math.cos(angle) * 0.22, 0.14, Math.sin(angle) * 0.22],
      [Math.cos(angle) * 0.53, 0.06, Math.sin(angle) * 0.53],
    ]
    into.curve(path, 0.075, { at: [x, y, z], colour: CARVED })
  }
  into.cylinder({ radius: 0.18, height: 0.025 }, { at: [x, y + 1.1, z], colour: 0xe2ded0 })
}

export function dressBanquetThrone(context: ThroneContext): void {
  carvedBack(context)
  seatAndArms(context)
  royalTable(context)
}
