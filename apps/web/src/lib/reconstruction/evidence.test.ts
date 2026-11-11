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
      { id: 'chapter-401', level: 'attested', subject: { kind: 'chapter', chapter: 401 } },
      {
        id: 'panel-1',
        level: 'derived',
        subject: { kind: 'source', chapter: null, page: null, description: null, href: null },
      },
    ])
  })

  it('never puts an internal id where a reader will read it', () => {
    const evidence = evidenceForEvent({ chapterNumber: 401, eventId: 'c860f365-uuid' })
    expect(JSON.stringify(evidence.map((item) => item.subject))).not.toContain('c860f365')
  })

  it('reads a resolved source instead of its id', () => {
    const [, source] = evidenceForEvent({
      chapterNumber: 401,
      eventId: 'event-1',
      sourceIds: ['panel-1'],
      sources: [
        {
          id: 'panel-1',
          chapterNumber: 401,
          page: 12,
          description: 'Kurapika at the door',
          kind: 'manga',
          href: '/timeline?chapter=401',
        },
      ],
    })
    expect(source).toEqual({
      id: 'panel-1',
      level: 'attested',
      subject: {
        kind: 'source',
        chapter: 401,
        page: 12,
        description: 'Kurapika at the door',
        href: '/timeline?chapter=401',
      },
    })
  })

  it('distinguishes stated, derived and uncertain spatial claims', () => {
    expect(
      evidenceForEvent({
        chapterNumber: 401,
        eventId: 'event-1',
        occurredAtBasis: 'derived',
        occurredAtSource: 'community',
      })[1],
    ).toMatchObject({
      level: 'derived',
      subject: { kind: 'time', basis: 'derived', source: 'community' },
    })
    expect(claimLevel('CONFIRMED', 'EXACT_ROOM')).toBe('attested')
    expect(claimLevel('CONFIRMED', 'TIER')).toBe('derived')
    expect(claimLevel('PROBABLE', 'EXACT_ROOM')).toBe('inferred')
  })
})
