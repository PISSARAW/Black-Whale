import type { ThrowBeat, ThrowPerformance } from './types'

type Travel = 'path' | 'actorPath'
const value = (beat: ThrowBeat, field: Travel, axis: number) => (beat[field] ?? [0, 0, 0])[axis]

/** Continuous velocity between keys; descending bodies accelerate until the floor impact. */
export function throwTravel(performance: ThrowPerformance, t: number, field: Travel) {
  const keys = performance.beats
  return [0, 1, 2].map((axis) => {
    const coordinate = sampleThrowChannel(keys, t, (beat) => value(beat, field, axis))
    return axis === 1 ? fallingHeight(keys, t, { field, height: coordinate }) : coordinate
  }) as [number, number, number]
}

export function sampleThrowChannel(
  keys: readonly ThrowBeat[],
  t: number,
  read: (beat: ThrowBeat) => number,
): number {
  const index = Math.max(
    1,
    keys.findIndex((beat) => beat.at >= t),
  )
  const a = keys[index - 1],
    b = keys[index]
  const duration = b.at - a.at,
    u = Math.max(0, Math.min(1, (t - a.at) / duration))
  return (
    (2 * u ** 3 - 3 * u ** 2 + 1) * read(a) +
    (u ** 3 - 2 * u ** 2 + u) * tangent(keys, index - 1, read) * duration +
    (-2 * u ** 3 + 3 * u ** 2) * read(b) +
    (u ** 3 - u ** 2) * tangent(keys, index, read) * duration
  )
}

function tangent(keys: readonly ThrowBeat[], index: number, read: (beat: ThrowBeat) => number) {
  if (index === 0 || index === keys.length - 1) return 0
  const a = keys[index - 1],
    b = keys[index],
    c = keys[index + 1]
  const left = (read(b) - read(a)) / (b.at - a.at)
  const right = (read(c) - read(b)) / (c.at - b.at)
  if (left * right <= 0) return 0
  return (2 * left * right) / (left + right)
}

function fallingHeight(
  keys: readonly ThrowBeat[],
  t: number,
  options: { field: Travel; height: number },
) {
  const { field, height } = options
  const peak = keys.reduce((best, beat) =>
    value(beat, field, 1) > value(best, field, 1) ? beat : best,
  )
  const land = keys.find((beat) => beat.at > peak.at && value(beat, field, 1) === 0)
  if (!land || t < peak.at || t >= land.at) return height
  const u = (t - peak.at) / (land.at - peak.at)
  return value(peak, field, 1) * (1 - u * u)
}
