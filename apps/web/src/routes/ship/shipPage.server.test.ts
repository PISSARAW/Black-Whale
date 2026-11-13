import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorldSnapshot } from '@black-whale/canon-engine'
import type { ShipCatalogData } from './shipData'

const mocks = vi.hoisted(() => ({
  getWorldState: vi.fn(),
  readSpoilerProfile: vi.fn(),
  characterFindMany: vi.fn(),
  affiliationFindMany: vi.fn(),
}))

vi.mock('$lib/server/timeline', () => ({
  timeline: { getWorldState: mocks.getWorldState },
}))

vi.mock('$lib/server/spoiler', () => ({
  readSpoilerProfile: mocks.readSpoilerProfile,
}))

vi.mock('$lib/server/db', () => ({
  prisma: {
    character: { findMany: mocks.characterFindMany },
    affiliationMembership: { findMany: mocks.affiliationFindMany },
  },
}))

vi.mock('$lib/server/perspectives', () => ({
  buildPerspective: vi.fn(),
}))

vi.mock('$lib/config/features', () => ({
  PUBLIC_FEATURES: { perspectives: false },
}))

import { load as loadLocalizedShipPage } from './+page.server'
import { loadShipPage } from './shipPage.server'

const events: ShipCatalogData['events'] = [
  {
    id: 'event-1',
    chapterId: 'chapter-358',
    sequence: 1,
    ordinal: 10,
    title: 'Departure',
    chapter: { number: 358 },
  },
  {
    id: 'event-2',
    chapterId: 'chapter-358',
    sequence: 2,
    ordinal: 20,
    title: 'First move',
    chapter: { number: 358 },
  },
  {
    id: 'event-3',
    chapterId: 'chapter-359',
    sequence: 1,
    ordinal: 30,
    title: 'Next chapter',
    chapter: { number: 359 },
  },
]

const locations: ShipCatalogData['locations'] = [
  {
    id: 'room-a',
    slug: 'room-a',
    name: 'Room A',
    type: 'ROOM',
    mapElementId: null,
    parentLocationId: null,
  },
  {
    id: 'room-b',
    slug: 'room-b',
    name: 'Room B',
    type: 'ROOM',
    mapElementId: null,
    parentLocationId: null,
  },
]

function world(eventId: string, visibleLocation: string, hiddenLocation: string): WorldSnapshot {
  return {
    atEventId: eventId,
    characters: [
      { id: 'visible-character', canonicalName: 'The Black Whale' },
      { id: 'hidden-character', canonicalName: 'Hidden passenger' },
    ],
    bodies: [
      { id: 'visible-body', originalCharacterId: 'visible-character', label: 'Visible body' },
      { id: 'hidden-body', originalCharacterId: 'hidden-character', label: 'Hidden body' },
    ],
    consciousnesses: [],
    presences: [
      {
        id: `${eventId}-visible-presence`,
        entityType: 'BODY',
        entityId: 'visible-body',
        locationId: visibleLocation,
        fromEventId: eventId,
        untilEventId: null,
        precision: 'EXACT_ROOM',
        certainty: 'CONFIRMED',
      },
      {
        id: `${eventId}-hidden-presence`,
        entityType: 'BODY',
        entityId: 'hidden-body',
        locationId: hiddenLocation,
        fromEventId: eventId,
        untilEventId: null,
        precision: 'EXACT_ROOM',
        certainty: 'CONFIRMED',
      },
    ],
    occupancies: [],
    appearances: [],
    locations: [],
    activeAbilities: [],
    knownFacts: [],
    bodyStates: { 'visible-body': 'ALIVE', 'hidden-body': 'ALIVE' },
  } as unknown as WorldSnapshot
}

const worlds = new Map([
  ['event-1', world('event-1', 'room-a', 'room-a')],
  ['event-2', world('event-2', 'room-b', 'room-b')],
  ['event-3', world('event-3', 'room-b', 'room-a')],
])

function event(
  parent: () => Promise<ShipCatalogData & { localizedContent?: Record<string, string> }>,
) {
  return {
    url: new URL('https://example.test/fr/ship?eventId=event-1'),
    cookies: {},
    parent,
  } as never
}

function catalog() {
  return {
    events,
    locations,
    walkTargets: { 'room-a': 'tour-room-a' },
    spoilerLimit: 400,
    localizedContent: { 'Layout label': 'Libellé du layout' },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.readSpoilerProfile.mockReturnValue({ maxChapter: 400 })
  mocks.characterFindMany.mockResolvedValue([{ id: 'visible-character' }])
  mocks.affiliationFindMany.mockResolvedValue([])
  mocks.getWorldState.mockImplementation(({ eventId }: { eventId: string }) => worlds.get(eventId))
})

describe('the event-specific ship loader', () => {
  it('keeps the catalog in the layout and returns only event-specific data', async () => {
    const data = await loadShipPage(event(async () => catalog()))

    expect(data).not.toHaveProperty('events')
    expect(data).not.toHaveProperty('locations')
    expect(data).not.toHaveProperty('walkTargets')
    expect(data.worldState.locations).toEqual([])
    expect(data.localizedContent).toEqual({ 'Layout label': 'Libellé du layout' })
  })

  it('builds the delta against the immediately adjacent event', async () => {
    const data = await loadShipPage(event(async () => catalog()))

    expect(mocks.getWorldState.mock.calls.map(([request]) => request.eventId)).toEqual([
      'event-1',
      'event-2',
      'event-3',
    ])
    expect(data.nextEventDelta).toEqual([
      {
        entityId: 'visible-body',
        kind: 'moved',
        fromLocationId: 'room-a',
        toLocationId: 'room-b',
      },
    ])
  })

  it('applies the same spoiler allow-list to current, adjacent and future states', async () => {
    const data = await loadShipPage(event(async () => catalog()))
    const serialized = JSON.stringify(data)

    expect(data.worldState.characters.map(({ id }) => id)).toEqual(['visible-character'])
    expect(data.nextChapterState?.characters.map(({ id }) => id)).toEqual(['visible-character'])
    expect(data.nextEventDelta.map(({ entityId }) => entityId)).toEqual(['visible-body'])
    expect(serialized).not.toContain('hidden-character')
    expect(serialized).not.toContain('hidden-body')
    expect(mocks.characterFindMany).toHaveBeenCalledWith({
      where: { firstVisibleEvent: { chapter: { number: { lte: 400 } } } },
      select: { id: true },
    })
  })
})

describe('the localized ship page loader', () => {
  it('merges inherited layout translations with translations derived from page data', async () => {
    const data = (await loadLocalizedShipPage(event(async () => catalog()))) as Awaited<
      ReturnType<typeof loadShipPage>
    >

    expect(data.localizedContent).toMatchObject({
      'Layout label': 'Libellé du layout',
      'The Black Whale': 'Le Black Whale',
    })
  })
})
