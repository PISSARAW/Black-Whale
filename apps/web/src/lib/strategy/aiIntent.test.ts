import { describe, expect, it } from 'vitest'
import { initialFactionAIMemory, planFactionAIIntent, rememberAIObservations } from './aiIntent'

const incompleteObjective = {
  id: 'intel',
  doctrine: 'INTELLIGENCE' as const,
  title: 'Find them',
  description: 'Confirm hostile positions',
  current: 0,
  target: 2,
  complete: false,
}

describe('strategy AI intent', () => {
  it('pursues only hostile locations that entered faction memory', () => {
    const memory = rememberAIObservations(initialFactionAIMemory(), ['known-room'], 3)
    const intent = planFactionAIIntent({
      doctrine: 'INTELLIGENCE',
      objectiveKind: 'CONFIRM_HOSTILES',
      objective: incompleteObjective,
      ownLocationIds: ['start'],
      destinationIds: ['start', 'known-room', 'hidden-room'],
      memory,
    })

    expect(intent.preferredDestinationIds).toEqual(['known-room'])
    expect(intent.preferredDestinationIds).not.toContain('hidden-room')
  })

  it('forgets stale sightings instead of tracking opponents forever', () => {
    const seen = rememberAIObservations(initialFactionAIMemory(), ['room'], 1)
    const forgotten = rememberAIObservations(seen, [], 4)
    expect(forgotten.observedOpponentLocations).toEqual({})
  })

  it('concentrates a consolidation faction on its strongest known position', () => {
    const intent = planFactionAIIntent({
      doctrine: 'CONSOLIDATION',
      objectiveKind: 'FORM_BASTION',
      objective: incompleteObjective,
      ownLocationIds: ['bastion', 'hall', 'bastion'],
      destinationIds: ['bastion', 'hall'],
      memory: initialFactionAIMemory(),
    })
    expect(intent.kind).toBe('CONSOLIDATE')
    expect(intent.preferredDestinationIds).toEqual(['bastion'])
  })
})
