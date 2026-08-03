/**
 * What hour the walk is at, and whether the canon actually said so.
 *
 * The walk projects an event — `selectEvent` under the reader's cap, then
 * `getWorldState` — and the people it puts aboard are aboard at that event's
 * hour. The two windows have to agree with them: a bay showing an afternoon sky
 * behind a Kurapika who is awake at 01:27 would be the walk contradicting
 * itself in one frame.
 *
 * The hour is never computed here. `voyage-clock` runs the cascade once, at
 * compile time, and the result is stamped on the event — `occurredAtBasis`,
 * `occurredAtHours`, `occurredAtLabel` — which is the same set of columns
 * `/ship` reads its labels from. So the two surfaces cannot disagree about what
 * time it is for the same reason they cannot disagree about who is in room
 * 1014: they are reading one answer rather than each working one out.
 *
 * The arbitration below runs on the server, where the event is already in hand,
 * and what crosses is a number or `null`. Two browsers cannot arbitrate
 * differently because neither of them arbitrates.
 */
import type { TimeBasis } from '@black-whale/domain'

/** The hour of the ship at the projected event, and its provenance. */
export interface ShipHour {
  /**
   * Hours since the departure horn, or `null` when canon does not date the
   * scene closely enough to put a clock on it.
   *
   * `null` is not "unknown, pick something": it is the instruction to show the
   * state ch. 380 draws — see `REFERENCE_HOUR` in `$lib/tour/sky`. Taking the
   * middle of a `Day 4 – Day 8` bracket would be dressing a guess as a
   * pendulum, and "flattening them into one number is how a timeline starts
   * lying" is as true of the light as it is of the log.
   */
  hours: number | null
  /**
   * How much the canon actually said, kept beside the hour rather than folded
   * into it. `null` for an event off the voyage clock altogether.
   */
  basis: TimeBasis | null
  /**
   * `formatVoyageTime`'s own label — `Day 3 · Tuesday · 01:27`, `≈ Day 5`,
   * `Day 4 – Day 8` — for the read-out.
   *
   * This is the provenance card of the light: it is what lets a visitor see
   * *why* the bay is dark, or why it is the drawn noon when the chapter they
   * jumped to says nothing about the time.
   */
  label: string | null
}

/** No event projected: the walk shows the drawn state and says nothing. */
export const NO_HOUR: ShipHour = { hours: null, basis: null, label: null }

/** What the clock stamped on an event, as the columns hold it. */
export interface StampedTime {
  occurredAtBasis?: string | null
  occurredAtHours?: number | null
  occurredAtLabel?: string | null
}

const BASES: readonly string[] = ['stated', 'derived', 'bracketed']

/**
 * The rule of §3, and the whole of it.
 *
 * An hour the reader was told and an hour we worked out are both hours: the
 * arithmetic behind a `derived` time is sourced, and the `≈` that says so
 * belongs on the read-out rather than in the light. An hour nobody knows is not
 * an hour, so `bracketed` — and a `derived` day with no clock in it, which is
 * the same claim in a different column — hands back `null` and the walk falls
 * back to the drawn state.
 *
 * A stated span takes its beginning, as everywhere else in the reconstruction:
 * Woody is found between 12:15 and 12:30, and the light of half past twelve is
 * not a fact the span contains.
 */
export function shipHourOf(event: StampedTime): ShipHour {
  const basis = BASES.includes(event.occurredAtBasis ?? '')
    ? (event.occurredAtBasis as TimeBasis)
    : null
  const stated = basis === 'stated' || basis === 'derived'
  const hours = event.occurredAtHours
  return {
    hours: stated && typeof hours === 'number' && Number.isFinite(hours) ? hours : null,
    basis,
    label: event.occurredAtLabel ?? null,
  }
}
