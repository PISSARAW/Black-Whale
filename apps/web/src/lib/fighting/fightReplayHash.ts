import type { FightState } from './types'
import { immutableSnapshotDigest } from './immutableFightSnapshot'

function canonical(value: unknown, cache: WeakMap<object, string>): string {
  if (!value || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  const held = cache.get(value)
  if (held !== undefined) return held
  const text = Array.isArray(value)
    ? `[${value.map((entry) => canonical(entry, cache)).join(',')}]`
    : canonicalObject(value as Record<string, unknown>, cache)
  cache.set(value, text)
  return text
}

function canonicalObject(object: Record<string, unknown>, cache: WeakMap<object, string>) {
  return `{${Object.keys(object)
    .filter(
      (key) =>
        key !== 'audioContacts' &&
        key !== 'audioInterceptions' &&
        key !== 'catsNameFatality' &&
        object[key] !== undefined,
    )
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(object[key], cache)}`)
    .join(',')}}`
}
/** Regression fingerprint, not a security signature. */
export function fightReplayHash(state: FightState): string {
  const cache = new WeakMap<object, string>()
  const future = state.parallelFuture
  // Fold fixed-seed frame hashes into the outer hash. Editing the live cursor or appending
  // frames never requires reading the canonical text of an unchanged forecast frame again.
  const value = future?.frames.length
    ? {
        ...state,
        parallelFuture: {
          ...future,
          frames: future.frames.map((frame) => snapshotHash(frame, cache)),
        },
      }
    : state
  return digestText(canonical(value, cache)).toString(16).padStart(8, '0')
}

/** Precompute an immutable forecast frame's hash as it is produced, before a checkpoint. */
export function primeFutureFrameHash(frame: object, cache: WeakMap<object, string>) {
  snapshotHash(frame, cache)
}

function snapshotHash(frame: object, cache: WeakMap<object, string>): number {
  const immutable = immutableSnapshotDigest(frame)
  if (!immutable) return digestText(canonical(frame, cache))
  return (immutable.hash ??= digestText(canonical(frame, cache)))
}

function digestText(text: string) {
  let hash = 2166136261
  for (let index = 0; index < text.length; index++)
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619)
  return hash >>> 0
}
