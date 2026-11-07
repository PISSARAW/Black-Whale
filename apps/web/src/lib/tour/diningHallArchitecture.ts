import type * as Three from 'three'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import type { Space } from './types'

export const STEEL = 0x5a5c60
export const DARK_STEEL = 0x3d3f44
export const RIVET_STEEL = 0x76787d
export const CATWALK = 0x494b50
export const LAMP_GLOW = 0xffeab3
export const LAMP_CAGE = 0x2d2e30

interface DiningArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

function boundsOfFootprint(space: Space) {
  const xs = space.footprint.map(([x]) => x)
  const zs = space.footprint.map(([, z]) => z)
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
  }
}

interface TrussOptions {
  z: number
  span: [number, number]
  top: number
}

/** Open-web steel roof trusses spanning the 31.5 m refectory below the 9 m ceiling. */
function roofTruss(into: BanquetDetailBuilder, options: TrussOptions) {
  const { z, span, top } = options
  const [minX, maxX] = span
  const width = maxX - minX
  const midX = (minX + maxX) / 2
  const bottomY = top - 0.95
  const topY = top - 0.15

  // Upper and lower chords
  into.box([width, 0.12, 0.16], { at: [midX, topY, z], colour: STEEL })
  into.box([width, 0.1, 0.14], { at: [midX, bottomY, z], colour: DARK_STEEL })

  // Vertical web posts and diagonals every 3.5 metres
  const step = 3.5
  const count = Math.floor(width / step)
  for (let index = 0; index <= count; index++) {
    const px = minX + index * step
    into.box([0.08, 0.7, 0.08], { at: [px, (topY + bottomY) / 2, z], colour: STEEL })
    if (index < count) {
      const nextX = px + step
      const diagMidX = (px + nextX) / 2
      const diagLen = Math.hypot(step, topY - bottomY)
      const angle = Math.atan2(topY - bottomY, step) * (index % 2 === 0 ? 1 : -1)
      into.box([diagLen, 0.06, 0.06], {
        at: [diagMidX, (topY + bottomY) / 2, z],
        rotation: [0, 0, angle],
        colour: DARK_STEEL,
      })
    }
  }
}

interface CatwalkOptions {
  x: number
  span: [number, number]
  y: number
}

/** Longitudinal maintenance catwalks with open grating and safety rails. */
function catwalk(into: BanquetDetailBuilder, options: CatwalkOptions) {
  const { x, span, y } = options
  const [minZ, maxZ] = span
  const length = maxZ - minZ
  const midZ = (minZ + maxZ) / 2

  // Grated walkway platform
  into.box([0.9, 0.06, length], { at: [x, y, midZ], colour: CATWALK })

  // Tubular railings on both sides
  for (const side of [-0.42, 0.42]) {
    into.box([0.04, 0.04, length], { at: [x + side, y + 0.95, midZ], colour: STEEL })
    into.box([0.03, 0.03, length], { at: [x + side, y + 0.5, midZ], colour: STEEL })
    for (let pz = minZ + 2; pz < maxZ; pz += 3.5) {
      into.box([0.04, 0.95, 0.04], { at: [x + side, y + 0.475, pz], colour: STEEL })
    }
  }
}

/** Hanging industrial cage lamps suspended from the trusses. */
function industrialLamp(options: { into: BanquetDetailBuilder; at: Point3; cordHeight: number }) {
  const { into, at, cordHeight } = options
  const [x, y, z] = at

  // Suspension rod
  into.cylinder(
    { radius: 0.015, height: cordHeight },
    { at: [x, y + cordHeight / 2, z], colour: LAMP_CAGE },
  )
  // Industrial reflector hood
  into.cylinder(
    { radius: 0.35, bottom: 0.12, height: 0.18, sides: 12 },
    { at: [x, y, z], colour: STEEL },
  )
  // Wire protective cage
  into.cylinder(
    { radius: 0.16, height: 0.22, sides: 8, open: true },
    { at: [x, y - 0.15, z], colour: LAMP_CAGE },
  )
  // Glowing warm bulb
  into.sphere([0.09, 0.12, 0.09], { at: [x, y - 0.12, z], colour: LAMP_GLOW, glow: true })
}

/** Sheet metal duct collars and vertical suspension rods. */
function dressDucts(context: DiningArchitectureContext, floor: number, ceiling: number) {
  const { into, plan, space } = context
  const ducts = plan.structures.filter(
    (solid) => solid.spaceId === space.id && solid.kind === 'duct',
  )
  for (const duct of ducts) {
    const [x, z] = duct.at
    const y = floor + duct.base + duct.height / 2
    const halfWidth = duct.size[0] / 2
    for (let dx = -halfWidth + 2; dx < halfWidth; dx += 4) {
      // Flanged connection band
      into.box([0.14, duct.height + 0.06, duct.size[1] + 0.06], {
        at: [x + dx, y, z],
        colour: RIVET_STEEL,
      })
      // Vertical hanger rod up to ceiling
      const rodHeight = ceiling - (floor + duct.base + duct.height)
      into.cylinder(
        { radius: 0.02, height: rodHeight },
        {
          at: [x + dx, ceiling - rodHeight / 2, z],
          colour: DARK_STEEL,
        },
      )
    }
  }
}

/** Steel plate column collars and top gusset brackets. */
function dressPillars(context: DiningArchitectureContext, floor: number, ceiling: number) {
  const { into, plan, space } = context
  for (const [x, z] of plan.columns.get(space.id) ?? []) {
    // Riveted base reinforcement
    into.box([1.4, 0.6, 1.4], { at: [x, floor + 0.3, z], colour: DARK_STEEL })
    into.box([1.46, 0.08, 1.46], { at: [x, floor + 0.62, z], colour: RIVET_STEEL })

    // Mid-level protective belt
    into.box([1.34, 0.12, 1.34], { at: [x, floor + 2.2, z], colour: RIVET_STEEL })

    // Top structural brackets under roof girders
    for (const [dx, dz] of [
      [-0.65, 0],
      [0.65, 0],
      [0, -0.65],
      [0, 0.65],
    ]) {
      into.box([0.16, 0.8, 0.4], {
        at: [x + dx, ceiling - 0.7, z + dz],
        colour: STEEL,
      })
    }
  }
}

export function dressDiningHallArchitecture(context: DiningArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const ceiling = floor + ceilingOf(space, plan.tier)
  const bounds = boundsOfFootprint(space)

  // 1. Spanning roof trusses every 4.5 metres along Z
  const trussZs = [14.5, 19.0, 23.5, 28.0, 32.5, 37.0, 40.5]
  for (const z of trussZs) {
    roofTruss(into, { z, span: [bounds.minX, bounds.maxX], top: ceiling })
  }

  // 2. Two service catwalks running along X = 23 and X = 37
  catwalk(into, { x: 23.5, span: [bounds.minZ, bounds.maxZ], y: ceiling - 1.35 })
  catwalk(into, { x: 37.5, span: [bounds.minZ, bounds.maxZ], y: ceiling - 1.35 })

  // 3. Industrial pendant lamps beneath the catwalks and trusses
  for (const z of [16.5, 21.0, 25.5, 30.0, 34.5, 39.0]) {
    for (const x of [20.0, 29.75, 39.5]) {
      industrialLamp({ into, at: [x, ceiling - 1.6, z], cordHeight: 1.4 })
    }
  }

  // 4. Detailed ducts & structural pillars
  dressDucts(context, floor, ceiling)
  dressPillars(context, floor, ceiling)

  // 5. Perimeter protective steel dado plinth (0.45 m high)
  const widthX = bounds.maxX - bounds.minX
  const lengthZ = bounds.maxZ - bounds.minZ
  into.box([widthX, 0.45, 0.08], {
    at: [(bounds.minX + bounds.maxX) / 2, floor + 0.225, bounds.minZ + 0.04],
    colour: DARK_STEEL,
  })
  into.box([widthX, 0.45, 0.08], {
    at: [(bounds.minX + bounds.maxX) / 2, floor + 0.225, bounds.maxZ - 0.04],
    colour: DARK_STEEL,
  })
  into.box([0.08, 0.45, lengthZ], {
    at: [bounds.minX + 0.04, floor + 0.225, (bounds.minZ + bounds.maxZ) / 2],
    colour: DARK_STEEL,
  })
  into.box([0.08, 0.45, lengthZ], {
    at: [bounds.maxX - 0.04, floor + 0.225, (bounds.minZ + bounds.maxZ) / 2],
    colour: DARK_STEEL,
  })

  // 6. Buor toll passage guide stanchions and guard station (ch. 358)
  passageBarrier({ into, floor, z: bounds.minZ + 0.4 })
  passageBarrier({ into, floor, z: bounds.maxZ - 0.4 })
  into.box([0.6, 1.05, 0.45], {
    at: [27.5, floor + 0.525, bounds.minZ + 0.8],
    colour: DARK_STEEL,
  })

  // 7. Overhead electrical cable trays beneath the trusses
  cableTrays(into, [bounds.minZ, bounds.maxZ], ceiling - 0.7)

  // 8. Chapter 378 service wall fixtures: PA speaker, vertical drop duct and kitchen window
  dressChapter378Fixtures({ into, floor, ceiling, minX: bounds.minX })
}

interface Ch378FixturesOptions {
  into: BanquetDetailBuilder
  floor: number
  ceiling: number
  minX: number
}

function dressChapter378Fixtures(options: Ch378FixturesOptions): void {
  const { into, floor, ceiling, minX } = options

  // Wall-mounted PA loudspeaker box with circular speaker cone & electrical conduit
  const speakerY = floor + 4.8
  into.box([0.16, 0.45, 0.35], { at: [minX + 0.1, speakerY, 17.5], colour: DARK_STEEL })
  into.cylinder(
    { radius: 0.12, height: 0.04, sides: 12 },
    { at: [minX + 0.18, speakerY, 17.5], rotation: [0, 0, Math.PI / 2], colour: 0x1f2124 },
  )
  const conduitHeight = ceiling - (speakerY + 0.225)
  into.cylinder(
    { radius: 0.018, height: conduitHeight, sides: 6 },
    { at: [minX + 0.1, ceiling - conduitHeight / 2, 17.5], colour: STEEL },
  )

  // Vertical cylindrical drop duct descending from ceiling behind counter
  into.cylinder(
    { radius: 0.34, height: 3.2, sides: 16 },
    { at: [minX + 0.42, ceiling - 1.6, 23.5], colour: STEEL },
  )
  into.cylinder(
    { radius: 0.37, height: 0.07, sides: 16 },
    { at: [minX + 0.42, ceiling - 1.1, 23.5], colour: RIVET_STEEL },
  )
  into.cylinder(
    { radius: 0.37, height: 0.07, sides: 16 },
    { at: [minX + 0.42, ceiling - 2.6, 23.5], colour: RIVET_STEEL },
  )

  // Kitchen observation window in service wall
  into.box([0.05, 1.4, 0.95], { at: [minX + 0.04, floor + 2.8, 30.5], colour: STEEL })
  into.box([0.02, 1.3, 0.85], { at: [minX + 0.06, floor + 2.8, 30.5], colour: 0x88aab8 })
}

interface BarrierOptions {
  into: BanquetDetailBuilder
  floor: number
  z: number
}

function passageBarrier(options: BarrierOptions) {
  const { into, floor, z } = options
  for (const x of [28.25, 31.25]) {
    into.cylinder({ radius: 0.04, height: 1.0, sides: 8 }, { at: [x, floor + 0.5, z], colour: STEEL })
    into.cylinder({ radius: 0.1, height: 0.03, sides: 8 }, { at: [x, floor + 0.015, z], colour: DARK_STEEL })
  }
}

function cableTrays(into: BanquetDetailBuilder, spanZ: [number, number], y: number) {
  const [minZ, maxZ] = spanZ
  const lengthZ = maxZ - minZ
  const midZ = (minZ + maxZ) / 2
  for (const x of [19.0, 40.5]) {
    into.box([0.3, 0.05, lengthZ], { at: [x, y, midZ], colour: DARK_STEEL })
    into.box([0.18, 0.03, lengthZ], { at: [x, y + 0.03, midZ], colour: 0x222428 })
  }
}

