import { describe, expect, it } from 'vitest'
import { mangaEventFor, type MangaEventCandidate } from './mangaEvent'
import { mangaView } from './mangaViewModel'

const events: MangaEventCandidate[] = [
  { id: 'ch-359-2', chapter: { number: 359 }, sequence: 2, title: 'Banquet' },
  { id: 'ch-359-4', chapter: { number: 359 }, sequence: 4, title: 'Farewell' },
]

const view = (chapter: number, eventSequence?: number, eventTitle?: string) =>
  mangaView({
    id: `chapter-${chapter}-${eventSequence ?? 'first'}`,
    spaceId: 'test-space',
    at: [0, 0],
    target: [0, 1],
    pitch: 0,
    chapter,
    eventSequence,
    eventTitle,
    label: 'Test view',
    labelFr: 'Vue de test',
  })

describe('manga event selection', () => {
  it('selects the exact sequence named by a populated panel', () => {
    expect(mangaEventFor(events, view(359, 4))?.id).toBe('ch-359-4')
  })

  it('uses the first chapter event when the view does not name a sequence', () => {
    expect(mangaEventFor(events, view(359))?.id).toBe('ch-359-2')
  })

  it('uses the title to disambiguate equal chapter sequences', () => {
    const tied = [
      ...events,
      { id: 'ch-359-4-flashback', chapter: { number: 359 }, sequence: 4, title: 'Flashback' },
    ]

    expect(mangaEventFor(tied, view(359, 4, 'Flashback'))?.id).toBe('ch-359-4-flashback')
  })

  it('returns no event instead of borrowing an unrelated final event', () => {
    expect(mangaEventFor(events, view(358, 1))).toBeNull()
    expect(mangaEventFor(events, null)).toBeNull()
  })
})
