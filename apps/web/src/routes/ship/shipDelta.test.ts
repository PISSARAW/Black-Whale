import { describe, expect, it } from 'vitest'
import { buildShipEventDelta } from './shipDelta'

const presence = (entityId: string, locationId: string) => ({
  id: `p-${entityId}`,
  entityId,
  entityType: 'BODY' as const,
  locationId,
  fromEventId: 'e1',
  precision: 'EXACT_ROOM' as const,
  certainty: 'CONFIRMED' as const,
})

describe('adjacent ship event delta', () => {
  it('reports movement, appearance, disappearance and death without stable rows', () => {
    const delta = buildShipEventDelta(
      {
        presences: [presence('moved', 'a'), presence('gone', 'a'), presence('dead', 'a')],
        bodyStates: {},
      },
      { presences: [presence('moved', 'b'), presence('new', 'b')], bodyStates: { dead: 'DEAD' } },
    )
    expect(delta.map(({ entityId, kind }) => [entityId, kind])).toEqual([
      ['dead', 'dead'],
      ['gone', 'disappeared'],
      ['moved', 'moved'],
      ['new', 'appeared'],
    ])
  })
})
