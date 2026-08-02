import { describe, expect, it } from 'vitest'
import { createEmptyWorld, type WorldState } from '@black-whale/world-engine'
import { generateAIOperations, resolveControlledEntity } from '../src/ai.js'

function world(): WorldState {
  const state = createEmptyWorld({
    branchId: 'canon',
    ordinal: 1,
    eventId: 'event-1',
    chapterNumber: 359,
    localSequence: 1,
  })
  state.entities.kurapika = {
    id: 'kurapika',
    kind: 'CHARACTER',
    label: 'Kurapika',
  }
  state.entities['kurapika-body'] = {
    id: 'kurapika-body',
    kind: 'BODY',
    label: 'Kurapika body',
    originalCharacterId: 'kurapika',
  }
  state.entities['tier-1'] = { id: 'tier-1', kind: 'LOCATION', label: 'Tier 1' }
  state.entities['tier-2'] = { id: 'tier-2', kind: 'LOCATION', label: 'Tier 2' }
  state.presences['kurapika-body'] = {
    entity: { id: 'kurapika-body', kind: 'BODY' },
    locationId: 'tier-1',
    precision: 'TIER',
    certainty: 'CONFIRMED',
  }
  return state
}

describe('strategy AI', () => {
  it('resolves a character membership to the body tracked on the map', () => {
    expect(resolveControlledEntity(world(), 'kurapika')?.id).toBe('kurapika-body')
  })

  it('uses the current event schema and only scenario-approved locations', () => {
    const events = generateAIOperations(world(), ['kurapika', 'kurapika'], {
      destinationIds: ['invented-room', 'tier-1', 'tier-2'],
      moveChance: 1,
      random: () => 0,
    })

    expect(events).toEqual([
      {
        type: 'ENTITY_MOVED',
        payload: {
          presence: {
            entity: { id: 'kurapika-body', kind: 'BODY' },
            locationId: 'tier-2',
            precision: 'EXACT_ROOM',
            certainty: 'CONFIRMED',
          },
        },
      },
    ])
  })

  it('does nothing when no valid destination exists', () => {
    expect(
      generateAIOperations(world(), ['kurapika'], {
        destinationIds: ['invented-room'],
        moveChance: 1,
        random: () => 0,
      }),
    ).toEqual([])
  })
})
