import { liveEntity } from './preparationWorld'
import type { LittleEyeShot } from './littleEyeTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightState } from './types'

type Point = Pick<LittleEyeShot, 'x' | 'y'>

/** Fraction of this step at which the emitted ball meets real cover, or null when the way is clear. */
export function littleEyeCoverFraction(state: FightState, from: Point, to: Point): number | null {
  const hits = (state.battlefield?.entities ?? [])
    .filter((entry) => entry.arena && liveEntity(entry))
    .map((entry) => segmentEntersBox(from, to, entry))
    .filter((fraction): fraction is number => fraction !== null)
  return hits.length ? Math.min(...hits) : null
}

/** Position of the animal along this step, used to tell whether it precedes the cover. */
export function littleEyeAnimalFraction(from: Point, to: Point, animal: PreparedEntity): number {
  const dx = to.x - from.x
  return dx === 0 ? 0 : (animal.x - from.x) / dx
}

function segmentEntersBox(from: Point, to: Point, entry: PreparedEntity): number | null {
  const half = entry.arena!.width / 2
  const x = slab(from.x, to.x, [entry.x - half, entry.x + half])
  const y = slab(from.y, to.y, [entry.y, entry.y + entry.arena!.height])
  if (!x || !y) return null
  const enter = Math.max(x[0], y[0], 0),
    exit = Math.min(x[1], y[1], 1)
  return enter <= exit ? enter : null
}

function slab(start: number, end: number, [low, high]: [number, number]): [number, number] | null {
  const delta = end - start
  if (delta === 0) return start >= low && start <= high ? [0, 1] : null
  const a = (low - start) / delta,
    b = (high - start) / delta
  return [Math.min(a, b), Math.max(a, b)]
}
