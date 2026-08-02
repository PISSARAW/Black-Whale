export interface SeededRandom {
  seed: number
  next(): number
  integer(max: number): number
}

export function seededRandom(seed: number): SeededRandom {
  let value = seed >>> 0
  return {
    seed: value,
    next() {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0
      return value / 0x1_0000_0000
    },
    integer(max: number) {
      if (!Number.isInteger(max) || max <= 0) throw new Error('Random bound must be positive')
      return Math.floor(this.next() * max)
    },
  }
}

export function seedFromText(text: string): number {
  let hash = 2166136261
  for (const char of text) {
    hash ^= char.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
