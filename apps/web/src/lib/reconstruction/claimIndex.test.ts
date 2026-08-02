import { describe, expect, it } from 'vitest'
import {
  buildReconstructionClaimIndex,
  claimFromPresence,
  claimsFromWorldEvent,
} from './claimIndex'

const presence = {
  id: 'presence-1',
  entityId: 'body-1',
  locationId: 'room-a',
  precision: 'EXACT_ROOM' as const,
  certainty: 'CONFIRMED' as const,
  sources: [{ id: 'source-1' }],
  fromEvent: { id: 'event-1', ordinal: 10 },
  untilEvent: { id: 'event-3', ordinal: 30 },
}

describe('reconstruction claim index', () => {
  it('maps a temporal presence with its interval and sources', () => {
    expect(claimFromPresence(presence)).toMatchObject({
      id: 'presence:presence-1',
      eventId: 'event-1',
      subject: { type: 'BODY', id: 'body-1' },
      value: { locationId: 'room-a' },
      sourceIds: ['source-1'],
      method: 'explicit',
      interval: {
        from: { eventId: 'event-1', ordinal: 10 },
        until: { eventId: 'event-3', ordinal: 30 },
      },
    })
  })

  it('maps spatial, body and consciousness world transitions', () => {
    const base = { ordinal: 20, sourceIds: ['panel-20'] }
    const rows = [
      {
        ...base,
        id: 'move',
        type: 'ENTITY_MOVED',
        payload: {
          presence: {
            entity: { id: 'body-1', kind: 'BODY' },
            locationId: 'room-b',
            precision: 'ZONE',
            certainty: 'PROBABLE',
          },
        },
      },
      {
        ...base,
        id: 'state',
        type: 'BODY_STATE_CHANGED',
        payload: { bodyId: 'body-1', state: 'INJURED' },
      },
      {
        ...base,
        id: 'mind',
        type: 'CONSCIOUSNESS_TRANSFERRED',
        payload: { consciousnessId: 'mind-1', toBodyId: 'body-2' },
      },
    ]
    expect(rows.flatMap(claimsFromWorldEvent).map((claim) => claim.predicate)).toEqual([
      'location',
      'body-state',
      'consciousness-occupancy',
    ])
    expect(claimsFromWorldEvent(rows[0])[0]).toMatchObject({
      method: 'editorial-inference',
      precision: 'ZONE',
    })
  })

  it('indexes every claim under the event that introduces it', () => {
    const index = buildReconstructionClaimIndex(
      [presence],
      [
        {
          id: 'event-2',
          type: 'BODY_STATE_CHANGED',
          ordinal: 20,
          sourceIds: [],
          payload: { bodyId: 'body-1', state: 'INJURED' },
        },
      ],
    )
    expect(index.claims).toHaveLength(2)
    expect(Object.keys(index.byEvent)).toEqual(['event-1', 'event-2'])
    expect(index.byEvent['event-2'][0].subject.id).toBe('body-1')
  })

  it('ignores unrelated or malformed world events', () => {
    expect(
      claimsFromWorldEvent({
        id: 'x',
        type: 'EFFECT_CREATED',
        ordinal: 1,
        sourceIds: [],
        payload: {},
      }),
    ).toEqual([])
    expect(
      claimsFromWorldEvent({
        id: 'x',
        type: 'ENTITY_MOVED',
        ordinal: 1,
        sourceIds: [],
        payload: {},
      }),
    ).toEqual([])
  })
})
