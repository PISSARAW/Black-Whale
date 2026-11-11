import { describe, expect, it } from 'vitest'
import { buildNPCDialogueEnvelope, validateNPCDialogue } from './dialogue'
import { createTourSimulation } from './state'

function world() {
  const state = createTourSimulation({ id: 'dialogue' })
  state.actors.guard = {
    spaceId: 'tier-5',
    objective: 'investigate-door',
    memory: ['door-was-open', 'saw-player-nearby'],
    nextDecisionAt: 0,
  }
  return state
}

describe('contextual NPC dialogue boundary', () => {
  it('sends only the actor memory and current objective to the model', () => {
    const envelope = buildNPCDialogueEnvelope(world(), 'guard', 'What happened?')!
    expect(envelope.availableFactIds).toEqual(['door-was-open', 'saw-player-nearby'])
    expect(envelope.objective).toBe('investigate-door')
    expect(envelope).not.toHaveProperty('incidents')
  })

  it('rejects invented facts and unauthorized world actions', () => {
    const invented = validateNPCDialogue(world(), 'guard', {
      intent: 'ANSWER',
      text: 'I know who stole it.',
      referencedFactIds: ['thief-identity'],
      proposedWorldAction: 'NONE',
    })
    expect(invented).toMatchObject({ accepted: false, reason: 'UNKNOWN_FACT' })

    const access = validateNPCDialogue(world(), 'guard', {
      intent: 'NEGOTIATE',
      text: 'You may pass.',
      referencedFactIds: ['door-was-open'],
      proposedWorldAction: 'OFFER_ACCESS',
    })
    expect(access).toMatchObject({ accepted: false, reason: 'ACTION_NOT_ALLOWED' })
  })

  it('allows an explicit lie without promoting it to a world fact', () => {
    const result = validateNPCDialogue(world(), 'guard', {
      intent: 'LIE',
      text: 'Nothing happened here.',
      referencedFactIds: [],
      proposedWorldAction: 'NONE',
    })
    expect(result.accepted).toBe(true)
    expect(result.state.incidents).toEqual([])
  })
})
