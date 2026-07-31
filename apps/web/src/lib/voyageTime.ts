/**
 * What the voyage is, as opposed to when each event happens on it.
 *
 * The per-chapter day table that used to live here is gone: it mapped every
 * chapter onto a voyage day through a chain of rules only two of which — the
 * noon departure and the 104-hour caption — could be traced to a panel, and it
 * disagreed with `data/chapters/chapters.json` about the banquet. Events now
 * carry their own time, dated in `data/events/events.json` and bracketed by
 * `@black-whale/domain`'s voyage clock, so a chapter no longer has to answer a
 * question only a scene can answer.
 */

/** Eight weeks announced by the Zodiacs for the crossing. */
export const VOYAGE_DURATION_DAYS = 56
/** Three of those weeks are sailed inside Kakin territorial waters, then the ship refuels. */
export const TERRITORIAL_WATERS_DAYS = 21
/** Latest voyage day the manga has actually depicted: Benjamin's martial law. */
export const LATEST_RECORDED_DAY = 12

/** Day 1 is a Sunday: the Black Whale leaves Kakin on August 8th, at noon. */
export const DEPARTURE_DATE = 'August 8th'
export const DEPARTURE_TIME = '12:00'
