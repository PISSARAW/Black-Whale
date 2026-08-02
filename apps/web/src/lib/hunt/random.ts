/**
 * The one source of chance in the hunt, carried in the state rather than taken
 * from `Math.random()`.
 *
 * The reducer is pure and the loop is fixed-step precisely so a game can be
 * replayed from a seed: a hunter who patrols differently on every run cannot be
 * tested, and "the hunter found my entrave" stops being a claim anyone can
 * check. Every draw returns the next generator alongside the value, so a caller
 * that forgets to thread it through gets the same number twice and notices.
 */

export interface Rng {
  seed: number
}

export function seedRng(seed: number): Rng {
  // Zero is a fixed point of the mixer below, so it is nudged off it.
  return { seed: seed >>> 0 || 0x9e3779b9 }
}

/** mulberry32: small, fast, and good enough for a patrol route. */
export function nextFloat(rng: Rng): { rng: Rng; value: number } {
  const seed = (rng.seed + 0x6d2b79f5) >>> 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return { rng: { seed }, value }
}

/** A uniform draw from a list; `item` is null only for an empty list. */
export function pick<T>(rng: Rng, items: readonly T[]): { rng: Rng; item: T | null } {
  if (items.length === 0) return { rng, item: null }
  const drawn = nextFloat(rng)
  return { rng: drawn.rng, item: items[Math.floor(drawn.value * items.length)] }
}

/** True with probability `chance`, clamped to [0, 1]. */
export function chanceIn(rng: Rng, chance: number): { rng: Rng; hit: boolean } {
  const drawn = nextFloat(rng)
  return { rng: drawn.rng, hit: drawn.value < Math.min(1, Math.max(0, chance)) }
}
