/**
 * Which of a body's existing presences the catalogue's single position means.
 *
 * `shipLocation` describes one position, and a body may already hold several
 * rows — an opening one, a continuation written when canon stopped reporting
 * it, whatever a previous run left behind. Picking the wrong one moves a
 * passenger's whole history instead of their current room, so the choice is
 * made here, on data alone, and can be checked without a database.
 */

export interface PresenceCandidate {
  id: string
  locationId: string | null
  fromEventId: string
  untilEventId: string | null
  locationType: string | null
  precision: string
  certainty: string
  from: { chapter: number; sequence: number }
}

export interface RequestedBounds {
  /** The chapter the catalogue opens the position at, if it names one. */
  fromChapter: number | null
  /** The last chapter the body is still on the map, if anything closes it. */
  untilChapter: number | null
}

/**
 * Open records first, then the latest — the open one is the position the map is
 * currently drawing, and it is the one a catalogue edit is about.
 */
function byRelevance(left: PresenceCandidate, right: PresenceCandidate): number {
  if (left.untilEventId === null && right.untilEventId !== null) return -1
  if (left.untilEventId !== null && right.untilEventId === null) return 1
  return right.from.chapter - left.from.chapter || right.from.sequence - left.from.sequence
}

export function pickExistingPresence(
  candidates: readonly PresenceCandidate[],
  bounds: RequestedBounds,
): PresenceCandidate | null {
  if (candidates.length === 0) return null
  const ordered = [...candidates].sort(byRelevance)

  const matches = (presence: PresenceCandidate): boolean => {
    // A declared opening chapter names the record exactly.
    if (bounds.fromChapter !== null) return presence.from.chapter === bounds.fromChapter
    // Otherwise, a closing bound means the record to move is the last real
    // position before it — never the "position inconnue" continuation, which
    // exists precisely because canon stopped saying where the body was.
    if (bounds.untilChapter !== null) {
      return presence.locationType !== 'UNKNOWN' && presence.from.chapter < bounds.untilChapter
    }
    // With no bounds at all, the position being described is the open one.
    return presence.untilEventId === null
  }

  return ordered.find(matches) ?? candidates[0] ?? null
}
