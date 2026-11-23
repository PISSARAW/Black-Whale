interface SnapshotDigest {
  hash?: number
}
const digests = new WeakMap<object, SnapshotDigest>()

/** Forecast data owns its copy: freezing it never freezes a live combatant. */
export function immutableFightSnapshot<T extends object>(value: T): T {
  const snapshot = structuredClone(value)
  freezeTree(snapshot, new WeakSet())
  digests.set(snapshot, {})
  return snapshot
}

function freezeTree(value: unknown, seen: WeakSet<object>) {
  if (!value || typeof value !== 'object' || seen.has(value)) return
  seen.add(value)
  Object.values(value).forEach((child) => freezeTree(child, seen))
  Object.freeze(value)
}

/** Only snapshots recursively frozen here qualify for persistent hash reuse. */
export const immutableSnapshotDigest = (value: object) => digests.get(value)

/** Copy successive frames of one immutable simulation, retaining unchanged subtrees. */
export function createImmutableFightSnapshots() {
  const copies = new WeakMap<object, object>()
  function copy(value: unknown): unknown {
    if (!value || typeof value !== 'object') return value
    const cached = copies.get(value)
    if (cached) return cached
    const prototype = Object.getPrototypeOf(value)
    const target: object = Array.isArray(value)
      ? new Array(value.length)
      : prototype === Object.prototype || prototype === null
        ? Object.create(prototype)
        : structuredClone(value)
    copies.set(value, target)
    for (const [key, child] of Object.entries(value))
      Object.defineProperty(target, key, {
        enumerable: true,
        value: copy(child),
      })
    return Object.freeze(target)
  }
  return <T extends object>(value: T): T => {
    const snapshot = copy(value) as T
    digests.set(snapshot, {})
    return snapshot
  }
}
