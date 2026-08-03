import { describe, expect, it } from 'vitest'
import type { Character } from '@black-whale/contracts'
import { chapterNumber, chapterPosition, parseChapterReference } from '../src/chapters'
import {
  certaintyFor,
  deathChapter,
  isDeadStatus,
  modelingLevel,
  narrativeImportance,
} from '../src/characters'
import { locationCandidates, locationType, normalizeRoom, precisionFor } from '../src/rooms'
import { dropZeroWidthLegs, planTrajectory } from '../src/trajectory'

/**
 * The decisions the map projection makes, checked without a database.
 *
 * All of this used to live inside a 1,042-line script wrapped around a Prisma
 * client, which is why none of it was ever tested: exercising `deathChapter`
 * meant standing up Postgres and reading rows back out.
 */

function character(overrides: Partial<Character> = {}): Character {
  return { id: 'someone', canonicalName: 'Someone', ...overrides } as Character
}

describe('chapter references', () => {
  it('reads a bare chapter and a pinned event', () => {
    expect(parseChapterReference('ch-383')).toEqual({ number: 383, sequence: null })
    expect(parseChapterReference('ch-383.3')).toEqual({ number: 383, sequence: 3 })
  })

  it('refuses anything else', () => {
    expect(parseChapterReference('ch-unknown')).toBe(null)
    expect(parseChapterReference(null)).toBe(null)
    expect(chapterNumber('chapitre-quarante')).toBe(null)
  })

  it('orders a pinned event inside its own chapter', () => {
    const positions = ['ch-361', 'ch-359.4', 'ch-359'].map(chapterPosition)
    expect([...positions].sort((left, right) => left! - right!)).toEqual(
      ['ch-359', 'ch-359.4', 'ch-361'].map(chapterPosition),
    )
  })
})

describe('death', () => {
  it('reads the chapter a character dies in', () => {
    const momoze = character({
      mangaAppearances: [
        { chapter: 368, title: 'Foul Play', status: 'death' },
        { chapter: 371, title: 'Mission', status: 'corpse' },
      ],
    })
    expect(deathChapter(momoze)).toBe(368)
  })

  // Hisoka "dies" in 356 and is back on panel in 357, so he never leaves the map.
  it('ignores a death the character walks away from', () => {
    const hisoka = character({
      mangaAppearances: [
        { chapter: 356, title: 'Duel', status: 'death' },
        { chapter: 357, title: 'Return', status: 'appears' },
      ],
    })
    expect(deathChapter(hisoka)).toBe(null)
  })

  it('does not count a corpse as a return', () => {
    const momoze = character({
      mangaAppearances: [
        { chapter: 368, title: 'Foul Play', status: 'death' },
        { chapter: 413, title: 'Loyalty', status: 'corpse' },
      ],
    })
    expect(deathChapter(momoze)).toBe(368)
  })

  it('reads both languages of the status field', () => {
    for (const status of ['mort', 'décédée', 'DEAD', 'deceased']) {
      expect(isDeadStatus(status)).toBe(true)
    }
    expect(isDeadStatus('actif')).toBe(false)
    expect(isDeadStatus('active soul / dead body')).toBe(false)
  })
})

describe('how firmly a position may be drawn', () => {
  it('marks a databook room as a deduction', () => {
    expect(certaintyFor(character({ positionProvenance: 'databook' }))).toBe('PROBABLE')
  })

  it('marks an inferred room as a deduction', () => {
    expect(certaintyFor(character({ positionProvenance: 'inferred' }))).toBe('PROBABLE')
  })

  it('marks an unknown or suspected status as a deduction', () => {
    const shipLocation = { tier: 3, room: 'cineplex', status: 'inconnu', role: 'passager' }
    expect(certaintyFor(character({ shipLocation }))).toBe('PROBABLE')
  })

  it('confirms an ordinary observed position', () => {
    const shipLocation = { tier: 3, room: 'cineplex', status: 'actif', role: 'passager' }
    expect(certaintyFor(character({ shipLocation }))).toBe('CONFIRMED')
  })
})

describe('the shape of a record', () => {
  it('grades importance by canon status', () => {
    expect(narrativeImportance('canon')).toBe('PRIMARY')
    expect(narrativeImportance('semi-canon')).toBe('SECONDARY')
    expect(narrativeImportance(undefined)).toBe('MINOR')
  })

  it('models the upper decks in more detail, and the placeless least', () => {
    expect([1, 2, 3, 5].map(modelingLevel)).toEqual([1, 2, 3, 3])
    expect(modelingLevel(null)).toBe(4)
  })

  it('draws a room exactly and a deck not at all', () => {
    expect(precisionFor('ROOM')).toBe('EXACT_ROOM')
    expect(precisionFor('ZONE')).toBe('ZONE')
    expect(precisionFor('TIER')).toBe('TIER')
    expect(precisionFor('UNKNOWN')).toBe('UNKNOWN')
    expect(precisionFor('CORRIDOR')).toBe('ZONE')
  })

  it('maps a zone type onto a location kind, and an unknown one onto UNKNOWN', () => {
    expect(locationType('quarters')).toBe('ROOM')
    expect(locationType('Infrastructure')).toBe('CORRIDOR')
    expect(locationType('brand-new-kind')).toBe('UNKNOWN')
    expect(locationType(null)).toBe('UNKNOWN')
  })
})

describe('resolving a room name', () => {
  it('numbers the princes by their sector rooms', () => {
    expect(locationCandidates({ tier: 1, room: '1011' })[0]).toBe(
      'tier-1-royal-residential-sector-room-1011',
    )
    expect(locationCandidates({ tier: 1, room: '1000' })[0]).toBe('tier-1-royal-residential-sector')
  })

  it('numbers the queens the same way, falling back to their block', () => {
    expect(locationCandidates({ tier: 1, room: "Queen's Room 03" })).toEqual([
      'tier-1-queens-living-quarters-room-03',
      'tier-1-queens-living-quarters',
      'tier-1',
    ])
  })

  it('reads the same room through its accents, its case and its language', () => {
    for (const room of ['Hôpital', 'hopital', 'CENTRAL HOSPITAL', 'la clinique du pont 3']) {
      expect(locationCandidates({ tier: 3, room })[0]).toBe('tier-3-central-hospital')
    }
  })

  it('sends a placeless passenger to the explicit unknown position', () => {
    expect(locationCandidates({ tier: null, room: null })).toEqual(['black-whale-unknown'])
    expect(locationCandidates(null)).toEqual(['black-whale-unknown'])
  })

  // canon-lint refuses this in the catalogue; the deck stays a last resort for
  // an entry authored while the catalogue is mid-edit.
  it('falls back to the deck when nothing names the room', () => {
    expect(locationCandidates({ tier: 4, room: 'un endroit que personne ne connaît' })).toEqual([
      'tier-4',
    ])
  })

  it('normalises away only what carries no meaning', () => {
    expect(normalizeRoom('  Réfectoire Central ')).toBe('refectoire central')
  })
})

describe('planning a trajectory', () => {
  const room = (from: string, until?: string) => ({
    location: `room-${from}`,
    fromChapterId: from,
    ...(until ? { untilChapterId: until } : {}),
  })

  it('closes a leg where the next one begins', () => {
    const [first] = planTrajectory([room('ch-358'), room('ch-361')])
    expect(first!.until).toEqual({ chapterId: 'ch-361', exclusive: false })
  })

  it('leaves a final leg open', () => {
    const plan = planTrajectory([room('ch-358'), room('ch-361')])
    expect(plan[1]!.until).toBe(null)
  })

  it('closes a final leg one event after the chapter it names', () => {
    const [only] = planTrajectory([room('ch-358', 'ch-368')])
    expect(only!.until).toEqual({ chapterId: 'ch-368', exclusive: true })
  })

  // The reason this port exists. Momoze's room empties at 368; her corpse
  // reaches the burial chamber at 371. The previous compiler only read
  // `untilChapterId` on a final leg, so it stretched her across the gap.
  it('honours a declared end in the middle of a route', () => {
    const plan = planTrajectory([room('ch-361', 'ch-368'), room('ch-371')])
    expect(plan[0]!.until).toEqual({ chapterId: 'ch-368', exclusive: true })
  })

  it('carries the declared certainty, and confirms by default', () => {
    const plan = planTrajectory([
      { location: 'somewhere', fromChapterId: 'ch-358', certainty: 'PROBABLE' },
      { location: 'elsewhere', fromChapterId: 'ch-361' },
    ])
    expect(plan.map((leg) => leg.certainty)).toEqual(['PROBABLE', 'CONFIRMED'])
  })

  it('keeps the declared index so a rerun updates legs in place', () => {
    const plan = planTrajectory([room('ch-358'), room('ch-361'), room('ch-371')])
    expect(plan.map((leg) => leg.index)).toEqual([0, 1, 2])
  })
})

describe('legs the event log cannot separate', () => {
  const leg = (index: number, fromEventId: string): Parameters<typeof dropZeroWidthLegs>[0][0] => ({
    index,
    locationId: `location-${index}`,
    fromEventId,
    untilEventId: null,
    certainty: 'CONFIRMED',
  })

  it('keeps the last of a group that starts at one event', () => {
    const kept = dropZeroWidthLegs([leg(0, 'e1'), leg(1, 'e2'), leg(2, 'e2')])
    expect(kept.map((entry) => entry.index)).toEqual([0, 2])
  })

  it('leaves a route the log can separate alone', () => {
    const kept = dropZeroWidthLegs([leg(0, 'e1'), leg(1, 'e2'), leg(2, 'e3')])
    expect(kept).toHaveLength(3)
  })
})
