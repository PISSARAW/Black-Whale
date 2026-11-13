import { describe, expect, it } from 'vitest'
import { auraObjectsThrough, auraTracesThrough } from './auraSources'

describe('dated aura sources', () => {
  it('keeps only active declared traces visible at the selected chapter', () => {
    const uses = [
      {
        id: 'active',
        chapter: 390,
        status: 'ACTIVATED',
        auraTrace: { locationId: 'room', persistsUntilChapter: 392 },
      },
      { id: 'presence', chapter: 390, status: 'OBSERVED' },
    ]
    expect(auraTracesThrough(uses, 389)).toEqual([])
    expect(auraTracesThrough(uses, 391)).toEqual([
      expect.objectContaining({ id: 'active', locationId: 'room' }),
    ])
    expect(auraTracesThrough(uses, 393)).toEqual([])
  })

  it('maps exact and zoned aura objects, but never a tier-only location', () => {
    const object = (precision: string) => ({
      id: precision,
      canonicalName: precision,
      aura: {
        fromChapter: 388,
        kind: 'test',
        visibility: 'gyo' as const,
        sourceChapterId: 'ch-388',
      },
      sightings: [{ fromChapter: 388, locationSlug: 'room', precision }],
    })
    expect(auraObjectsThrough([object('EXACT_ROOM'), object('ZONE'), object('TIER')], 387)).toEqual(
      [],
    )
    expect(
      auraObjectsThrough([object('EXACT_ROOM'), object('ZONE'), object('TIER')], 388),
    ).toHaveLength(2)
  })
})
