import { compareEventOrder, type OrderedEvent } from '@black-whale/domain'

/**
 * Where a body is, when several presence rows claim it at once.
 *
 * A body is in one place at a time, but two presences can hold at the same
 * point once the in-world clock is allowed to disagree with the reading order.
 * The ch. 380 cutaway is drawn early in the run and happens late in the voyage:
 * it closes the presences that came before it, and those rows stay open at
 * every point whose ordinal is lower — including points that later chapters
 * have already moved the body past. The reader then gets two answers to "where
 * is Chrollo", which on `/ship` meant two markers under one key and a page that
 * died on hydration rather than drawing either.
 *
 * The presence that started last in world order is the one that holds: it is
 * the most recent thing the archive knows about that body at that moment. The
 * other is a picture the voyage has since walked out of.
 */

/** A presence row as this helper reads it: whose it is, and when it opened. */
export interface EntityPresenceRow {
  entityId: string
  fromEvent: OrderedEvent
}

/** One row per entity — the latest to open — keeping the input's order. */
export function latestPresencePerEntity<T extends EntityPresenceRow>(rows: T[]): T[] {
  const held = new Map<string, T>()

  for (const row of rows) {
    const current = held.get(row.entityId)
    // Strictly later only: two rows opening at the same event are a tie the
    // ordering cannot break, and the first one read stays.
    if (!current || compareEventOrder(current.fromEvent, row.fromEvent) < 0) {
      held.set(row.entityId, row)
    }
  }

  return rows.filter((row) => held.get(row.entityId) === row)
}
