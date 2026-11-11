import { describe, expect, it } from 'vitest'
import { readReconstructionUrl, sortChronologicalEvents, writeReconstructionUrl } from './urlState'

describe('reconstruction URL state', () => {
  it('uses stable defaults for a bare URL', () => {
    expect(readReconstructionUrl(new URLSearchParams())).toEqual({
      eventId: null,
      view: 'overview',
      follow: null,
      changesOnly: false,
      certainty: 'all',
      observer: 'canon',
    })
  })

  it('round-trips the shareable controls', () => {
    const query = writeReconstructionUrl({
      eventId: 'event 401',
      view: 'scene',
      follow: 'body-1',
      changesOnly: true,
      certainty: 'PROBABLE',
      observer: 'kurapika',
    })
    expect(readReconstructionUrl(new URLSearchParams(query))).toMatchObject({
      eventId: 'event 401',
      view: 'scene',
      follow: 'body-1',
      changesOnly: true,
      observer: 'kurapika',
    })
  })
})

describe('reconstruction chronology', () => {
  it('keeps an unnumbered event in its chapter instead of appending it to the timeline', () => {
    const ordered = sortChronologicalEvents([
      { number: 390, events: [{ id: '390', ordinal: null, sequence: 2 }] },
      { number: 391, events: [{ id: '391', ordinal: 97, sequence: 1 }] },
    ])
    expect(ordered.map((entry) => entry.event.id)).toEqual(['390', '391'])
  })
})
