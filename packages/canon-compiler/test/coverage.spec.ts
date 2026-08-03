import { describe, expect, it } from 'vitest'
import type { Character } from '@black-whale/contracts'
import { verifyMapCoverage, type VerifyEvent, type VerifyWorld } from '../src/verify/coverage'

/**
 * The verifier decides on data alone, so it can be shown both accepting a
 * consistent map and refusing each way one drifts.
 */

function event(chapter: number, sequence = 1, aboard = true): VerifyEvent {
  return {
    id: `e-${chapter}-${sequence}`,
    sequence,
    ordinal: chapter * 10 + sequence,
    chapter: { number: chapter },
    occursOnBlackWhale: aboard,
  }
}

const EVENTS = [event(358), event(360), event(368), event(368, 2), event(371)]

function world(overrides: Partial<VerifyWorld> = {}): VerifyWorld {
  return {
    events: EVENTS,
    presences: [],
    bodyStates: [],
    bodyBySlug: new Map([['someone', { id: 'body-1' }]]),
    ...overrides,
  }
}

function character(overrides: Partial<Character> = {}): Character {
  return { id: 'someone', canonicalName: 'Someone', ...overrides } as Character
}

const inRoom = (from: VerifyEvent, until: VerifyEvent | null = null) => ({
  id: `p-${from.id}`,
  entityId: 'body-1',
  locationSlug: 'tier-1-royal-residential-sector-room-1012',
  locationType: 'ROOM',
  fromEvent: from,
  untilEvent: until,
})

describe('appearances the map has to cover', () => {
  it('accepts a passenger whose presence spans the chapter they appear in', () => {
    const failures = verifyMapCoverage(
      [character({ mangaAppearances: [{ chapter: 360, title: 'Elsewhere', status: 'appears' }] })],
      world({ presences: [inRoom(EVENTS[0]!)] }),
    )
    expect(failures).toEqual([])
  })

  it('refuses an on-panel chapter with no position aboard', () => {
    const failures = verifyMapCoverage(
      [character({ mangaAppearances: [{ chapter: 360, title: 'Elsewhere', status: 'appears' }] })],
      world({ presences: [] }),
    )
    expect(failures[0]?.message).toContain('chapitre 360')
  })

  it('says nothing about a chapter that plays out off the ship', () => {
    const failures = verifyMapCoverage(
      [character({ mangaAppearances: [{ chapter: 396, title: 'Ashore', status: 'appears' }] })],
      world({ events: [...EVENTS, event(396, 1, false)] }),
    )
    expect(failures).toEqual([])
  })

  // `mentioned`, `pictured`, `flashback` all describe someone discussed or
  // shown in effigy while being somewhere else — or nowhere.
  it('says nothing about a character who is only spoken of', () => {
    const failures = verifyMapCoverage(
      [
        character({
          mangaAppearances: [{ chapter: 360, title: 'Elsewhere', status: 'mentioned' }],
        }),
      ],
      world({ presences: [] }),
    )
    expect(failures).toEqual([])
  })

  it('refuses a trajectory declared by someone with no body', () => {
    const failures = verifyMapCoverage(
      [
        character({
          id: 'nobody',
          mapTrajectory: [{ location: 'a-room', fromChapterId: 'ch-358' }],
        }),
      ],
      world(),
    )
    expect(failures).toEqual([
      { scope: 'nobody', message: 'déclare un trajet sans avoir de corps' },
    ])
  })
})

describe('what a death has to leave behind', () => {
  const dying = character({
    mangaAppearances: [{ chapter: 368, title: 'Foul Play', status: 'death' }],
  })
  const dead = { bodyId: 'body-1', state: 'DEAD', fromEvent: { chapter: { number: 368 } } }

  it('accepts a closed presence and a DEAD state dated on the death', () => {
    const failures = verifyMapCoverage(
      [dying],
      world({ presences: [inRoom(EVENTS[0]!, EVENTS[3]!)], bodyStates: [dead] }),
    )
    expect(failures).toEqual([])
  })

  it('refuses a presence still open after the death', () => {
    const failures = verifyMapCoverage(
      [dying],
      world({ presences: [inRoom(EVENTS[0]!)], bodyStates: [dead] }),
    )
    expect(failures.map((entry) => entry.message)).toContain(
      'meurt au chapitre 368 mais garde 1 présence(s) ensuite',
    )
  })

  it('refuses a death with no DEAD state at all', () => {
    const failures = verifyMapCoverage(
      [dying],
      world({ presences: [inRoom(EVENTS[0]!, EVENTS[3]!)], bodyStates: [] }),
    )
    expect(failures[0]?.message).toContain('sans état de corps DEAD')
  })

  it('refuses a DEAD state dated on the wrong chapter', () => {
    const misdated = { ...dead, fromEvent: { chapter: { number: 371 } } }
    const failures = verifyMapCoverage(
      [dying],
      world({ presences: [inRoom(EVENTS[0]!, EVENTS[3]!)], bodyStates: [misdated] }),
    )
    expect(failures[0]?.message).toContain('état DEAD ouvert au chapitre 371')
  })
})

describe('what the projection wrote', () => {
  // A tier is a deck, not a place. The catalogue side of this is canon-lint's;
  // this catches a row no catalogue entry owns.
  it('refuses a presence parked on a deck', () => {
    const onDeck = { ...inRoom(EVENTS[0]!), locationSlug: 'tier-3', locationType: 'TIER' }
    const failures = verifyMapCoverage([], world({ presences: [onDeck] }))
    expect(failures[0]?.message).toContain('un pont et non une pièce')
  })
})
