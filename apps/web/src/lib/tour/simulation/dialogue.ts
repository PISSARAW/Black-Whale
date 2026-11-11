import { evolveTourSimulation, type TourSimulationV1 } from './state'

export type NPCDialogueIntent = 'ANSWER' | 'QUESTION' | 'NEGOTIATE' | 'LIE' | 'REPORT'

export interface NPCDialogueEnvelope {
  actorId: string
  playerUtterance: string
  objective: string
  availableFactIds: string[]
  recentMemory: string[]
}

export interface NPCDialogueProposal {
  intent: NPCDialogueIntent
  text: string
  referencedFactIds: string[]
  proposedWorldAction: 'NONE' | 'OFFER_ACCESS' | 'REPORT_PLAYER'
}

export interface ValidatedNPCDialogue {
  accepted: boolean
  reason?: 'UNKNOWN_ACTOR' | 'UNKNOWN_FACT' | 'ACTION_NOT_ALLOWED' | 'EMPTY_TEXT'
  state: TourSimulationV1
}

/** Build the only context an external language model may receive. */
export function buildNPCDialogueEnvelope(
  state: TourSimulationV1,
  actorId: string,
  playerUtterance: string,
): NPCDialogueEnvelope | null {
  const actor = state.actors[actorId]
  if (!actor) return null
  return {
    actorId,
    playerUtterance: playerUtterance.slice(0, 500),
    objective: actor.objective,
    availableFactIds: [...new Set(actor.memory)],
    recentMemory: actor.memory.slice(-8),
  }
}

/** Validate a model proposal; prose may lie, world facts and actions may not. */
export function validateNPCDialogue(
  state: TourSimulationV1,
  actorId: string,
  proposal: NPCDialogueProposal,
): ValidatedNPCDialogue {
  const actor = state.actors[actorId]
  if (!actor) return { accepted: false, reason: 'UNKNOWN_ACTOR', state }
  if (!proposal.text.trim()) return { accepted: false, reason: 'EMPTY_TEXT', state }
  if (proposal.referencedFactIds.some((fact) => !actor.memory.includes(fact)))
    return { accepted: false, reason: 'UNKNOWN_FACT', state }
  const mayOfferAccess = (state.reputation[actorId] ?? 0) >= 25
  if (proposal.proposedWorldAction === 'OFFER_ACCESS' && !mayOfferAccess)
    return { accepted: false, reason: 'ACTION_NOT_ALLOWED', state }
  if (proposal.proposedWorldAction === 'REPORT_PLAYER' && !state.witnesses.includes(actorId))
    return { accepted: false, reason: 'ACTION_NOT_ALLOWED', state }

  const next = evolveTourSimulation(state, (draft) => {
    draft.actors[actorId].memory.push(`dialogue:${proposal.intent}`)
    if (proposal.proposedWorldAction === 'OFFER_ACCESS')
      draft.permissions.push(`offered-by:${actorId}`)
    if (proposal.proposedWorldAction === 'REPORT_PLAYER')
      draft.incidents.push(`npc-report:${actorId}`)
  })
  return { accepted: true, state: next }
}
