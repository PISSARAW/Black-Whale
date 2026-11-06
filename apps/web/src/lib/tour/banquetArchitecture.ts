import type * as Three from 'three'
import type { TierPlan } from './blueprint'
import type { Point3 } from './banquetDetailBuilder'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { lampsOf, lamplightOf } from './light'
import { ceilingOf, floorOf } from './blueprint'

const IVORY = 0xc5c1af
const GOLD = 0x9b8256
const SHADOW = 0x77776d

function coffer(into: BanquetDetailBuilder, at: Point3, span: number): void {
  const [x, y, z] = at
  for (const side of [-1, 1]) {
    into.box([span, 0.12, 0.12], { at: [x, y, z + (side * span) / 2], colour: IVORY })
    into.box([0.12, 0.12, span], { at: [x + (side * span) / 2, y, z], colour: IVORY })
    into.box([span - 0.4, 0.055, 0.045], {
      at: [x, y + 0.045, z + side * (span / 2 - 0.2)],
      colour: GOLD,
    })
    into.box([0.045, 0.055, span - 0.4], {
      at: [x + side * (span / 2 - 0.2), y + 0.045, z],
      colour: GOLD,
    })
  }
}

/** Tiered crystal baskets seen above the tables in chapters 358–359 and 362. */
function chandelier(options: {
  THREE: typeof Three
  into: BanquetDetailBuilder
  at: Point3
}): void {
  const {
    THREE,
    into,
    at: [x, y, z],
  } = options
  into.cylinder({ radius: 0.028, height: 0.72, sides: 8 }, { at: [x, y - 0.36, z], colour: GOLD })
  into.cylinder(
    { radius: 0.26, bottom: 0.12, height: 0.12 },
    { at: [x, y - 0.08, z], colour: GOLD },
  )
  for (let tier = 0; tier < 3; tier++) {
    const radius = 0.85 - tier * 0.22
    const ringY = y - 0.84 - tier * 0.28
    into.ring(
      { radius, tube: 0.035 },
      { at: [x, ringY, z], rotation: [Math.PI / 2, 0, 0], colour: GOLD },
    )
    for (let drop = 0; drop < 12; drop++) {
      const angle = (drop * Math.PI) / 6
      const px = x + Math.cos(angle) * radius
      const pz = z + Math.sin(angle) * radius
      into.cylinder(
        { radius: 0.008, height: 0.26, sides: 4 },
        { at: [px, ringY - 0.13, pz], colour: IVORY },
      )
      into.add(new THREE.OctahedronGeometry(0.075).scale(0.7, 1.9, 0.7), {
        at: [px, ringY - 0.3, pz],
        colour: drop % 3 ? 0xe0d8b9 : 0xffebba,
        glow: true,
      })
    }
  }
  into.sphere([0.19, 0.23, 0.19], { at: [x, y - 1.63, z], colour: 0xf1dfae, glow: true })
}

/** The round fluted facing follows the tour's existing column positions. */
export function dressBanquetColumn(into: BanquetDetailBuilder, at: Point3, height: number): void {
  const [x, y, z] = at
  into.cylinder(
    { radius: 0.65, height: height - 0.64, sides: 24 },
    { at: [x, y + height / 2, z], colour: IVORY },
  )
  for (const top of [false, true]) {
    const level = top ? y + height - 0.24 : y + 0.24
    into.cylinder({ radius: 0.8, height: 0.18, sides: 24 }, { at: [x, level, z], colour: IVORY })
    into.cylinder(
      { radius: 0.7, height: 0.1, sides: 24 },
      { at: [x, level + (top ? -0.15 : 0.15), z], colour: GOLD },
    )
  }
  for (let flute = 0; flute < 16; flute++) {
    const angle = (flute * Math.PI) / 8
    into.cylinder(
      { radius: 0.018, height: height - 1.05, sides: 5 },
      {
        at: [x + Math.cos(angle) * 0.65, y + height / 2, z + Math.sin(angle) * 0.65],
        colour: SHADOW,
      },
    )
  }
}

export function dressBanquetArchitecture(options: {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  spaceId: string
}): void {
  const { THREE, into, plan, spaceId } = options
  const space = plan.spaces.find((candidate) => candidate.id === spaceId)!
  const floor = floorOf(space, plan.tier)
  const ceiling = floor + ceilingOf(space, plan.tier)
  const light = lamplightOf(space, plan.tier)
  for (const [x, z] of lampsOf(space.footprint, light)) {
    coffer(into, [x, ceiling - 0.15, z], light.spacing * 0.78)
    chandelier({ THREE, into, at: [x, ceiling - 0.2, z] })
  }
  for (const [x, z] of plan.columns.get(spaceId) ?? []) {
    dressBanquetColumn(into, [x, floor, z], ceiling - floor)
  }
  // High cornices follow the actual wall runs, including the vestibule notch.
  // Column faces and furniture faces are not walls to decorate.
  for (const wall of plan.walls.filter(
    (wall) => wall.spaceId === spaceId && !wall.structureId && !wall.jambOf,
  )) {
    const dx = wall.end[0] - wall.start[0],
      dz = wall.end[1] - wall.start[1]
    const length = Math.hypot(dx, dz)
    if (length < 2) continue
    for (const offset of [0.35, 0.62]) {
      into.box([length, 0.12, 0.18], {
        at: [
          (wall.start[0] + wall.end[0]) / 2,
          ceiling - offset,
          (wall.start[1] + wall.end[1]) / 2,
        ],
        rotation: [0, -Math.atan2(dz, dx), 0],
        colour: IVORY,
      })
    }
  }
}
