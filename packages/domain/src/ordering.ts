/**
 * Chronology primitives shared by every engine.
 *
 * The Black Whale arc is told out of order, so two different orders coexist:
 * `chapter.number` + `sequence` is the *reading* order, while `ordinal` is the
 * order in which things actually happened aboard the ship. A flashback has a
 * high chapter number and a low ordinal.
 */

export interface OrderedEvent {
  sequence: number;
  /** Chronological occurrence order, independent from the revealing chapter. */
  ordinal?: number | null;
  chapter: { number: number };
}

/** A row that holds between two events, such as a presence or a belief. */
export interface TemporalRecord {
  fromEvent: OrderedEvent;
  untilEvent?: OrderedEvent | null;
}

/**
 * Negative when `left` comes first.
 *
 * Ordinals win when both events carry one, because that is the true
 * chronology. Falling back to chapter and sequence is only correct for events
 * that have not been placed on the ship's timeline yet.
 */
export function compareEventOrder(left: OrderedEvent, right: OrderedEvent): number {
  if (left.ordinal != null && right.ordinal != null) return left.ordinal - right.ordinal;
  return left.chapter.number - right.chapter.number || left.sequence - right.sequence;
}

/** Whether an event has been revealed to a reader who has read that far. */
export function isRevealed(event: OrderedEvent, revealedThroughChapter: number): boolean {
  return event.chapter.number <= revealedThroughChapter;
}

/**
 * Whether a record holds at `targetEvent`.
 *
 * The chapter comparison is not redundant with `compareEventOrder`: a record
 * whose bounds carry ordinals could otherwise be reported as active at an event
 * the reader has not reached, since ordinals ignore publication order entirely.
 * A record with no `untilEvent` is open-ended and still holds.
 */
export function isActiveAt(record: TemporalRecord, targetEvent: OrderedEvent): boolean {
  return (
    record.fromEvent.chapter.number <= targetEvent.chapter.number &&
    compareEventOrder(record.fromEvent, targetEvent) <= 0 &&
    (!record.untilEvent ||
      record.untilEvent.chapter.number > targetEvent.chapter.number ||
      compareEventOrder(targetEvent, record.untilEvent) < 0)
  );
}
