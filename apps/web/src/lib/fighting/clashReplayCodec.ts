export type ReplayValue =
  null | boolean | number | string | undefined | ReplayValue[] | { [key: string]: ReplayValue }
const SCALAR = '$clashScalar'
const FORBIDDEN = new Set(['__proto__', 'prototype', 'constructor'])
export const safeReplayKey = (key: string) => !FORBIDDEN.has(key)

/** Preserve training Infinity and explicit undefined without relying on JSON's lossy defaults. */
export function encodeReplay(value: unknown): string {
  return JSON.stringify(value, (_key, entry) => {
    if (entry === undefined) return { [SCALAR]: 'undefined' }
    if (typeof entry === 'number' && !Number.isFinite(entry)) return { [SCALAR]: String(entry) }
    return entry
  })
}
export function decodeReplay(text: string): unknown {
  if (text.length > 24 * 1024 * 1024) throw Error('replay-size')
  return decodeValue(JSON.parse(text), 0)
}
function decodeValue(value: unknown, depth: number): unknown {
  if (depth > 100) throw Error('replay-depth')
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((entry) => decodeValue(entry, depth + 1))
  const entries = Object.entries(value)
  if (entries.length === 1 && entries[0][0] === SCALAR) return scalar(entries[0][1])
  const result: Record<string, unknown> = {}
  for (const [key, entry] of entries) {
    if (!safeReplayKey(key)) throw Error('replay-key')
    result[key] = decodeValue(entry, depth + 1)
  }
  return result
}
function scalar(value: unknown): number | undefined {
  if (value === 'undefined') return undefined
  if (value === 'Infinity') return Infinity
  if (value === '-Infinity') return -Infinity
  if (value === 'NaN') return NaN
  throw Error('replay-scalar')
}
export function cloneReplayValue<T>(value: T): T {
  return structuredClone(value)
}

/** A deterministic divergence checksum, not an authenticity signature. */
export function replayChecksum(value: unknown): string {
  const text = encodeReplay(canonical(value))
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  return (hash >>> 0).toString(16).padStart(8, '0')
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, entry]) => [key, canonical(entry)]),
  )
}
