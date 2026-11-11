import { describe, expect, it } from 'vitest'
import { mangaEventFor, type MangaEventCandidate } from './mangaEvent'
import { mangaView } from './mangaViewModel'

const events: MangaEventCandidate[] = [
  { id: 'ch-359-2', chapter: { number: 359 }, sequence: 2 },
  { id: 'ch-359-4', chapter: { number: 359 }, sequence: 4 },
]

const view = (chapter: number, eventSequence?: number) =>
  mangaView({
    id: `chapter-${chapter}-${eventSequence ?? 'first'}`,
    spaceId: 'test-space',
    at: [0, 0],
    target: [0, 1],
    pitch: 0,
    chapter,
    eventSequence,
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

  it('returns no event instead of borrowing an unrelated final event', () => {
    expect(mangaEventFor(events, view(358, 1))).toBeNull()
    expect(mangaEventFor(events, null)).toBeNull()
  })
})
