import { describe, expect, it } from 'vitest'
import type { ArenaHandoffResult } from '../arena/bridge'
import { infiltrationArenaHandoff } from './arenaBridge'
import { initialInfiltrationState, resolveArenaEscape } from './state'

function identified() {
  const state = initialInfiltrationState({
    playerAt: { position: [0, 0], spaceId: 'exit' },
    objectiveSpaceId: 'records',
    extractionSpaceId: 'exit',
    witnesses: [],
  })
  return {
    ...state,
    outcome: 'identified' as const,
    hatsu: { ...state.hatsu, aura: 38 },
    objectives: state.objectives.map((objective) =>
      objective.kind === 'extract' ? objective : { ...objective, state: 'confirmed' as const },
    ),
  }
}

describe('Infiltration → Arena handoff', () => {
  it('opens only when an identified infiltrator has completed the operation', () => {
    expect(infiltrationArenaHandoff(identified(), 'escape-1', '/fr/infiltration')).toMatchObject({
      id: 'escape-1',
      sourceMode: 'INFILTRATION',
      context: 'NARRATIVE',
      playerAura: 38,
      returnHref: '/fr/infiltration',
    })
    expect(
      infiltrationArenaHandoff({ ...identified(), outcome: 'timeUp' }, 'escape-1', '/infiltration'),
    ).toBeNull()
  })

  it('turns an Arena win into a confirmed extraction', () => {
    const resolved = resolveArenaEscape(identified(), result({ outcome: 'won' }))
    expect(resolved.outcome).toBe('escaped')
    expect(resolved.clock).toBe(12)
    expect(resolved.hatsu.aura).toBe(21)
    expect(resolved.objectives.find((objective) => objective.kind === 'extract')?.state).toBe(
      'confirmed',
    )
  })

  it('keeps a defeated infiltrator identified', () => {
    expect(resolveArenaEscape(identified(), result({ outcome: 'lost' })).outcome).toBe('identified')
  })
})

function result(over: Partial<ArenaHandoffResult>): ArenaHandoffResult {
  return {
    version: 1,
    handoffId: 'escape-1',
    outcome: 'won',
    playerAura: 21,
    opponentAura: 0,
    playerCondition: 'ready',
    opponentCondition: 'ko',
    revealedHatsuIds: [],
    nenEffects: [],
    intervention: false,
    elapsedSeconds: 12,
    ...over,
  }
}
