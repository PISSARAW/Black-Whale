/**
 * Snapshot Job
 *
 * Periodically generates and persists world state snapshots
 * so the timeline engine can load them instead of replaying all events.
 */

export interface SnapshotJobData {
  upToEventId: string
  chapterId?: string
}

export async function processSnapshotJob(data: SnapshotJobData): Promise<void> {
  console.log(`[snapshot-job] Generating snapshot up to event: ${data.upToEventId}`)
  // TODO: call TimelineEngine.getWorldState() and persist
}
