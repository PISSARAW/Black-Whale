import { describe, expect, it } from 'vitest'
import { trimWorldStateForMap } from './mapPayload'

const joinedEvent = {
  id: 'event-1',
  chapterId: 'chapter-358',
  sequence: 1,
  ordinal: 30,
  isFlashback: false,
  title: 'Boarding the Black Whale',
  summary: 'Passengers board the ship.',
  occurredAtLabel: null,
  chapter: { id: 'chapter-358', number: 358, title: 'Eve' },
}

/** A presence as the timeline engine hands it over: columns plus joins. */
const presence = {
  id: 'presence-1',
  entityType: 'BODY',
  entityId: 'body-1',
  locationId: 'room-1001',
  fromEventId: 'event-1',
  untilEventId: null,
  precision: 'EXACT_ROOM',
  certainty: 'CONFIRMED',
  fromEvent: joinedEvent,
  untilEvent: null,
}

describe('the presence the map receives', () => {
  const [trimmed] = trimWorldStateForMap({ presences: [presence] }).presences as Record<
    string,
    unknown
  >[]

  it('keeps the position, the bounds and the confidence', () => {
    expect(trimmed).toMatchObject({
      id: 'presence-1',
      entityId: 'body-1',
      locationId: 'room-1001',
      fromEventId: 'event-1',
      untilEventId: null,
      precision: 'EXACT_ROOM',
      certainty: 'CONFIRMED',
    })
  })

  it('cuts the join to what the temporal badge words itself from', () => {
    expect(trimmed!.fromEvent).toEqual({ sequence: 1, chapterId: 'chapter-358' })
  })

  it('drops the chapter, the title and the summary the join dragged along', () => {
    for (const field of ['chapter', 'title', 'summary', 'occurredAtLabel']) {
      expect(trimmed!.fromEvent).not.toHaveProperty(field)
    }
  })

  /** A null `untilEvent` means the presence is still open, which the map reads. */
  it('keeps a null join null rather than inventing an event', () => {
    expect(trimmed!.untilEvent).toBeNull()
    expect('untilEvent' in trimmed!).toBe(true)
  })

  // `entityType` is 'BODY' on every row the engine returns, because it only
  // ever asks for those. A constant is not information.
  it('drops the column that never varies', () => {
    expect('entityType' in trimmed!).toBe(false)
  })
})

describe('the identity rows the map receives', () => {
  const trimmed = trimWorldStateForMap({
    bodies: [
      {
        id: 'body-1',
        originalCharacterId: 'character-1',
        label: 'Kurapika Body',
        bodyType: 'ORIGINAL',
        firstVisibleEventId: 'event-1',
        firstVisibleEvent: joinedEvent,
      },
    ],
    consciousnesses: [
      {
        id: 'mind-1',
        originCharacterId: 'character-1',
        label: 'Kurapika Consciousness',
        consciousnessType: 'ORIGINAL',
        firstVisibleEvent: joinedEvent,
      },
    ],
    occupancies: [
      {
        id: 'occupancy-1',
        bodyId: 'body-1',
        consciousnessId: 'mind-1',
        fromEventId: 'event-1',
        untilEventId: null,
        occupancyType: 'ORIGINAL',
        certainty: 'CONFIRMED',
        fromEvent: joinedEvent,
      },
    ],
    appearances: [
      {
        id: 'appearance-1',
        entityId: 'body-1',
        entityType: 'BODY',
        appearanceCharacterId: 'character-2',
        cause: 'NEN_ABILITY',
        fromEvent: joinedEvent,
      },
    ],
  })

  it('sends a body as whose it is and what to call it', () => {
    expect(trimmed.bodies).toEqual([
      { id: 'body-1', originalCharacterId: 'character-1', label: 'Kurapika Body' },
    ])
  })

  it('sends a consciousness the same way', () => {
    expect(trimmed.consciousnesses).toEqual([
      { id: 'mind-1', originCharacterId: 'character-1', label: 'Kurapika Consciousness' },
    ])
  })

  // Seven columns and two joins travelled so the map could read two ids.
  it('sends an occupancy as the pair it is', () => {
    expect(trimmed.occupancies).toEqual([{ bodyId: 'body-1', consciousnessId: 'mind-1' }])
  })

  it('sends an appearance as the face and the body wearing it', () => {
    expect(trimmed.appearances).toEqual([
      { entityId: 'body-1', appearanceCharacterId: 'character-2' },
    ])
  })
})

describe('what the projection leaves alone', () => {
  it('leaves scalars and collections it does not know alone', () => {
    expect(
      trimWorldStateForMap({ bodyStates: { 'body-1': 'ALIVE' }, atEventId: 'event-1' }),
    ).toEqual({ bodyStates: { 'body-1': 'ALIVE' }, atEventId: 'event-1' })
  })

  it('survives a snapshot that carries none of the collections', () => {
    expect(trimWorldStateForMap({})).toEqual({})
  })

  /** The ship page builds a partial state by hand when no event resolves. */
  it('survives a collection whose rows lack the fields it names', () => {
    expect(trimWorldStateForMap({ bodies: [{ id: 'body-1' }] }).bodies).toEqual([{ id: 'body-1' }])
  })
})

describe('the character rows the map receives', () => {
  const character = {
    id: 'character-1',
    slug: 'hisoka',
    canonicalName: 'Hisoka Morrow',
    aliases: ['The Magician'],
    narrativeImportance: 'PRIMARY',
    hatsuIds: ['bungee-gum'],
    factionTags: [],
    description: 'Magician, Floor Master and elite Transmuter returned from the dead.',
    portraitAssetId: null,
    firstVisibleEventId: 'event-1',
    firstVisibleEvent: joinedEvent,
  }
  const [trimmed] = trimWorldStateForMap({ characters: [character] }).characters as Record<
    string,
    unknown
  >[]

  it('keeps what the map names, filters and searches on', () => {
    expect(trimmed).toMatchObject({
      id: 'character-1',
      slug: 'hisoka',
      canonicalName: 'Hisoka Morrow',
      aliases: ['The Magician'],
      narrativeImportance: 'PRIMARY',
      hatsuIds: ['bungee-gum'],
    })
  })

  // The reveal filter already ran server-side; the join travelled so the map
  // could re-derive an answer it was handed.
  it('drops the biography and the first-visible-event join', () => {
    for (const field of ['description', 'firstVisibleEvent', 'firstVisibleEventId']) {
      expect(field in trimmed!).toBe(false)
    }
  })
})
