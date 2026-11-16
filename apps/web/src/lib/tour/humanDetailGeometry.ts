import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { BufferGeometry } from 'three'

/** Merge same-material details once, so a seam or a finger is not a draw call. */
export function mergeHumanDetails(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts, false)
  parts.forEach((part) => part.dispose())
  if (!merged) throw new Error('Incompatible human detail geometries')
  return merged
}
