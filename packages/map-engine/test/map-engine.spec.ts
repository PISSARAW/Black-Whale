import { describe, expect, it } from 'vitest'
import { MapEngine } from '../src/index.js'

const EVENT = { id: 'event-3', sequence: 3, ordinal: 30, chapter: { number: 405 } }
const EARLIER = { id: 'event-1', sequence: 1, ordinal: 10, chapter: { number: 401 } }
const LATER = { id: 'event-9', sequence: 9, ordinal: 90, chapter: { number: 412 } }

const ROOM_1014 = {
  id: 'room-1014',
  name: 'Room 1014',
  parentLocationId: 'tier-1',
  mapElementId: 'room-1014',
}
const TIER_1 = { id: 'tier-1', name: 'Tier 1', parentLocationId: null, deck: 1 }
const LOCATIONS = [TIER_1, ROOM_1014]

function presence(entityId: string, overrides: Record<string, unknown> = {}) {
  return {
    entityId,
    locationId: ROOM_1014.id,
    location: ROOM_1014,
    fromEvent: EARLIER,
    untilEvent: null,
    ...overrides,
  }
}

function fakePrisma(options: { event?: typeof EVENT | null; presences?: unknown[] }) {
  return {
    location: { findMany: async () => LOCATIONS, findFirst: async () => null },
    narrativeEvent: {
      findUnique: async () => (options.event === undefined ? EVENT : options.event),
    },
    presence: { findMany: async () => options.presences ?? [], findFirst: async () => null },
  } as never
}

describe('MapEngine.getEntityLocation', () => {
  it('resolves the room an entity is in', async () => {
    const engine = new MapEngine(fakePrisma({ presences: [presence('kurapika')] }))
    const location = await engine.getEntityLocation('kurapika', 'event-3')

    expect(location?.id).toBe('room-1014')
    expect(location?.parentId).toBe('tier-1')
  })

  it('returns null once the entity has left', async () => {
    const engine = new MapEngine(
      fakePrisma({ presences: [presence('kurapika', { untilEvent: EVENT })] }),
    )

    expect(await engine.getEntityLocation('kurapika', 'event-3')).toBeNull()
  })

  it('returns null before the entity arrives', async () => {
    const engine = new MapEngine(
      fakePrisma({ presences: [presence('kurapika', { fromEvent: LATER })] }),
    )

    expect(await engine.getEntityLocation('kurapika', 'event-3')).toBeNull()
  })

  it('returns null for an entity with no recorded presence', async () => {
    const engine = new MapEngine(fakePrisma({ presences: [presence('kurapika')] }))

    expect(await engine.getEntityLocation('hisoka', 'event-3')).toBeNull()
  })

  it('returns null for an unknown event instead of throwing', async () => {
    const engine = new MapEngine(fakePrisma({ event: null }))

    expect(await engine.getEntityLocation('kurapika', 'nope')).toBeNull()
  })

  it('treats a presence with no location as unknown', async () => {
    const engine = new MapEngine(
      fakePrisma({ presences: [presence('kurapika', { locationId: null, location: null })] }),
    )

    expect(await engine.getEntityLocation('kurapika', 'event-3')).toBeNull()
  })
})

describe('MapEngine.getEntitiesAt', () => {
  it('lists everyone in a room at that point', async () => {
    const engine = new MapEngine(
      fakePrisma({ presences: [presence('kurapika'), presence('oito'), presence('woble')] }),
    )

    expect(await engine.getEntitiesAt('room-1014', 'event-3')).toEqual([
      'kurapika',
      'oito',
      'woble',
    ])
  })

  it('excludes entities that have already left the room', async () => {
    const engine = new MapEngine(
      fakePrisma({ presences: [presence('kurapika'), presence('oito', { untilEvent: EVENT })] }),
    )

    expect(await engine.getEntitiesAt('room-1014', 'event-3')).toEqual(['kurapika'])
  })

  it('excludes entities in a different room', async () => {
    const engine = new MapEngine(
      fakePrisma({
        presences: [presence('kurapika'), presence('hisoka', { locationId: 'tier-4' })],
      }),
    )

    expect(await engine.getEntitiesAt('room-1014', 'event-3')).toEqual(['kurapika'])
  })

  it('returns an empty list for an unknown event', async () => {
    const engine = new MapEngine(fakePrisma({ event: null }))

    expect(await engine.getEntitiesAt('room-1014', 'nope')).toEqual([])
  })
})

describe('MapEngine.getMapState', () => {
  it('positions every entity that has an active presence', async () => {
    const engine = new MapEngine(
      fakePrisma({ presences: [presence('kurapika'), presence('oito', { untilEvent: EVENT })] }),
    )
    const state = await engine.getMapState('event-3')

    expect(state.atEventId).toBe('event-3')
    expect(state.entityPositions).toEqual({ kurapika: 'room-1014' })
  })
})
