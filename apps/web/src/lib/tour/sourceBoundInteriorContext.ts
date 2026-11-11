import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { TourDetailTag } from './detailTag'
import type { SourceBoundInteriorStyle } from './sourceBoundInteriorStyles'
import type { Space, Structure, Vec2 } from './types'

export interface SourceBoundBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  width: number
  depth: number
  centreX: number
  centreZ: number
}

export interface SourceBoundRoomContext {
  into: BanquetDetailBuilder
  space: Space
  bounds: SourceBoundBounds
  floor: number
  ceiling: number
  lampPositions: readonly Vec2[]
  style: SourceBoundInteriorStyle
}

export const sourceBoundBoundsOf = (space: Space): SourceBoundBounds => {
  const xs = space.footprint.map(([x]) => x)
  const zs = space.footprint.map(([, z]) => z)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)
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

export function reconstructionTag(
  context: SourceBoundRoomContext,
  options: {
    id: string
    name: string
    nameFr: string
    layer: 'envelope' | 'finish' | 'furniture'
  },
): TourDetailTag {
  const { space, style } = context
  const { id, name, nameFr, layer } = options
  const role = style.roles[layer]
  const inferred = role !== 'attested'
  return {
    id: `${space.id}-${id}`,
    spaceId: space.id,
    name,
    nameFr,
    provenance: inferred ? 'inferred' : style.evidence.provenance,
    source: inferred
      ? `Visual reconstruction (${role}). ${style.evidence.source}`
      : style.evidence.source,
    sourceFr: inferred
      ? `Reconstruction visuelle (${role}). ${style.evidence.sourceFr}`
      : style.evidence.sourceFr,
    reconstructionRole: role,
  }
}

export function structureTag(structure: Structure): TourDetailTag {
  return {
    id: structure.id,
    spaceId: structure.spaceId,
    name: structure.name,
    nameFr: structure.nameFr,
    provenance: structure.provenance,
    source: structure.source,
    sourceFr: structure.sourceFr,
    reconstructionRole:
      structure.provenance === 'inferred' ? 'functional-reconstruction' : 'attested',
  }
}
