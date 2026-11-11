import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import { sourceBoundStyleFor, type SourceBoundInteriorStyle } from './sourceBoundInteriorStyles'
import type { Space, Structure } from './types'

interface Bounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  width: number
  depth: number
  centreX: number
  centreZ: number
}

const boundsOf = (space: Space): Bounds => {
  const xs = space.footprint.map(([x]) => x)
  const zs = space.footprint.map(([, z]) => z)
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minZ = Math.min(...zs),
    maxZ = Math.max(...zs)
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: maxX - minX,
    depth: maxZ - minZ,
    centreX: (minX + maxX) / 2,
    centreZ: (minZ + maxZ) / 2,
  }
}

const countAcross = (length: number, spacing: number): number =>
  Math.max(1, Math.min(7, Math.floor(length / spacing)))

function dressFloor(
  into: BanquetDetailBuilder,
  bounds: Bounds,
  floor: number,
  style: SourceBoundInteriorStyle,
): void {
  const insetWidth = Math.max(0.2, bounds.width - 0.32)
  const insetDepth = Math.max(0.2, bounds.depth - 0.32)
  into.box([insetWidth, 0.018, insetDepth], {
    at: [bounds.centreX, floor + 0.012, bounds.centreZ],
    colour: style.floor,
  })

  const spacing = style.floorPattern === 'plates' ? 2.4 : style.floorPattern === 'grid' ? 1.8 : 3.2
  const xCount = countAcross(bounds.width, spacing)
  const zCount = countAcross(bounds.depth, spacing)
  for (let index = 1; index < xCount; index++) {
    const x = bounds.minX + (bounds.width * index) / xCount
    into.box([0.025, 0.022, insetDepth], {
      at: [x, floor + 0.025, bounds.centreZ],
      colour: style.accent,
    })
  }
  if (style.floorPattern !== 'bands') {
    for (let index = 1; index < zCount; index++) {
      const z = bounds.minZ + (bounds.depth * index) / zCount
      into.box([insetWidth, 0.022, 0.025], {
        at: [bounds.centreX, floor + 0.025, z],
        colour: style.accent,
      })
    }
  }
}

function dressWalls(
  into: BanquetDetailBuilder,
  bounds: Bounds,
  floor: number,
  style: SourceBoundInteriorStyle,
): void {
  const y = floor + 0.17
  into.box([bounds.width, 0.32, 0.08], {
    at: [bounds.centreX, y, bounds.minZ + 0.05],
    colour: style.wall,
  })
  into.box([bounds.width, 0.32, 0.08], {
    at: [bounds.centreX, y, bounds.maxZ - 0.05],
    colour: style.wall,
  })
  into.box([0.08, 0.32, bounds.depth], {
    at: [bounds.minX + 0.05, y, bounds.centreZ],
    colour: style.wall,
  })
  into.box([0.08, 0.32, bounds.depth], {
    at: [bounds.maxX - 0.05, y, bounds.centreZ],
    colour: style.wall,
  })
}

function dressCeiling(
  into: BanquetDetailBuilder,
  bounds: Bounds,
  floor: number,
  ceiling: number,
  style: SourceBoundInteriorStyle,
): void {
  const y = floor + ceiling - 0.12
  const count = countAcross(bounds.width, style.ceilingPattern === 'coffers' ? 3.4 : 2.6)
  for (let index = 1; index <= count; index++) {
    const x = bounds.minX + (bounds.width * index) / (count + 1)
    into.box([0.12, 0.18, Math.max(0.2, bounds.depth - 0.2)], {
      at: [x, y, bounds.centreZ],
      colour: style.ceiling,
    })
  }
  if (style.ceilingPattern !== 'beams') {
    const serviceZ = bounds.minZ + Math.min(0.45, bounds.depth * 0.2)
    into.box([Math.max(0.2, bounds.width - 0.3), 0.1, 0.18], {
      at: [bounds.centreX, y - 0.12, serviceZ],
      colour: style.metal,
    })
  }
  const lights = countAcross(bounds.width, 4)
  for (let index = 1; index <= lights; index++) {
    const x = bounds.minX + (bounds.width * index) / (lights + 1)
    into.box([0.75, 0.06, 0.22], {
      at: [x, y - 0.14, bounds.centreZ],
      colour: style.accent,
      glow: true,
    })
  }
}

const rotationOf = (structure: Structure): number => ((structure.rotation ?? 0) * Math.PI) / 180

function localPoint(structure: Structure, x: number, z: number): readonly [number, number] {
  const angle = rotationOf(structure)
  return [
    structure.at[0] + x * Math.cos(angle) + z * Math.sin(angle),
    structure.at[1] - x * Math.sin(angle) + z * Math.cos(angle),
  ]
}

function boxOn(
  into: BanquetDetailBuilder,
  structure: Structure,
  size: readonly [number, number, number],
  options: {
    floor: number
    y: number
    x?: number
    z?: number
    colour: number
  },
): void {
  const [x, z] = localPoint(structure, options.x ?? 0, options.z ?? 0)
  into.box(size, {
    at: [x, options.floor + structure.base + options.y, z],
    colour: options.colour,
    rotation: [0, rotationOf(structure), 0],
  })
}

function dressBed(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
  style: SourceBoundInteriorStyle,
): void {
  const [width, depth] = structure.size
  boxOn(into, structure, [width, 0.24, depth], { floor, y: 0.2, colour: style.wood })
  boxOn(into, structure, [width * 0.92, 0.2, depth * 0.92], {
    floor,
    y: 0.41,
    colour: style.fabric,
  })
  boxOn(into, structure, [width * 0.72, 0.12, depth * 0.2], {
    floor,
    y: 0.56,
    z: -depth * 0.3,
    colour: 0xc8c2b4,
  })
  boxOn(into, structure, [width, Math.max(0.35, structure.height * 0.45), 0.12], {
    floor,
    y: Math.max(0.35, structure.height * 0.45) / 2,
    z: -depth * 0.46,
    colour: style.wood,
  })
}

function dressCabinet(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
  style: SourceBoundInteriorStyle,
): void {
  const [width, depth] = structure.size
  const height = Math.max(0.5, structure.height)
  boxOn(into, structure, [width, height, depth], {
    floor,
    y: height / 2,
    colour: style.wood,
  })
  boxOn(into, structure, [0.025, height * 0.84, depth + 0.015], {
    floor,
    y: height * 0.53,
    colour: style.metal,
  })
  for (const x of [-width * 0.18, width * 0.18]) {
    boxOn(into, structure, [0.035, 0.18, 0.04], {
      floor,
      y: height * 0.52,
      x,
      z: -depth * 0.51,
      colour: style.accent,
    })
  }
}

function dressTable(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
  style: SourceBoundInteriorStyle,
): void {
  const [width, depth] = structure.size
  const height = Math.max(0.5, structure.height)
  boxOn(into, structure, [width, 0.12, depth], {
    floor,
    y: height - 0.06,
    colour: style.wood,
  })
  for (const x of [-width * 0.38, width * 0.38]) {
    for (const z of [-depth * 0.34, depth * 0.34]) {
      boxOn(into, structure, [0.1, height - 0.12, 0.1], {
        floor,
        y: (height - 0.12) / 2,
        x,
        z,
        colour: style.metal,
      })
    }
  }
}

function dressSeat(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
  style: SourceBoundInteriorStyle,
): void {
  const [width, depth] = structure.size
  const height = Math.max(0.65, structure.height)
  boxOn(into, structure, [width, 0.14, depth], {
    floor,
    y: Math.min(0.48, height * 0.48),
    colour: style.fabric,
  })
  boxOn(into, structure, [width, height * 0.52, 0.12], {
    floor,
    y: height * 0.7,
    z: depth * 0.42,
    colour: style.fabric,
  })
  for (const x of [-width * 0.36, width * 0.36]) {
    for (const z of [-depth * 0.32, depth * 0.32]) {
      boxOn(into, structure, [0.07, 0.42, 0.07], {
        floor,
        y: 0.21,
        x,
        z,
        colour: style.metal,
      })
    }
  }
}

function dressStructure(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
  style: SourceBoundInteriorStyle,
): void {
  if (structure.kind === 'bed') dressBed(into, structure, floor, style)
  else if (structure.kind === 'cabinet') dressCabinet(into, structure, floor, style)
  else if (structure.kind === 'table' || structure.kind === 'counter')
    dressTable(into, structure, floor, style)
  else if (structure.kind === 'seat') dressSeat(into, structure, floor, style)
  else {
    const height = Math.max(0.08, structure.height)
    boxOn(into, structure, [structure.size[0], height, structure.size[1]], {
      floor,
      y: height / 2,
      colour: style.metal,
    })
  }
}

export function sourceBoundInteriorSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal) return plan
  const detailedSpaces = new Set(
    plan.spaces.filter((space) => sourceBoundStyleFor(space.locationId)).map(({ id }) => id),
  )
  if (!detailedSpaces.size) return plan
  return {
    ...plan,
    structures: plan.structures.filter(({ spaceId }) => !detailedSpaces.has(spaceId)),
  }
}

export function buildSourceBoundInteriorDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  const style = sourceBoundStyleFor(space?.locationId)
  if (!space || !style) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const bounds = boundsOf(space)
  dressFloor(into, bounds, floor, style)
  dressWalls(into, bounds, floor, style)
  dressCeiling(into, bounds, floor, ceilingOf(space, plan.tier), style)
  for (const structure of plan.structures.filter((item) => item.spaceId === spaceId)) {
    dressStructure(into, structure, floor, style)
  }
  return into.finish(`source-bound-${style.name}`)
}
