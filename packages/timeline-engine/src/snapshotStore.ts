/**
 * Holding a reconstructed world state so it is reconstructed once.
 *
 * Everything the archive serves is derived from `data/`, and `data/` reaches
 * the database through the compiler, which runs in the migrate container before
 * the new release starts serving. Nothing in the web app writes to Prisma —
 * there is not one `create`, `update` or `delete` in it. So for the lifetime of
 * a process, the answer to "what did the world look like at this event" cannot
 * change, and computing it twice is waste.
 *
 * That is the whole justification for this cache, and it is the thing to check
 * before adding a runtime write: the moment a request can change a Presence,
 * this has to go or learn to be invalidated.
 */

/** A point in the story, as a cache key: the event and the reader's cap. */
export function snapshotKey(eventId: string, revealedThroughChapter: number): string {
  return `${eventId}|${revealedThroughChapter}`
}

export interface SnapshotStore<T> {
  get(key: string): T | null
  set(key: string, value: T): void
  clear(): void
  readonly size: number
  /** Reads answered from the store, and reads that had to compute. Measured, not guessed. */
  readonly stats: { hits: number; misses: number }
}

/**
 * Least-recently-used, bounded by entry count.
 *
 * A world state at the end of the voyage is roughly three hundred kilobytes
 * serialised and rather more as a live object graph, so the bound is low on
 * purpose: this is meant to hold the handful of points a reader actually moves
 * between, not the whole timeline. Twenty-four covers the two ends and the
 * chapters around wherever they are reading; the rest is recomputed, which
 * costs tens of milliseconds and no memory at all.
 */
export function createSnapshotStore<T>(capacity = 24): SnapshotStore<T> {
  const entries = new Map<string, T>()
  const stats = { hits: 0, misses: 0 }

  return {
    get(key) {
      if (!entries.has(key)) {
        stats.misses += 1
        return null
      }
      // Re-inserting moves the key to the end of the Map's iteration order,
      // which is what makes the first key the least recently used one.
      const value = entries.get(key)!
      entries.delete(key)
      entries.set(key, value)
      stats.hits += 1
      return value
    },
    set(key, value) {
      entries.delete(key)
      entries.set(key, value)
      while (entries.size > capacity) {
        const oldest = entries.keys().next()
        if (oldest.done) break
        entries.delete(oldest.value)
      }
    },
    clear() {
      entries.clear()
      stats.hits = 0
      stats.misses = 0
    },
    get size() {
      return entries.size
    },
    stats,
  }
}
