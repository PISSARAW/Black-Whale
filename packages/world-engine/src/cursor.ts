export interface StoryCursor {
  branchId: string
  /** Monotonic order inside the branch. Unlike NarrativeEvent.sequence, this is global. */
  ordinal: number
  eventId: string
  chapterNumber: number
  localSequence: number
}

export interface CursorSource {
  id: string
  chapter: { number: number }
  sequence: number
  /** Canonical occurrence order. Falls back to publication order for legacy data. */
  ordinal?: number | null
}

export function compareStoryPosition(
  left: Pick<StoryCursor, 'chapterNumber' | 'localSequence'>,
  right: Pick<StoryCursor, 'chapterNumber' | 'localSequence'>,
): number {
  return left.chapterNumber - right.chapterNumber || left.localSequence - right.localSequence
}

export function buildCanonicalCursors(events: CursorSource[], branchId = 'canon'): StoryCursor[] {
  const ordered = [...events]
    .sort((left, right) => {
      if (left.ordinal != null && right.ordinal != null) return left.ordinal - right.ordinal
      return left.chapter.number - right.chapter.number || left.sequence - right.sequence
    })

  return ordered.map((event, index) => ({
      branchId,
      ordinal: event.ordinal ?? index,
      eventId: event.id,
      chapterNumber: event.chapter.number,
      localSequence: event.sequence,
    }))
}

export function assertCursorProgression(previous: StoryCursor, next: StoryCursor): void {
  if (previous.branchId !== next.branchId) {
    throw new Error(`Cannot apply cursor from branch ${next.branchId} to ${previous.branchId}`)
  }
  if (next.ordinal <= previous.ordinal) {
    throw new Error(`Cursor ordinal must increase (${previous.ordinal} -> ${next.ordinal})`)
  }
}
