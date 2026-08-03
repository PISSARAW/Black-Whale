import { describe, expect, it } from 'vitest'
import { readLegacySequence, selectEvent } from './selection.js'

const events = [
  { id: 'c1-a', sequence: 1 },
  { id: 'c1-b', sequence: 2 },
  { id: 'c2-a', sequence: 1 },
  { id: 'c2-b', sequence: 2 },
]

describe('selectEvent', () => {
  it('selects by event id', () => {
    expect(selectEvent(events, { eventId: 'c1-b' })).toEqual({ event: events[1], index: 1 })
  })

  it('falls back to the last event when nothing is requested', () => {
    expect(selectEvent(events, {})).toEqual({ event: events[3], index: 3 })
  })

  it('falls back to the last event when the id is unknown', () => {
    expect(selectEvent(events, { eventId: 'nope' }).event).toBe(events[3])
  })

  /**
   * Sequence repeats across chapters. Old links carry only the number, and
   * resolving it forwards would silently rewind the reader to chapter 1.
   */
  it('resolves a legacy sequence to its latest occurrence', () => {
    expect(selectEvent(events, { sequence: 1 })).toEqual({ event: events[2], index: 2 })
  })

  it('prefers the event id over a legacy sequence', () => {
    expect(selectEvent(events, { eventId: 'c1-a', sequence: 2 }).event).toBe(events[0])
  })

  it('reports index 0 and a null event on an empty timeline', () => {
    expect(selectEvent([], { eventId: 'c1-a' })).toEqual({ event: null, index: 0 })
  })
})

describe('readLegacySequence', () => {
  it('reads an integer', () => {
    expect(readLegacySequence('12')).toBe(12)
  })

  it.each([null, undefined, '', '  ', 'abc', '1.5'])(
    'rejects %o rather than yielding NaN',
    (raw) => {
      expect(readLegacySequence(raw)).toBeUndefined()
    },
  )
})
