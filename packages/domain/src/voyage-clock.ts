/**
 * The voyage clock: in-world time aboard the Black Whale, counted in hours
 * since the departure horn.
 *
 * The arc dates itself by hand and rarely. Nine captions, two bedside clocks
 * and a handful of "the day before" remarks are everything canon gives, so an
 * event either carries a time the manga states, a time derived from one by a
 * stated relation, or no time at all — in which case the only truthful answer
 * is the interval between the last anchor before it and the first anchor after
 * it. That interval is what `bracket` computes, and the distinction is what
 * `basis` records: an hour the reader was told, an hour we worked out, and an
 * hour nobody knows are three different claims, and flattening them into one
 * number is how a timeline starts lying.
 *
 * Hour 0 is the horn, Sunday at noon of day 1. Everything else is arithmetic
 * on that, weekdays included: chapter 374 shows Fugetsu's bedside clock reading
 * TUESDAY 01:27 AM while the same chapter's caption counts 37 h 30 out of port,
 * and the two agree to three minutes.
 */

import type { SourceType } from './source.js'

/** Local time of the departure horn, in hours past midnight of day 1. */
const DEPARTURE_TIME_OF_DAY = 12

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export type Weekday = (typeof WEEKDAYS)[number]

/**
 * How much the arc actually says about when something happened.
 *
 * `stated` — canon prints a clock, a weekday or an elapsed-hours caption.
 * `derived` — canon states a relation to something stated ("nine hours
 *   unconscious", "the day before"), and the hour follows by arithmetic.
 * `bracketed` — canon says nothing; the bounds come from the neighbouring
 *   anchors, and there is no hour to show.
 */
export type TimeBasis = 'stated' | 'derived' | 'bracketed'

/** What the data file may declare on an event. A day without an hour is a span. */
export interface DeclaredTime {
  basis: 'stated' | 'derived'
  /** Hours since the departure horn. */
  hours?: number
  /** End of a stated span, when canon gives a window rather than an instant. */
  hoursUntil?: number
  /** Voyage day, when canon dates the scene without putting a clock on it. */
  day?: number
  /**
   * Who told us, `manga` when omitted.
   *
   * `basis` says how strong the claim is, `source` says whose claim it is, and
   * the two are separate axes on purpose. Hunterpedia dates a good part of the
   * second half of the arc and is taken at its word here, so a `community`
   * time carries the basis it reports — a clock it transcribes is `stated`.
   * Recording the source is not a discount on the claim: it says which entries
   * a reader can check against the page, and where to correct one that is wrong.
   */
  source?: SourceType
}

/** Where an event sits on the voyage clock, once the cascade has run. */
export interface VoyageTime {
  basis: TimeBasis
  /** Who told us, when it is not the manga itself. */
  source?: SourceType
  /** Set only when `basis` is `stated` or `derived`. */
  hours?: number
  /** Lower bound, always known: no event precedes the horn. */
  earliest: number
  /** Upper bound, or `null` past the last anchor — the voyage is not over. */
  latest: number | null
}

/** Voyage day containing an hour offset. Day 1 is the day the ship sails. */
export function dayOf(hours: number): number {
  return Math.floor((hours + DEPARTURE_TIME_OF_DAY) / 24) + 1
}

/** Hour offsets of a voyage day, from its midnight to the next. */
export function spanOfDay(day: number): { from: number; to: number } {
  const from = (day - 1) * 24 - DEPARTURE_TIME_OF_DAY
  return { from, to: from + 24 }
}

export function weekdayOf(hours: number): Weekday {
  // The modulo is made positive rather than the caller being told not to ask.
  // `dayOf` answers 0, or less, for an hour before the departure horn — the
  // flashbacks are full of them — and `(0 - 1) % 7` is `-1` in JavaScript, so
  // this used to hand back `undefined` wearing the `Weekday` type. Found by
  // `noUncheckedIndexedAccess`, which is the whole argument for the flag.
  const index = (((dayOf(hours) - 1) % 7) + 7) % 7
  return WEEKDAYS[index]!
}

/** Local wall clock, `HH:MM`. */
export function clockOf(hours: number): string {
  const timeOfDay = (((hours + DEPARTURE_TIME_OF_DAY) % 24) + 24) % 24
  const minutes = Math.round(timeOfDay * 60) % (24 * 60)
  const hh = Math.floor(minutes / 60)
  return `${String(hh).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/**
 * `Day 3 · Tuesday · 01:27`, from the widest unit down, as data/CONVENTIONS.md
 * reads them.
 *
 * The weekday is only written on a stated time. It is deduced from a single
 * panel, and hanging it on an estimate would lend the estimate that panel's
 * authority; the `≈` marks the estimate for the same reason.
 */
export function formatVoyageTime(time: VoyageTime): string {
  if (time.basis === 'bracketed') return formatBracket(time)
  const approximate = time.basis === 'derived'
  const prefix = approximate ? '≈ ' : ''

  if (time.hours === undefined) {
    const day = dayOf(time.earliest)
    return approximate ? `≈ Day ${day}` : `Day ${day} · ${WEEKDAYS[(day - 1) % 7]}`
  }

  const day = dayOf(time.hours)
  const span = time.latest !== null && time.latest > time.hours ? `-${clockOf(time.latest)}` : ''
  const weekday = approximate ? '' : `${weekdayOf(time.hours)} · `
  return `${prefix}Day ${day} · ${weekday}${clockOf(time.hours)}${span}`
}

/** `Day 4 – Day 8`, or `after Day 12` once past the last anchor. */
export function formatBracket(time: VoyageTime): string {
  const from = dayOf(time.earliest)
  if (time.latest === null) return `after Day ${from}`
  const to = dayOf(time.latest)
  return from === to ? `Day ${from}` : `Day ${from} – Day ${to}`
}

/** An event as the clock needs to see it: in order, with what canon declared. */
export interface ClockableEvent {
  /** Whether the event happens on the voyage at all — see `hasVoyageTime`. */
  onVoyage: boolean
  occurredAt?: DeclaredTime
}

/**
 * Widen every event to the interval its neighbours allow, in chronological
 * order.
 *
 * Two sweeps, and both are needed: forward, an event cannot precede the last
 * time already fixed behind it; backward, it cannot follow the first time
 * fixed ahead of it. A declared time keeps its own bounds — a stated span
 * (Woody, found between 12:15 and 12:30) keeps the span, a stated instant
 * collapses to it, and a bare day widens to that day.
 *
 * Events off the voyage — everything before the horn, and the flashbacks a
 * later chapter drops in — are returned as `undefined` rather than clamped to
 * hour 0: they are not late in the voyage, they are outside it.
 */
export function bracket(events: readonly ClockableEvent[]): (VoyageTime | undefined)[] {
  const own: (VoyageTime | undefined)[] = events.map((event) => {
    if (!event.onVoyage) return undefined
    const declared = event.occurredAt
    if (!declared) return { basis: 'bracketed', earliest: 0, latest: null }
    if (declared.hours !== undefined) {
      return {
        basis: declared.basis,
        source: declared.source,
        hours: declared.hours,
        earliest: declared.hours,
        latest: declared.hoursUntil ?? declared.hours,
      }
    }
    // A day without a clock stays a day: the basis says the day is sourced,
    // the bounds say the hour inside it is not.
    const span = spanOfDay(declared.day!)
    return { basis: declared.basis, source: declared.source, earliest: span.from, latest: span.to }
  })

  let floor = 0
  for (const time of own) {
    if (!time) continue
    time.earliest = Math.max(time.earliest, floor)
    floor = time.earliest
  }

  let ceiling: number | null = null
  for (let index = own.length - 1; index >= 0; index -= 1) {
    const time = own[index]
    if (!time) continue
    if (ceiling !== null)
      time.latest = time.latest === null ? ceiling : Math.min(time.latest, ceiling)
    ceiling = time.latest
  }

  return own
}

/** The two orders an event carries, plus the anchor that may move it. */
export interface CuratedOrder {
  chapter: number
  sequence: number
  title: string
  /** Title of the event this one immediately follows, whatever the chapters say. */
  occursAfterTitle?: string
}

/**
 * The order things happened in, out of a file written in reading order.
 *
 * Chapters are the default: a curated log lists them in publication order and
 * that is usually the order aboard the ship too. `occursAfterTitle` is the
 * exception a late chapter forces — 373 shows Camilla getting up again from a
 * fight chapter 364 already set up — and it wins, because it is the only field
 * that speaks about chronology rather than about pages.
 *
 * This mirrors the ordinal the backfill writes to the database, so a bracket
 * computed here and one computed from stored ordinals agree.
 */
export function curatedChronology<T extends CuratedOrder>(events: readonly T[]): T[] {
  const ordered = [...events].sort(
    (left, right) => left.chapter - right.chapter || left.sequence - right.sequence,
  )

  for (const event of events) {
    if (!event.occursAfterTitle) continue
    const from = ordered.indexOf(event)
    if (from === -1) continue
    ordered.splice(from, 1)
    const anchor = ordered.findIndex((candidate) => candidate.title === event.occursAfterTitle)
    ordered.splice(anchor === -1 ? from : anchor + 1, 0, event)
  }

  return ordered
}

/**
 * Whether an event is on the voyage clock at all.
 *
 * Chapter 359 is the horn; everything earlier is Kakin, Heaven's Arena or the
 * eve. Chapters 396 and 397 are Meteor City, decades back. A flashback carries
 * the date of what it shows, not of the chapter that shows it, and canon dates
 * none of them in voyage hours.
 *
 * This is deliberately the same rule the backfill uses for `occursOnBlackWhale`
 * minus one case: Kacho and Fugetsu leave the ship on a lifeboat, so their
 * escape is off the *ship* while staying very much on the *clock*. Place and
 * time are separate questions.
 */
export function hasVoyageTime(event: { chapter: number; isFlashback?: boolean }): boolean {
  if (event.isFlashback) return false
  if (event.chapter < 359) return false
  return event.chapter !== 396 && event.chapter !== 397
}
