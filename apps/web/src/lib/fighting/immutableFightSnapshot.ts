interface SnapshotDigest {
  text?: string
  hashes: Map<number, number>
}
const digests = new WeakMap<object, SnapshotDigest>()

/** Forecast data owns its copy: freezing it never freezes a live combatant. */
export function immutableFightSnapshot<T extends object>(value: T): T {
  const snapshot = structuredClone(value)
  freezeTree(snapshot, new WeakSet())
  digests.set(snapshot, { hashes: new Map() })
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
