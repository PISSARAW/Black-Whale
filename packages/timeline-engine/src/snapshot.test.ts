import { describe, expect, it } from 'vitest'
import {
  buildCanonicalPositions,
  filterPresencesByBodies,
  resolveVisibleBodyIds,
} from './snapshot.js'

describe('resolveVisibleBodyIds', () => {
  it('keeps the bodies of visible characters', () => {
    const visible = resolveVisibleBodyIds(
      { bodies: [{ id: 'b1', originalCharacterId: 'c1' }], appearances: [] },
      new Set(['c1']),
    )

    expect([...visible]).toEqual(['b1'])
  })

  it('drops the bodies of characters the reader has not met', () => {
    const visible = resolveVisibleBodyIds(
      { bodies: [{ id: 'b2', originalCharacterId: 'spoiler' }], appearances: [] },
      new Set(['c1']),
    )

    expect([...visible]).toEqual([])
  })

  /** The reader has seen the face even if the owner is still unrevealed. */
  it('keeps a hidden body wearing the appearance of a visible character', () => {
    const visible = resolveVisibleBodyIds(
      {
        bodies: [{ id: 'b2', originalCharacterId: 'spoiler' }],
        appearances: [{ entityId: 'b2', appearanceCharacterId: 'c1' }],
      },
      new Set(['c1']),
    )

    expect([...visible]).toEqual(['b2'])
  })

  it('drops an ownerless body nobody is impersonating', () => {
    const visible = resolveVisibleBodyIds(
      { bodies: [{ id: 'conjured' }], appearances: [] },
      new Set(['c1']),
    )

    expect([...visible]).toEqual([])
  })
})

describe('filterPresencesByBodies', () => {
  it('keeps only presences of visible bodies', () => {
    const presences = [{ entityId: 'b1' }, { entityId: 'b2' }]

    expect(filterPresencesByBodies(presences, new Set(['b1']))).toEqual([{ entityId: 'b1' }])
  })
})

describe('buildCanonicalPositions', () => {
  it('keys a position by the owner of the occupied body', () => {
    const positions = buildCanonicalPositions({
      bodies: [{ id: 'b1', originalCharacterId: 'c1' }],
      presences: [{ entityId: 'b1', locationId: 'deck', certainty: 'CONFIRMED' }],
    })

    expect(positions).toEqual({ c1: { locationId: 'deck', certainty: 'CONFIRMED' } })
  })

  /** Filtering presences by character id instead would lose this position. */
  it('reports a transferred consciousness at the body it now inhabits', () => {
    const positions = buildCanonicalPositions({
      bodies: [
        { id: 'body-of-c1', originalCharacterId: 'c1' },
        { id: 'body-of-c2', originalCharacterId: 'c2' },
      ],
      presences: [
        { entityId: 'body-of-c1', locationId: 'tier-1' },
        { entityId: 'body-of-c2', locationId: 'tier-5' },
      ],
    })

    expect(positions.c1.locationId).toBe('tier-1')
    expect(positions.c2.locationId).toBe('tier-5')
  })

  it('falls back to the body id when the body has no owner', () => {
    const positions = buildCanonicalPositions({
      bodies: [{ id: 'conjured' }],
      presences: [{ entityId: 'conjured', locationId: 'casino' }],
    })

    expect(positions.conjured).toEqual({ locationId: 'casino', certainty: 'CONFIRMED' })
  })

  it('defaults a missing location to null and a missing certainty to CONFIRMED', () => {
    const positions = buildCanonicalPositions({
      bodies: [{ id: 'b1', originalCharacterId: 'c1' }],
      presences: [{ entityId: 'b1' }],
    })

    expect(positions.c1).toEqual({ locationId: null, certainty: 'CONFIRMED' })
  })

  it('tolerates an empty snapshot', () => {
    expect(buildCanonicalPositions({})).toEqual({})
  })
})
