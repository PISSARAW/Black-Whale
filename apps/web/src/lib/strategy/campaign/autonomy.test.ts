import { describe, expect, it } from 'vitest'
import { advanceAutonomousThreads, initialAutonomousThreads } from './autonomy'

const outcome = {
  scenarioId: 'succession-guards-359',
  selectedFactionId: 'prince-woble',
  won: true,
  turnsPlayed: 5,
  victoryPoints: 3,
  relationships: {},
  unitConditions: {},
}

describe('autonomous campaign threads', () => {
  it('advances several off-screen plots after the same player scenario', () => {
    const threads = advanceAutonomousThreads(initialAutonomousThreads(), outcome)
    expect(threads.every((thread) => thread.stage === 'MANEUVERING')).toBe(true)
    expect(threads.map((thread) => thread.lastScenarioId)).toEqual([
      outcome.scenarioId,
      outcome.scenarioId,
      outcome.scenarioId,
    ])
  })

  it('escalates a betrayed actor faster and resolves an eliminated actor', () => {
    const first = advanceAutonomousThreads(initialAutonomousThreads(), outcome)
    const next = advanceAutonomousThreads(first, {
      ...outcome,
      scenarioId: 'mafia-war-390',
      relationships: {
        'prince-benjamin': { trust: -50, fear: 70, pact: false, betrayed: true },
      },
      unitConditions: { 'prince-camilla': 'ELIMINATED' },
    })

    expect(next.find((thread) => thread.actorId === 'prince-benjamin')?.stage).toBe('CRISIS')
    expect(next.find((thread) => thread.actorId === 'prince-camilla')?.stage).toBe('RESOLVED')
  })

  it('does not autonomously accelerate the faction currently controlled by the player', () => {
    const threads = advanceAutonomousThreads(initialAutonomousThreads(), {
      ...outcome,
      selectedFactionId: 'prince-benjamin',
    })
    expect(threads.find((thread) => thread.actorId === 'prince-benjamin')?.pressure).toBe(0)
  })
})
