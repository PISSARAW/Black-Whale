import type { Structure, Vec2, WallSegment } from './types'
import { galleryFront, galleryParapetStart } from './banquetWallLayout'

export interface BanquetRail extends WallSegment {
  base: number
  top: number
  kind: 'front' | 'return' | 'stair' | 'landing'
}

export function stairRailSides(steps: readonly Structure[]) {
  const sorted = [...steps].sort((a, b) => a.height - b.height)
  const first = sorted[0],
    last = sorted.at(-1)!
  const width = Math.max(...first.size)
  return [-1, 1].map((side) => {
    const x = first.at[0] + side * (width / 2 - 0.08)
    const cut = side === Math.sign(first.at[0] + 1) ? 0.65 : 0
    return { side, start: [x, first.at[1]] as Vec2, end: [x, last.at[1] + cut] as Vec2 }
  })
}

function galleryRails(gallery: Structure, structures: readonly Structure[]): BanquetRail[] {
  const front = galleryFront(gallery)
  const start = galleryParapetStart(gallery, structures)
  const end = front.z + front.length / 2
  const rail = { spaceId: gallery.spaceId, base: front.top, top: front.top + 1.03 }
  const exposedEnds = [front.z - front.length / 2, end].filter(
    (z) =>
      !structures.some((other) => {
        if (other.id === gallery.id || !/-gallery-(forward|aft)-/.test(other.id)) return false
        const neighbour = galleryFront(other)
        return (
          Math.abs(neighbour.x - front.x) < 0.01 &&
          Math.abs(Math.abs(neighbour.z - z) - neighbour.length / 2) < 0.01
        )
      }),
  )
  const returns: BanquetRail[] = exposedEnds.map((z) => ({
    ...rail,
    kind: 'return',
    start: [front.x, z],
    end: [front.x - front.inward * front.depth, z],
  }))
  return [{ ...rail, kind: 'front', start: [front.x, start], end: [front.x, end] }, ...returns]
}

function landingRails(landing: Structure): BanquetRail[] {
  const width = Math.max(...landing.size),
    depth = Math.min(...landing.size)
  const side = -Math.sign(landing.at[0] + 1)
  const x = landing.at[0] + side * (width / 2 - 0.08)
  const back = landing.at[1] - depth / 2
  const rail = {
    spaceId: landing.spaceId,
    base: landing.base + landing.height,
    top: landing.base + landing.height + 1.03,
    kind: 'landing' as const,
  }
  return [
    { ...rail, start: [x, landing.at[1] + depth / 2], end: [x, back] },
    { ...rail, start: [landing.at[0] - width / 2, back], end: [landing.at[0] + width / 2, back] },
  ]
}

/** Shared rail centre lines: both the renderer and the walker use these. */
export function banquetRails(structures: readonly Structure[]): BanquetRail[] {
  const galleries = structures.filter(({ id }) => /-gallery-(forward|aft)-/.test(id))
  const rails = galleries.flatMap((gallery) => galleryRails(gallery, structures))
  rails.push(
    ...structures.filter(({ id }) => id.includes('-gallery-landing-')).flatMap(landingRails),
  )
  for (const side of ['port', 'starboard']) {
    const steps = structures.filter(({ id }) => id.includes(`-gallery-stair-${side}-`))
    if (!steps.length) continue
    const top = Math.max(...steps.map(({ height }) => height)) + 1.03
    rails.push(
      ...stairRailSides(steps).map((line) => ({
        ...line,
        spaceId: steps[0].spaceId,
        base: 0,
        top,
        kind: 'stair' as const,
      })),
    )
  }
  return rails
}
