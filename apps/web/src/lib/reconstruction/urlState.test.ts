import { describe, expect, it } from 'vitest'
import { readReconstructionUrl, writeReconstructionUrl } from './urlState'

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
