import { describe, expect, it } from 'vitest'
import { compareEventOrder, isActiveAt, isRevealed, type OrderedEvent } from '../src/ordering.js'

function event(chapter: number, sequence: number, ordinal?: number | null): OrderedEvent {
  return { chapter: { number: chapter }, sequence, ordinal }
}

describe('compareEventOrder', () => {
  it('orders by chapter first when no ordinals are known', () => {
    expect(compareEventOrder(event(401, 9), event(402, 1))).toBeLessThan(0)
  })

  it('falls back to the local sequence inside a chapter', () => {
    expect(compareEventOrder(event(401, 1), event(401, 2))).toBeLessThan(0)
    expect(compareEventOrder(event(401, 2), event(401, 2))).toBe(0)
  })

  it('prefers ordinals, so a flashback sorts before the chapter that reveals it', () => {
    // Chapter 410 tells a scene that happened before chapter 401's events.
    const flashback = event(410, 1, 5)
    const present = event(401, 1, 42)
    expect(compareEventOrder(flashback, present)).toBeLessThan(0)
  })

  it('ignores an ordinal that only one side carries', () => {
    // Comparing a placed event to an unplaced one falls back to reading order,
    // which is the only thing both sides agree on.
    expect(compareEventOrder(event(410, 1, 5), event(401, 1))).toBeGreaterThan(0)
  })
})

describe('isRevealed', () => {
  it('reveals an event at or before the reader is', () => {
    expect(isRevealed(event(401, 1), 401)).toBe(true)
    expect(isRevealed(event(400, 1), 401)).toBe(true)
  })

  it('hides an event from a later chapter', () => {
    expect(isRevealed(event(402, 1), 401)).toBe(false)
  })
})

describe('isActiveAt', () => {
  const target = event(405, 3, 30)

  it('holds from the event that opens it', () => {
    expect(isActiveAt({ fromEvent: target }, target)).toBe(true)
  })

  it('does not hold before it opens', () => {
    expect(isActiveAt({ fromEvent: event(406, 1, 40) }, target)).toBe(false)
  })

  it('stays open when there is no closing event', () => {
    expect(isActiveAt({ fromEvent: event(401, 1, 10), untilEvent: null }, target)).toBe(true)
  })

  it('stops at the event that closes it', () => {
    // A record closed by the target event no longer holds at that event.
    expect(isActiveAt({ fromEvent: event(401, 1, 10), untilEvent: target }, target)).toBe(false)
  })

  it('still holds while the closing event is in the future', () => {
    const record = { fromEvent: event(401, 1, 10), untilEvent: event(410, 1, 90) }
    expect(isActiveAt(record, target)).toBe(true)
  })

  it('does not report a record as active before the reader reaches its chapter', () => {
    // This is what the chapter guard buys over compareEventOrder alone: the
    // record opens at an earlier ordinal, but in a chapter not yet published.
    const laterChapterEarlierOrdinal = event(412, 1, 5)
    const readingAt = event(402, 1, 20)
    expect(compareEventOrder(laterChapterEarlierOrdinal, readingAt)).toBeLessThan(0)
    expect(isActiveAt({ fromEvent: laterChapterEarlierOrdinal }, readingAt)).toBe(false)
  })

  it('keeps a record open when its end is only revealed in a later chapter', () => {
    // The reader is at chapter 402 and must not learn the record ever ends.
    const record = { fromEvent: event(401, 1, 10), untilEvent: event(412, 1, 8) }
    expect(isActiveAt(record, event(402, 1, 20))).toBe(true)
  })
})
