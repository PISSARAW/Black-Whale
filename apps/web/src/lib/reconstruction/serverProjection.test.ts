import { describe, expect, it } from 'vitest'
import {
  capPresenceEnds,
  locationSpoilerWhere,
  presenceSpoilerWhere,
  worldEventSpoilerWhere,
} from './serverProjection'

describe('reconstruction server spoiler projection', () => {
  it('filters every independently revealable record at the database boundary', () => {
    expect(presenceSpoilerWhere(390)).toMatchObject({
      entityType: 'BODY',
      fromEvent: { chapter: { number: { lte: 390 } } },
    })
    expect(locationSpoilerWhere(390)).toEqual({
      firstVisibleEvent: { chapter: { number: { lte: 390 } } },
    })
    expect(worldEventSpoilerWhere(390)).toEqual({
      branchId: 'canon',
      chapterNumber: { lte: 390 },
      OR: [{ revealedAtChapter: null }, { revealedAtChapter: { lte: 390 } }],
    })
  })

  it('removes a future end boundary without removing the visible presence', () => {
    const rows = [
      { id: 'future', untilEvent: { id: 'secret', chapter: { number: 401 } } },
      { id: 'visible', untilEvent: { id: 'known', chapter: { number: 390 } } },
    ]
    expect(capPresenceEnds(rows, 390)).toEqual([
      { id: 'future', untilEvent: null },
      { id: 'visible', untilEvent: { id: 'known', chapter: { number: 390 } } },
    ])
  })
})
