import type * as Three from 'three'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { floorPatternOf } from './floorPattern'
import { dressRoyalSalonFloor } from './royalSalonFloor'
import { dressRoyalSalonGallery } from './royalSalonGallery'
import type { Space } from './types'
import { SALON_GOLD, SALON_STONE, SALON_WOOD, SalonSurface } from './royalSalonDetailSurface'

interface Architecture {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

function patch(context: Architecture, points: readonly Point3[], colour: number): void {
  const geometry = new context.THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new context.THREE.Float32BufferAttribute(
      [...points[0], ...points[1], ...points[2], ...points[0], ...points[2], ...points[3]],
      3,
    ),
  )
  geometry.computeVertexNormals()
  context.into.add(geometry, { at: [0, 0, 0], colour })
}

/** Shallow barrel vault; the 7 m maximum stays that of the walked room. */
function vault(context: Architecture): void {
  const { space, plan } = context
  const xs = space.footprint.map(([x]) => x),
    zs = space.footprint.map(([, z]) => z)
  const minX = Math.min(...xs),
    maxX = Math.max(...xs)
  const minZ = Math.min(...zs),
    maxZ = Math.max(...zs)
  const centre = (minX + maxX) / 2,
    radius = (maxX - minX) / 2
  const top = floorOf(space, plan.tier) + ceilingOf(space, plan.tier) - 0.025
  const rise = 2.2
  const point = (angle: number, z: number, inset = 0): Point3 => [
    centre + (radius - inset) * Math.sin(angle),
    top - rise + (rise - inset) * Math.cos(angle),
    z,
  ]
  const strip = (angles: [number, number], span: [number, number], trim: boolean) => {
    const segments = Math.max(1, Math.ceil((angles[1] - angles[0]) * 20))
    for (let index = 0; index < segments; index++) {
      const a = angles[0] + ((angles[1] - angles[0]) * index) / segments
      const b = angles[0] + ((angles[1] - angles[0]) * (index + 1)) / segments
      patch(
        context,
        [
          point(a, span[0], trim ? 0.07 : 0),
          point(b, span[0], trim ? 0.07 : 0),
          point(b, span[1], trim ? 0.07 : 0),
          point(a, span[1], trim ? 0.07 : 0),
        ],
        trim ? SALON_STONE : 0x706a5e,
      )
    }
  }
  strip([-Math.PI / 2, Math.PI / 2], [minZ, maxZ], false)
  // Recessed panels framed in both directions, rather than flat ceiling squares.
  for (let row = 0; row <= 8; row++) {
    const z = minZ + ((maxZ - minZ) * row) / 8
    strip([-Math.PI / 2, Math.PI / 2], [Math.max(minZ, z - 0.075), Math.min(maxZ, z + 0.075)], true)
  }
  for (let rib = 1; rib < 12; rib++) {
    const angle = -Math.PI / 2 + (Math.PI * rib) / 12
    strip([angle - 0.012, angle + 0.012], [minZ, maxZ], true)
  }
}

function wallMouldings(context: Architecture): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)
  for (const run of banquetWallRuns(plan, space)) {
    for (const [y, height, depth] of [
      [0.16, 0.24, 0.1],
      [0.9, 0.06, 0.09],
      [4.4, 0.09, 0.14],
      [4.63, 0.16, 0.23],
    ]) {
      into.box([run.length, height, depth], {
        at: wallPoint(run, { along: run.length / 2, y: floor + y, inset: depth / 2 }),
        rotation: [0, run.angle, 0],
        colour: SALON_STONE,
      })
    }
    const count = Math.floor(run.length / 1.4)
    for (let index = 0; index < count; index++) {
      into.box([0.045, 0.52, 0.055], {
        at: wallPoint(run, { along: ((index + 0.5) * run.length) / count, y: floor + 0.55 }),
        rotation: [0, run.angle, 0],
        colour: SALON_GOLD,
      })
    }
  }
}

function piers(context: Architecture): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)
  for (const pillar of plan.structures.filter(
    (item) => item.spaceId === space.id && item.kind === 'pillar',
  )) {
    const face = new SalonSurface(into, pillar, floor)
    const h = pillar.height
    for (const [y, height, width] of [
      [0.11, 0.2, 0.73],
      [0.32, 0.12, 0.69],
      [h - 0.22, 0.16, 0.73],
      [h - 0.06, 0.1, 0.75],
    ]) {
      face.box([width, height, width], [0, y, 0], SALON_STONE)
    }
    // Broad pale piers with dark inset plaques, as in the establishing spread.
    face.box([0.755, h - 0.7, 0.65], [0, h / 2, 0], SALON_STONE)
    const inward = pillar.at[0] > 0 ? -1 : 1
    face.box([0.025, 0.42, 0.4], [inward * 0.39, 3.95, 0], SALON_WOOD)
    const x = pillar.at[0] + inward * 0.43,
      z = pillar.at[1]
    into.sphere([0.06, 0.12, 0.06], { at: [x, floor + 3.3, z], colour: SALON_GOLD })
    for (const side of [-1, 1]) {
      into.curve(
        [
          [x, floor + 3.28, z],
          [x + inward * 0.2, floor + 3.3, z + side * 0.16],
          [x + inward * 0.22, floor + 3.5, z + side * 0.2],
        ],
        0.023,
        { at: [0, 0, 0], colour: SALON_GOLD },
      )
      into.sphere([0.05, 0.09, 0.05], {
        at: [x + inward * 0.22, floor + 3.59, z + side * 0.2],
        colour: 0xf2dfb7,
        glow: true,
      })
    }
  }
}

function inlay(context: Architecture): void {
  const { into, space, plan } = context
  const y = floorOf(space, plan.tier) + 0.009
  for (const [from, to] of floorPatternOf(space)?.segments ?? []) {
    const dx = to[0] - from[0],
      dz = to[1] - from[1]
    into.box([Math.hypot(dx, dz), 0.009, 0.075], {
      at: [(from[0] + to[0]) / 2, y, (from[1] + to[1]) / 2],
      rotation: [0, -Math.atan2(dz, dx), 0],
      colour: 0x38352e,
    })
  }
}

export function dressRoyalSalonArchitecture(context: Architecture): void {
  vault(context)
  wallMouldings(context)
  piers(context)
  inlay(context)
  dressRoyalSalonFloor(context)
  dressRoyalSalonGallery(context)
}
