import { prisma } from '$lib/server/db'
import { createSnapshotStore, TimelineEngine, type WorldSnapshot } from '@black-whale/canon-engine'

/**
 * One engine for the whole process, and one snapshot store behind it.
 *
 * This module is the only place the archive decides to remember anything
 * between requests, and it is safe for exactly one reason: nothing here writes
 * to the database. There is not a single `create`, `update` or `delete` against
 * Prisma in this app — the canon tables are filled by `canon-compiler` in the
 * migrate container, before the release that reads them starts serving. So a
 * reconstructed world state cannot go stale while the process lives.
 *
 * If that ever stops being true — a page that lets a visitor move a body, a
 * background job that rewrites a presence — this store has to be invalidated or
 * deleted. It is stated here rather than in a commit message because the next
 * person to add a write will read this file, not that message.
 *
 * The loaders used to build `new TimelineEngine(prisma)` each time, which threw
 * the work away between requests: `/ship` recomputed the same three hundred
 * kilobytes of world state on every load.
 */
export const snapshots = createSnapshotStore<WorldSnapshot>()

export const timeline = new TimelineEngine(prisma, snapshots)
