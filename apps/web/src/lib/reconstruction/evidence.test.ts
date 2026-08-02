import { describe, expect, it } from 'vitest'
import { claimLevel, evidenceForEvent } from './evidence'

describe('reconstruction evidence', () => {
  it('always anchors a scene to its chapter and deduplicates transition sources', () => {
    expect(
      evidenceForEvent({
        chapterNumber: 401,
        eventId: 'event-1',
        sourceIds: ['panel-1', 'panel-1'],
      }),
    ).toEqual([
      { id: 'chapter-401', level: 'attested', label: 'Chapter 401', detail: 'event-1' },
      { id: 'panel-1', level: 'attested', label: 'panel-1', detail: null },
    ])
  })

  it('distinguishes stated, derived and uncertain spatial claims', () => {
    expect(
      evidenceForEvent({
        chapterNumber: 401,
        eventId: 'event-1',
        occurredAtBasis: 'derived',
        occurredAtSource: 'weekly-banquet',
      })[1],
    ).toMatchObject({ level: 'derived', detail: 'weekly-banquet' })
    expect(claimLevel('CONFIRMED', 'EXACT_ROOM')).toBe('attested')
    expect(claimLevel('CONFIRMED', 'TIER')).toBe('derived')
    expect(claimLevel('PROBABLE', 'EXACT_ROOM')).toBe('inferred')
  })
})
