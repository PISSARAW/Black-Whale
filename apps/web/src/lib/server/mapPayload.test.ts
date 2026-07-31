import { describe, expect, it } from 'vitest'
import { trimRow, trimWorldStateForMap } from './mapPayload'

const joinedEvent = {
  id: 'event-1',
  chapterId: 'chapter-358',
  sequence: 1,
  ordinal: 30,
  isFlashback: false,
  title: 'Boarding the Black Whale',
  summary: 'Passengers board the ship.',
  occurredAtLabel: null,
  chapter: { id: 'chapter-358', number: 358, title: 'Eve' },
}

describe('trimRow', () => {
  it('keeps the keys the map reads off a join', () => {
    const trimmed = trimRow({ id: 'presence-1', fromEvent: joinedEvent })

    expect(trimmed.fromEvent).toEqual({
      id: 'event-1',
      chapterId: 'chapter-358',
      sequence: 1,
      ordinal: 30,
    })
  })

  it('drops the chapter, the title and the rest of the join', () => {
    const trimmed = trimRow({ id: 'presence-1', fromEvent: joinedEvent })

    expect(trimmed.fromEvent).not.toHaveProperty('chapter')
    expect(trimmed.fromEvent).not.toHaveProperty('title')
    expect(trimmed.fromEvent).not.toHaveProperty('summary')
  })

  it('leaves everything that is not a join alone', () => {
    const trimmed = trimRow({
      id: 'presence-1',
      entityId: 'body-1',
      locationId: 'room-1001',
      precision: 'EXACT_ROOM',
      fromEvent: joinedEvent,
    })

    expect(trimmed).toMatchObject({
      id: 'presence-1',
      entityId: 'body-1',
      locationId: 'room-1001',
      precision: 'EXACT_ROOM',
    })
  })

  /** A null `untilEvent` means the presence is open, which the map reads. */
  it('keeps a null join null rather than inventing an event', () => {
    const trimmed = trimRow({ id: 'presence-1', fromEvent: joinedEvent, untilEvent: null })

    expect(trimmed.untilEvent).toBeNull()
    expect('untilEvent' in trimmed).toBe(true)
  })

  it('leaves a join the row never had absent', () => {
    const trimmed = trimRow({ id: 'body-1' })

    expect('fromEvent' in trimmed).toBe(false)
    expect('firstVisibleEvent' in trimmed).toBe(false)
  })

  it('omits the ordinal only when the row never stated one', () => {
    const { ordinal: _ordinal, ...noOrdinal } = joinedEvent

    expect(trimRow({ fromEvent: noOrdinal }).fromEvent).not.toHaveProperty('ordinal')
    expect(trimRow({ fromEvent: { ...joinedEvent, ordinal: null } }).fromEvent).toHaveProperty(
      'ordinal',
      null,
    )
  })
})

describe('trimWorldStateForMap', () => {
  it('trims every collection that carries joins', () => {
    const trimmed = trimWorldStateForMap({
      characters: [{ id: 'character-1', firstVisibleEvent: joinedEvent }],
      bodies: [{ id: 'body-1', firstVisibleEvent: joinedEvent }],
      consciousnesses: [{ id: 'mind-1', firstVisibleEvent: joinedEvent }],
      presences: [{ id: 'presence-1', fromEvent: joinedEvent, untilEvent: joinedEvent }],
      occupancies: [{ id: 'occupancy-1', fromEvent: joinedEvent }],
      appearances: [{ id: 'appearance-1', fromEvent: joinedEvent }],
    })

    const rows = Object.values(trimmed).flat() as Record<string, unknown>[]
    expect(rows).toHaveLength(6)
    for (const row of rows) {
      for (const join of ['fromEvent', 'untilEvent', 'firstVisibleEvent']) {
        if (row[join]) expect(row[join]).not.toHaveProperty('chapter')
      }
    }
  })

  it('leaves collections it does not know, and scalars, untouched', () => {
    const trimmed = trimWorldStateForMap({
      bodyStates: { 'body-1': 'ALIVE' },
      locations: [{ id: 'room-1001', name: 'Room 1001' }],
      atEventId: 'event-1',
    })

    expect(trimmed).toEqual({
      bodyStates: { 'body-1': 'ALIVE' },
      locations: [{ id: 'room-1001', name: 'Room 1001' }],
      atEventId: 'event-1',
    })
  })

  it('survives a snapshot that carries none of the collections', () => {
    expect(trimWorldStateForMap({})).toEqual({})
  })
})
