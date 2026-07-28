/**
 * Turning a URL into a point on the timeline.
 *
 * Sequence is local to a chapter, so it cannot identify an event on its own —
 * every chapter has a sequence 3. Selection therefore goes through the event
 * id, and `sequence` survives only to keep links bookmarked before that change
 * from landing on the wrong chapter.
 */

/** The minimum an event row must expose to be selectable. */
export interface SelectableEvent {
  id: string
  sequence: number
}

export interface EventSelectionRequest {
  /** `?eventId=` — the authoritative selector. */
  eventId?: string | null
  /** `?sequence=` — legacy, chapter-local, ambiguous by construction. */
  sequence?: number | null
}

export interface EventSelection<E extends SelectableEvent> {
  event: E | null
  /** Position in the passed list, or 0 when nothing matched. */
  index: number
}

/**
 * Resolve the selected event against a chronologically ordered list.
 *
 * Falls back, in order: explicit id, then legacy sequence (the *latest* event
 * carrying it, since earlier chapters reuse the number), then the last event —
 * the present moment of the story.
 *
 * `events` is expected ordered by chapter then sequence; the caller owns that.
 */
export function selectEvent<E extends SelectableEvent>(
  events: E[],
  request: EventSelectionRequest = {},
): EventSelection<E> {
  const byId = request.eventId ? events.find((event) => event.id === request.eventId) : undefined

  const bySequence =
    !byId && request.sequence !== undefined && request.sequence !== null
      ? findLast(events, (event) => event.sequence === request.sequence)
      : undefined

  const event = byId ?? bySequence ?? events[events.length - 1] ?? null
  const index = event ? events.findIndex((candidate) => candidate.id === event.id) : 0

  return { event, index: index < 0 ? 0 : index }
}

/** Reads `?sequence=` without turning junk into NaN. */
export function readLegacySequence(raw: string | null | undefined): number | undefined {
  if (raw === null || raw === undefined || raw.trim() === '') return undefined
  const parsed = Number(raw)
  return Number.isInteger(parsed) ? parsed : undefined
}

function findLast<T>(items: T[], predicate: (item: T) => boolean): T | undefined {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (predicate(items[index])) return items[index]
  }
  return undefined
}
