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
    .filter((key) => object[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(object[key], cache)}`)
    .join(',')}}`
}
/** Regression fingerprint, not a security signature. Includes RNG, accumulator, Hatsu and round state. */
export function fightReplayHash(state: FightState): string {
  // Forecast frames share immutable subtrees. Reuse their text only inside this
  // call: later hashing must still detect any mutation, including imported tapes.
  const context = { hash: 2166136261 }
  if (state.parallelFuture?.frames.length) visit(state, context)
  else context.hash = digestText(canonical(state, new WeakMap()), context.hash)
  return (context.hash >>> 0).toString(16).padStart(8, '0')
}

function digestText(text: string, initial: number) {
  let hash = initial
  for (let index = 0; index < text.length; index++)
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619)
  return hash
}

function visit(value: unknown, context: { hash: number }) {
  const write = (text: string) => {
    context.hash = digestText(text, context.hash)
  }
  if (!value || typeof value !== 'object') {
    write(JSON.stringify(value) ?? 'null')
    return
  }
  if (visitImmutable(value, context)) return
  if (Array.isArray(value)) {
    visitArray(value, context)
    return
  }
  visitObject(value as Record<string, unknown>, context)
}

function visitImmutable(value: object, context: { hash: number }) {
  const immutable = immutableSnapshotDigest(value)
  if (!immutable) return false
  immutable.text ??= canonical(value, new WeakMap())
  const initial = context.hash
  context.hash = immutable.hashes.get(initial) ?? digestText(immutable.text, initial)
  if (immutable.hashes.size < 64) immutable.hashes.set(initial, context.hash)
  return true
}

function visitArray(value: unknown[], context: { hash: number }) {
  context.hash = digestText('[', context.hash)
  for (let index = 0; index < value.length; index++) {
    if (index) context.hash = digestText(',', context.hash)
    if (index in value) visit(value[index], context)
  }
  context.hash = digestText(']', context.hash)
}

function visitObject(object: Record<string, unknown>, context: { hash: number }) {
  context.hash = digestText('{', context.hash)
  const keys = Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .sort()
  keys.forEach((key, index) => {
    context.hash = digestText(`${index ? ',' : ''}${JSON.stringify(key)}:`, context.hash)
    visit(object[key], context)
  })
  context.hash = digestText('}', context.hash)
}
