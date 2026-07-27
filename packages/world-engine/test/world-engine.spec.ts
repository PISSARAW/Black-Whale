import { describe, expect, it } from 'vitest'
import {
  InMemoryBranchEngine,
  buildCanonicalCursors,
  createEmptyWorld,
  reduceWorld,
  type StoryCursor,
  type WorldEvent,
} from '../src/index.js'

const cursor: StoryCursor = {
  branchId: 'canon',
  ordinal: 0,
  eventId: 'start',
  chapterNumber: 340,
  localSequence: 0,
}

function event<T extends WorldEvent>(value: Omit<T, 'schemaVersion' | 'branchId'>): T {
  return { ...value, schemaVersion: 1, branchId: value.cursor.branchId } as T
}

describe('world engine', () => {
  it('builds a global cursor across chapter-local sequences', () => {
    const cursors = buildCanonicalCursors([
      { id: 'b', chapter: { number: 341 }, sequence: 1 },
      { id: 'a', chapter: { number: 340 }, sequence: 8 },
    ])
    expect(cursors.map(({ eventId, ordinal }) => [eventId, ordinal])).toEqual([
      ['a', 0],
      ['b', 1],
    ])
  })

  it('places a revealed flashback at its real chronological position', () => {
    const cursors = buildCanonicalCursors([
      { id: 'present', chapter: { number: 400 }, sequence: 1, ordinal: 20 },
      { id: 'flashback', chapter: { number: 410 }, sequence: 1, ordinal: 10 },
    ])
    expect(cursors.map(({ eventId, ordinal }) => [eventId, ordinal])).toEqual([
      ['flashback', 10],
      ['present', 20],
    ])
  })

  it('moves universal entities through the same reducer', () => {
    let state = createEmptyWorld(cursor)
    state = reduceWorld(
      state,
      event({
        id: 'register',
        type: 'ENTITY_REGISTERED',
        cursor: { ...cursor, ordinal: 1, eventId: 'register' },
        payload: { entity: { id: 'owl', kind: 'NEN_ENTITY', label: 'Secret Window owl' } },
      }),
    )
    state = reduceWorld(
      state,
      event({
        id: 'move',
        type: 'ENTITY_MOVED',
        cursor: { ...cursor, ordinal: 2, eventId: 'move' },
        payload: {
          presence: {
            entity: { id: 'owl', kind: 'NEN_ENTITY' },
            locationId: 'room-1014',
            precision: 'EXACT_ROOM',
            certainty: 'CONFIRMED',
          },
        },
      }),
    )
    expect(state.presences.owl?.locationId).toBe('room-1014')
  })

  it('rejects ambiguous or regressing time', () => {
    const state = createEmptyWorld(cursor)
    expect(() =>
      reduceWorld(
        state,
        event({
          id: 'bad',
          type: 'BODY_STATE_CHANGED',
          cursor,
          payload: { bodyId: 'missing', state: 'DEAD' },
        }),
      ),
    ).toThrow('Cursor ordinal must increase')
  })

  it('forks state without mutating canon', () => {
    const canon = createEmptyWorld(cursor)
    const branches = new InMemoryBranchEngine()
    branches.createBranch({
      id: 'sim-1',
      name: 'What if',
      rulePolicy: 'RULE_COMPATIBLE',
      baseState: canon,
    })
    branches.append('sim-1', [
      {
        type: 'ENTITY_REGISTERED',
        payload: { entity: { id: 'portal', kind: 'PORTAL', label: 'Hide and Seek portal' } },
      },
    ])
    expect(branches.getState('sim-1').entities.portal).toBeDefined()
    expect(canon.entities.portal).toBeUndefined()
  })
})
