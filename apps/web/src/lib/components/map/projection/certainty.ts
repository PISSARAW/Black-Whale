import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/config'
import { messagesFor } from '$lib/i18n'

import type { MapEvent, MapPresence } from './types'

/** How far into the story the reader has got: the event, and its sequence. */
interface ReadingMoment {
  currentEvent: MapEvent | null | undefined
  currentSequence: number
}

type TemporalMessages = ReturnType<typeof messagesFor>['map']['temporal']

/**
 * The three certainties that never reach the timeline: the archive is not sure
 * enough of the position for the question "since when" to mean anything.
 */
function unconfirmedVisual(certainty: MapPresence['certainty'], m: TemporalMessages) {
  if (certainty === 'PROBABLE') {
    return { color: '#f0b75e', label: m.assumedPosition, detail: m.assumedDetail }
  }
  if (certainty === 'LAST_KNOWN') {
    return { color: '#e47f61', label: m.lastKnown, detail: m.lastKnownDetail }
  }
  if (certainty !== 'CONFIRMED') {
    return { color: '#8a9798', label: m.unknownStatus, detail: m.unknownDetail }
  }
  return null
}

/**
 * How close the presence starts to where the reader stands: at the very event
 * they are on, or somewhere in the chapter it belongs to.
 */
function startsWithin(presence: MapPresence, currentEvent: MapEvent | null | undefined) {
  return {
    atEvent: presence.fromEventId === currentEvent?.id,
    inChapter: Boolean(
      presence.fromEvent?.chapterId && presence.fromEvent.chapterId === currentEvent?.chapterId,
    ),
  }
}

/** A confirmed position, dated against the moment the reader has reached. */
function confirmedVisual(presence: MapPresence, now: ReadingMoment, m: TemporalMessages) {
  const { currentEvent, currentSequence } = now
  const fromSequence = presence.fromEvent?.sequence ?? '?'
  const untilSequence = presence.untilEvent?.sequence

  if (untilSequence !== undefined && untilSequence !== null) {
    return {
      color: '#ad8bea',
      label: m.confirmedPeriod,
      detail: m.periodDetail(fromSequence, untilSequence),
    }
  }
  const { atEvent, inChapter } = startsWithin(presence, currentEvent)
  if (atEvent) {
    return {
      color: '#55d1e2',
      label: m.confirmedAtEvent,
      detail: m.eventDetail(currentSequence),
    }
  }
  if (inChapter) {
    return {
      color: '#6ac890',
      label: m.confirmedInChapter,
      detail: m.sinceDetail(fromSequence),
    }
  }
  return {
    color: '#5bb9ad',
    label: m.confirmedPresence,
    detail: m.sinceDetail(fromSequence),
  }
}

export function getTemporalVisual(
  presence: MapPresence,
  now: ReadingMoment,
  locale: Locale = DEFAULT_LOCALE,
) {
  const m = messagesFor(locale).map.temporal
  return unconfirmedVisual(presence.certainty, m) ?? confirmedVisual(presence, now, m)
}
