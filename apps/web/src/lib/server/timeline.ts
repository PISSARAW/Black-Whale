import { prisma } from '$lib/server/db'
import { createSnapshotStore, TimelineEngine, type WorldSnapshot } from '@black-whale/canon-engine'

/**
 * One engine for the whole process, and one snapshot store behind it.
 *
 * This module is the only place the archive decides to remember anything
 * between requests, and it is safe for exactly one reason: nothing here writes
 * to the database. The canon tables are filled by `canon-compiler` in the
 * migrate container, before the release that reads them starts serving. So a
 * reconstructed world state cannot go stale while the process lives.
 *
 * The one sanctioned exception lives elsewhere: `SimulationStore`
 * (`@black-whale/simulation-engine`) writes visitor-created simulation branches,
 * and is bounded for that reason — a TTL purges old rows and only so many
 * branches stay resident in memory. Any new write path must come with the same
 * kind of bound.
 *
 * The loaders used to build `new TimelineEngine(prisma)` each time, which threw
 * the work away between requests: `/ship` recomputed the same three hundred
 * kilobytes of world state on every load.
 */
export const snapshots = createSnapshotStore<WorldSnapshot>()

export const timeline = new TimelineEngine(prisma, snapshots)
