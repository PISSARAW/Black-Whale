import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import {
  reconstructionTag,
  sourceBoundBoundsOf,
  type SourceBoundRoomContext,
} from './sourceBoundInteriorContext'
import { dressInferredProgramme, dressSourceBoundStructure } from './sourceBoundInteriorFurnishings'
import { sourceBoundStyleFor } from './sourceBoundInteriorStyles'
import type { Space } from './types'

const countAcross = (length: number, spacing: number): number =>
  Math.max(1, Math.min(7, Math.floor(length / spacing)))

function isAxisAlignedRectangle(space: Space): boolean {
  if (space.footprint.length !== 4) return false
  for (let index = 0; index < 4; index++) {
    const start = space.footprint[index]!
    const end = space.footprint[(index + 1) % 4]!
    if (Math.abs(start[0] - end[0]) > 0.001 && Math.abs(start[1] - end[1]) > 0.001) return false
  }
  return true
}

function dressFloor(context: SourceBoundRoomContext): void {
  const { into, space, bounds, floor, style } = context
  const insetWidth = Math.max(0.2, bounds.width - 0.32)
  const insetDepth = Math.max(0.2, bounds.depth - 0.32)
  const envelopeTag = reconstructionTag(context, {
    id: 'floor-envelope',
    name: 'Floor envelope',
    nameFr: 'Emprise du sol',
    layer: 'envelope',
  })
  const finishTag = reconstructionTag(context, {
    id: 'floor-finish',
    name: 'Floor finish',
    nameFr: 'Finition du sol',
    layer: 'finish',
  })
  into.polygon(space.footprint, {
    at: [0, floor + 0.012, 0],
    colour: style.floor,
    tag: envelopeTag,
  })

  if (!isAxisAlignedRectangle(space)) return
  const spacing = style.floorPattern === 'plates' ? 2.4 : style.floorPattern === 'grid' ? 1.8 : 3.2
  const xCount = countAcross(bounds.width, spacing)
  const zCount = countAcross(bounds.depth, spacing)
  for (let index = 1; index < xCount; index++) {
    const x = bounds.minX + (bounds.width * index) / xCount
    into.box([0.025, 0.022, insetDepth], {
      at: [x, floor + 0.025, bounds.centreZ],
      colour: style.accent,
      tag: finishTag,
    })
  }
  if (style.floorPattern === 'bands') return
  for (let index = 1; index < zCount; index++) {
    const z = bounds.minZ + (bounds.depth * index) / zCount
    into.box([insetWidth, 0.022, 0.025], {
      at: [bounds.centreX, floor + 0.025, z],
      colour: style.accent,
      tag: finishTag,
    })
  }
}

function dressWalls(context: SourceBoundRoomContext): void {
  const { into, space, bounds, floor, style } = context
  const tag = reconstructionTag(context, {
    id: 'wall-plinth',
    name: 'Wall plinth',
    nameFr: 'Plinthe murale',
    layer: 'finish',
  })
  for (let index = 0; index < space.footprint.length; index++) {
    const start = space.footprint[index]!
    const end = space.footprint[(index + 1) % space.footprint.length]!
    const dx = end[0] - start[0]
    const dz = end[1] - start[1]
    const length = Math.hypot(dx, dz)
    if (length < 0.1) continue
    const centreX = (start[0] + end[0]) / 2
    const centreZ = (start[1] + end[1]) / 2
    const towardX = bounds.centreX - centreX
    const towardZ = bounds.centreZ - centreZ
    const towardLength = Math.hypot(towardX, towardZ) || 1
    into.box([Math.max(0.05, length - 0.08), 0.32, 0.08], {
      at: [
        centreX + (towardX / towardLength) * 0.06,
        floor + 0.17,
        centreZ + (towardZ / towardLength) * 0.06,
      ],
      colour: style.wall,
      rotation: [0, -Math.atan2(dz, dx), 0],
      tag,
    })
  }
}

function dressCeiling(context: SourceBoundRoomContext): void {
  const { into, space, bounds, floor, ceiling, style } = context
  const y = floor + ceiling - 0.12
  const envelopeTag = reconstructionTag(context, {
    id: 'ceiling-envelope',
    name: 'Ceiling envelope',
    nameFr: 'Emprise du plafond',
    layer: 'envelope',
  })
  const finishTag = reconstructionTag(context, {
    id: 'ceiling-finish',
    name: 'Ceiling finish and services',
    nameFr: 'Finition et équipements du plafond',
    layer: 'finish',
  })
  into.polygon(
    space.footprint,
    { at: [0, floor + ceiling - 0.015, 0], colour: style.ceiling, tag: envelopeTag },
    'down',
  )
  if (!isAxisAlignedRectangle(space)) {
    into.box([0.7, 0.06, 0.22], {
      at: [bounds.centreX, y - 0.14, bounds.centreZ],
      colour: style.accent,
      glow: true,
      tag: finishTag,
    })
    return
  }
  const count = countAcross(bounds.width, style.ceilingPattern === 'coffers' ? 3.4 : 2.6)
  for (let index = 1; index <= count; index++) {
    const x = bounds.minX + (bounds.width * index) / (count + 1)
    into.box([0.12, 0.18, Math.max(0.2, bounds.depth - 0.2)], {
      at: [x, y, bounds.centreZ],
      colour: style.ceiling,
      tag: finishTag,
    })
  }
  if (style.ceilingPattern !== 'beams') {
    into.box([Math.max(0.2, bounds.width - 0.3), 0.1, 0.18], {
      at: [bounds.centreX, y - 0.12, bounds.minZ + Math.min(0.45, bounds.depth * 0.2)],
      colour: style.metal,
      tag: finishTag,
    })
  }
  const lights = countAcross(bounds.width, 4)
  for (let index = 1; index <= lights; index++) {
    const x = bounds.minX + (bounds.width * index) / (lights + 1)
    into.box([0.75, 0.06, 0.22], {
      at: [x, y - 0.14, bounds.centreZ],
      colour: style.accent,
      glow: true,
      tag: finishTag,
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

  const context: SourceBoundRoomContext = {
    into: new BanquetDetailBuilder(THREE),
    space,
    bounds: sourceBoundBoundsOf(space),
    floor: floorOf(space, plan.tier),
    ceiling: ceilingOf(space, plan.tier),
    style,
  }
  dressFloor(context)
  dressWalls(context)
  dressCeiling(context)
  for (const structure of plan.structures.filter((item) => item.spaceId === spaceId)) {
    dressSourceBoundStructure(context, structure)
  }
  dressInferredProgramme(context)
  return context.into.finish(`source-bound-${style.name}`)
}
