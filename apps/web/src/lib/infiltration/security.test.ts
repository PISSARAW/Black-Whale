import { describe, expect, it } from 'vitest'
import { applySecurityProcedures, securityPolicy } from './security'
import { initialInfiltrationState, infiltrationReducer, type MissionSetup } from './state'

describe('collective security', () => {
  it('changes concrete procedures during lockdown', () => {
    expect(securityPolicy('normal', 'exit').verifyDocuments).toBe(false)
    expect(securityPolicy('lockdown', 'exit')).toMatchObject({
      pairPatrols: true,
      lockedExits: ['exit'],
      searchLastKnown: true,
    })
  })

  it('sends a pair to the strongest last known position', () => {
    const setup: MissionSetup = {
      playerAt: { position: [0, 0], spaceId: 'entry' },
      objectiveSpaceId: 'office',
      extractionSpaceId: 'entry',
      witnesses: ['steward', 'guard', 'nenGuard'].map((id) => ({
        id: id as 'steward' | 'guard' | 'nenGuard',
        position: [0, 0],
        heading: 0,
        spaceId: 'entry',
        sight: 8,
        social: true,
        usesEn: false,
        route: ['entry'],
      })),
    }
    const state = initialInfiltrationState(setup)
    const witnesses = state.witnesses.map((witness, index) => ({
      ...witness,
      belief: {
        ...witness.belief,
        identity: 'intruder' as const,
        certainty: 80 - index,
        lastSpaceId: 'office',
      },
    }))
    const assigned = applySecurityProcedures(witnesses, securityPolicy('lockdown', 'entry'))
    expect(assigned.filter((witness) => witness.investigating === 'office')).toHaveLength(2)
  })

  it('prevents extraction through an exit closed by lockdown', () => {
    const state = initialInfiltrationState({
      playerAt: { position: [0, 0], spaceId: 'entry' },
      objectiveSpaceId: 'office',
      extractionSpaceId: 'entry',
      witnesses: [],
    })
    const ready = {
      ...state,
      documentCopied: true,
      objectives: state.objectives.map((objective) => ({
        ...objective,
        state: objective.kind === 'extract' ? objective.state : ('confirmed' as const),
      })),
      security: securityPolicy('lockdown', 'entry'),
    }
    expect(infiltrationReducer(ready, { type: 'EXTRACT' }).outcome).toBe('playing')
  })
})
