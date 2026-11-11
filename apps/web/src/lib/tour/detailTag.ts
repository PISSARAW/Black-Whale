import type * as Three from 'three'
import type { Provenance } from './types'

export type ReconstructionRole =
  'attested' | 'metric-estimate' | 'functional-reconstruction' | 'connective-inference'

/**
 * Evidence attached to a modelled surface that is not a blueprint solid.
 *
 * Walls, stains and door leaves belong to the visual reconstruction, but they
 * must not masquerade as furniture in `blueprint.json`: doing so would make
 * them collide with the visitor and available to object-targeting Nen.  A
 * detail tag gives those triangles the same bilingual provenance card without
 * changing the walked plan.
 */
export interface TourDetailTag {
  id: string
  spaceId: string
  name: string
  nameFr: string
  provenance: Provenance
  source: string
  sourceFr: string
  /** What was reconstructed even when the underlying room or object is attested. */
  reconstructionRole?: ReconstructionRole
}

/** A half-open run of non-indexed triangle faces carrying one detail tag. */
export interface DetailTagRange {
  start: number
  count: number
  tag: TourDetailTag
}

export const DETAIL_TAGS_KEY = 'tourDetailTags'

export function detailTagRangesOf(object: Three.Object3D): readonly DetailTagRange[] {
  const ranges = object.userData[DETAIL_TAGS_KEY]
  return Array.isArray(ranges) ? (ranges as DetailTagRange[]) : []
}

/** Returns the evidence attached to the exact triangle met by a ray. */
export function detailTagAt(
  hit: Pick<Three.Intersection, 'object' | 'faceIndex'>,
): TourDetailTag | null {
  if (hit.faceIndex == null) return null
  for (const range of detailTagRangesOf(hit.object)) {
    if (hit.faceIndex >= range.start && hit.faceIndex < range.start + range.count) return range.tag
  }
  return null
}
