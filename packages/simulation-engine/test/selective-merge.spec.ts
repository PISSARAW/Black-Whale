import { describe, expect, it } from 'vitest'
import { createEmptyWorld, type WorldState } from '@black-whale/world-engine'
import { SimulationEngine } from '../src/engine.js'

const CURSOR = {
  branchId: 'canon',
  ordinal: 0,
  eventId: 'event-401',
  chapterNumber: 401,
  localSequence: 0,
}

function world(): WorldState {
  const state = createEmptyWorld(CURSOR)
  for (const [id, label] of [
    ['prince-tserriednich', 'Tserriednich'],
    ['theta', 'Theta'],
  ] as const) {
    state.entities[id] = { id, kind: 'CHARACTER', label }
  }
  return state
}

describe('Parallel Future — selective branch merge', () => {
  it('replays the predicted window for everyone except the seer', () => {
    const engine = new SimulationEngine()
    const base = world()

    engine.createBranch(
      { id: 'present', parentEventId: CURSOR.eventId, mode: 'rule-compatible' },
      base,
    )
    engine.createBranch(
      { id: 'future', parentEventId: CURSOR.eventId, mode: 'rule-compatible' },
      base,
    )

    // Ten predicted seconds: Theta moves, and so does Tserriednich.
    engine.applyEvents('future', [
      {
        type: 'ENTITY_MOVED',
        payload: {
          presence: {
            entity: { id: 'theta', kind: 'CHARACTER' },
            locationId: 'tier-1-study',
            precision: 'EXACT_ROOM',
            certainty: 'CONFIRMED',
          },
        },
      },
      {
        type: 'ENTITY_MOVED',
        payload: {
          presence: {
            entity: { id: 'prince-tserriednich', kind: 'CHARACTER' },
            locationId: 'tier-1-corridor',
            precision: 'EXACT_ROOM',
            certainty: 'CONFIRMED',
          },
        },
      },
    ])

    const merged = engine.mergeBranch({
      targetBranchId: 'present',
      sourceBranchId: 'future',
      excludeSubjectIds: ['prince-tserriednich'],
    })

    // Theta lives the predicted second; the prince, who saw it coming, does not.
    expect(merged.snapshot.presences['theta']?.locationId).toBe('tier-1-study')
    expect(merged.snapshot.presences['prince-tserriednich']).toBeUndefined()
    expect(merged.skippedEvents).toHaveLength(1)
    expect(merged.warnings[0]).toMatch(/overridden by a diverging actor/)
  })
})
