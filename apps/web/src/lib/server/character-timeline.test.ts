import { describe, expect, it } from 'vitest'
import {
  activeAtChapter,
  buildChapterTrajectory,
  buildLocationPaths,
  buildTimeline,
} from './character-timeline.js'

const event = (chapter: number, sequence: number, extra: Record<string, unknown> = {}) => ({
  chapter: { number: chapter },
  sequence,
  title: `ch${chapter}`,
  ...extra,
})

const emptyBody = { presences: [], states: [] }

describe('buildLocationPaths', () => {
  it('joins a location to its parents', () => {
    const paths = buildLocationPaths([
      { id: 'black-whale-1', name: 'Black Whale 1', parentLocationId: null },
      { id: 'tier-1', name: 'Tier 1', parentLocationId: 'black-whale-1' },
      { id: 'banquet', name: 'Banquet Hall', parentLocationId: 'tier-1' },
    ])

    expect(paths.get('banquet')).toBe('Tier 1 › Banquet Hall')
  })

  /** The ship is the whole setting; prefixing every path with it says nothing. */
  it('does not prefix paths with the ship itself', () => {
    const paths = buildLocationPaths([
      { id: 'black-whale-1', name: 'Black Whale 1', parentLocationId: null },
      { id: 'tier-1', name: 'Tier 1', parentLocationId: 'black-whale-1' },
    ])

    expect(paths.get('tier-1')).toBe('Tier 1')
  })

  it('keeps an orphan location addressable by its own name', () => {
    const paths = buildLocationPaths([{ id: 'lost', name: 'Nowhere', parentLocationId: 'gone' }])

    expect(paths.get('lost')).toBe('Nowhere')
  })
})

describe('activeAtChapter', () => {
  const record = { fromEvent: event(3, 1), untilEvent: { chapter: { number: 7 } } }

  it.each([3, 5, 7])('is active at chapter %i', (chapter) => {
    expect(activeAtChapter(record, chapter)).toBe(true)
  })

  it.each([2, 8])('is inactive at chapter %i', (chapter) => {
    expect(activeAtChapter(record, chapter)).toBe(false)
  })

  it('stays active forever without an end', () => {
    expect(activeAtChapter({ fromEvent: event(3, 1) }, 999)).toBe(true)
  })
})

describe('buildTimeline', () => {
  const paths = new Map<string, string>()

  it('orders entries by chapter then sequence', () => {
    const character = {
      originalBody: {
        presences: [],
        states: [
          { state: 'ALIVE', fromEvent: event(5, 2) },
          { state: 'WOUNDED', fromEvent: event(5, 1) },
          { state: 'BORN', fromEvent: event(1, 9) },
        ],
      },
    }

    const timeline = buildTimeline(character, {}, paths)

    expect(timeline.map((entry) => entry.label)).toEqual(['BORN', 'WOUNDED', 'ALIVE'])
  })

  it('records a consciousness moving into another body', () => {
    const character = {
      originalBody: emptyBody,
      originalConsciousness: {
        states: [],
        occupancies: [
          {
            fromEvent: event(4, 1),
            certainty: 'CONFIRMED',
            body: { character: { canonicalName: 'Woble' }, presences: [] },
          },
        ],
      },
    }

    const [entry] = buildTimeline(character, {}, paths)

    expect(entry.kind).toBe('consciousness-location')
    expect(entry.label).toBe('Corps de Woble')
  })

  /** The catalogue covers states the temporal tables have no rows for. */
  it('adds exceptional catalogue appearances', () => {
    const timeline = buildTimeline({ originalBody: emptyBody }, {
      mangaAppearances: [
        { chapter: 2, status: 'debut', title: 'Departure' },
        { chapter: 3, status: 'pictured', title: 'Poster' },
      ],
    }, paths)

    expect(timeline.map((entry) => entry.label)).toEqual(['debut', 'pictured'])
  })

  it('ignores catalogue appearances that are not exceptional', () => {
    const timeline = buildTimeline({ originalBody: emptyBody }, {
      mangaAppearances: [{ chapter: 2, status: 'mentioned', title: 'Rumour' }],
    }, paths)

    expect(timeline).toEqual([])
  })

  /** The database already carries the death; the catalogue must not repeat it. */
  it('drops a catalogue death already recorded as a body state', () => {
    const character = {
      originalBody: { presences: [], states: [{ state: 'DEAD', fromEvent: event(9, 1) }] },
    }

    const timeline = buildTimeline(character, {
      mangaAppearances: [{ chapter: 9, status: 'death', title: 'Killed' }],
    }, paths)

    expect(timeline).toHaveLength(1)
    expect(timeline[0].kind).toBe('body-state')
  })

  it('returns nothing for a character with no records at all', () => {
    expect(buildTimeline(null, {}, paths)).toEqual([])
  })
})

describe('buildChapterTrajectory', () => {
  const paths = new Map<string, string>()

  it('falls back to an explicit unknown position', () => {
    const timeline = [
      { chapter: 4, sequence: 1, kind: 'body-state' as const, label: 'WOUNDED' },
    ]

    const [chapter] = buildChapterTrajectory(timeline, null, { id: 'x' }, [], paths)

    expect(chapter.visits).toHaveLength(1)
    expect(chapter.visits[0]).toMatchObject({ subject: 'character', certainty: 'UNKNOWN' })
  })

  it('flags a chapter where the same subject changes location', () => {
    const timeline = [
      { chapter: 4, sequence: 1, kind: 'body-location' as const, label: 'Casino', location: 'Casino' },
      { chapter: 4, sequence: 2, kind: 'body-location' as const, label: 'Deck', location: 'Deck' },
    ]

    const [chapter] = buildChapterTrajectory(timeline, null, { id: 'x' }, [], paths)

    expect(chapter.isMovement).toBe(true)
    expect(chapter.visits.map((visit) => visit.location)).toEqual(['Casino', 'Deck'])
  })

  it('does not flag movement when the character stays put', () => {
    const timeline = [
      { chapter: 4, sequence: 1, kind: 'body-location' as const, label: 'Casino', location: 'Casino' },
      { chapter: 4, sequence: 2, kind: 'body-location' as const, label: 'casino ', location: 'casino ' },
    ]

    const [chapter] = buildChapterTrajectory(timeline, null, { id: 'x' }, [], paths)

    expect(chapter.visits).toHaveLength(1)
    expect(chapter.isMovement).toBe(false)
  })

  /**
   * A flashback is revealed in a chapter but does not happen there; treating it
   * as a position teleports the character across the ship.
   */
  it('excludes flashbacks from the chapters a character passes through', () => {
    const timeline = [
      {
        chapter: 4,
        sequence: 1,
        kind: 'body-location' as const,
        label: 'Casino',
        location: 'Casino',
        isFlashback: true,
      },
    ]

    expect(buildChapterTrajectory(timeline, null, { id: 'x' }, [], paths)).toEqual([])
  })

  it('picks up chapters from the catalogue when the character is involved', () => {
    const chapters = [
      {
        number: 6,
        timeline: [
          { charactersInvolved: ['x'], location: 'Bridge', event: 'Meeting', isFlashback: false },
        ],
      },
    ]

    const [chapter] = buildChapterTrajectory([], null, { id: 'x' }, chapters, paths)

    expect(chapter.chapter).toBe(6)
    expect(chapter.visits[0]).toMatchObject({ location: 'Bridge', subject: 'character' })
  })
})
