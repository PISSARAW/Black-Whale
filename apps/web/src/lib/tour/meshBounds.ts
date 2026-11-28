type Vec3 = readonly [number, number, number]

/**
 * A run of points inside a shared buffer.
 *
 * Every room's geometry lives in one array per deck, so a room is a slice of it
 * rather than an array of its own — and a slice is where it starts and how many
 * points long it is, which is exactly what has to be said to measure one.
 */
interface BoundsRun {
  data: number[]
  start: number
  count: number
}

/**
 * The bounding sphere of one room's slice of the buffers.
 *
 * Computed here rather than by three.js, because `computeBoundingSphere` reads
 * the whole attribute: every room sharing one buffer would come back with the
 * bounding sphere of the entire deck, and a per-room mesh with the deck's
 * sphere is the same thing that could not be culled before.
 */
export function boundsOf(vertices: BoundsRun, edges: BoundsRun): { centre: Vec3; radius: number } {
  let minX = Infinity
  let minY = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let maxZ = -Infinity

  const stretch = (source: number[], from: number, points: number) => {
    for (let i = from * 3; i < (from + points) * 3; i += 3) {
      if (source[i] < minX) minX = source[i]
      if (source[i] > maxX) maxX = source[i]
      if (source[i + 1] < minY) minY = source[i + 1]
      if (source[i + 1] > maxY) maxY = source[i + 1]
      if (source[i + 2] < minZ) minZ = source[i + 2]
      if (source[i + 2] > maxZ) maxZ = source[i + 2]
    }
  }
  stretch(vertices.data, vertices.start, vertices.count)
  stretch(edges.data, edges.start, edges.count)

  if (minX > maxX) return { centre: [0, 0, 0], radius: 0 }
  const centre: readonly [number, number, number] = [
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2,
  ]
  // The half-diagonal of the box, which encloses it whatever shape it is.
  return {
    centre,
    radius: Math.hypot(maxX - centre[0], maxY - centre[1], maxZ - centre[2]),
  }
}
