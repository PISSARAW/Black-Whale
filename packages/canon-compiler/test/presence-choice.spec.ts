import { describe, expect, it } from 'vitest'
import { pickExistingPresence, type PresenceCandidate } from '../src/map/presence-choice'

function presence(overrides: Partial<PresenceCandidate> & { id: string }): PresenceCandidate {
  return {
    locationId: 'a-room',
    fromEventId: `event-${overrides.id}`,
    untilEventId: null,
    locationType: 'ROOM',
    precision: 'EXACT_ROOM',
    certainty: 'CONFIRMED',
    from: { chapter: 358, sequence: 1 },
    ...overrides,
  }
}

const NO_BOUNDS = { fromChapter: null, untilChapter: null }

describe('picking the presence a catalogue position means', () => {
  it('has nothing to pick from an empty history', () => {
    expect(pickExistingPresence([], NO_BOUNDS)).toBe(null)
  })

  it('takes the open record when the catalogue sets no bound', () => {
    const closed = presence({ id: 'closed', untilEventId: 'event-later' })
    const open = presence({ id: 'open' })
    expect(pickExistingPresence([closed, open], NO_BOUNDS)?.id).toBe('open')
  })

  it('takes the record the declared opening chapter names', () => {
    const boarding = presence({ id: 'boarding', from: { chapter: 358, sequence: 1 } })
    const later = presence({ id: 'later', from: { chapter: 390, sequence: 2 } })
    const chosen = pickExistingPresence([boarding, later], { fromChapter: 390, untilChapter: null })
    expect(chosen?.id).toBe('later')
  })

  // The continuation exists precisely because canon stopped saying where the
  // body was. Closing a position must move the last real room, not that.
  it('skips the unknown-position continuation when closing a bound', () => {
    const room = presence({ id: 'room', from: { chapter: 360, sequence: 1 } })
    const continuation = presence({
      id: 'continuation',
      locationType: 'UNKNOWN',
      precision: 'UNKNOWN',
      certainty: 'LAST_KNOWN',
      from: { chapter: 362, sequence: 1 },
    })
    const chosen = pickExistingPresence([continuation, room], {
      fromChapter: null,
      untilChapter: 368,
    })
    expect(chosen?.id).toBe('room')
  })

  it('ignores a room the bound has already passed', () => {
    const early = presence({ id: 'early', from: { chapter: 360, sequence: 1 } })
    const late = presence({ id: 'late', from: { chapter: 400, sequence: 1 } })
    const chosen = pickExistingPresence([early, late], { fromChapter: null, untilChapter: 368 })
    expect(chosen?.id).toBe('early')
  })

  it('prefers the latest of two records that both match', () => {
    const early = presence({ id: 'early', from: { chapter: 360, sequence: 1 } })
    const late = presence({ id: 'late', from: { chapter: 360, sequence: 4 } })
    const chosen = pickExistingPresence([early, late], { fromChapter: 360, untilChapter: null })
    expect(chosen?.id).toBe('late')
  })

  // Never nothing: a body that holds records has one the catalogue is about,
  // and refusing to choose would write a second position beside the first.
  it('falls back to the first record when no rule matches', () => {
    const closed = presence({ id: 'only', untilEventId: 'event-later' })
    expect(pickExistingPresence([closed], NO_BOUNDS)?.id).toBe('only')
  })
})
