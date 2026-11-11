import type { CoverClaim, InfiltrationState, WitnessId } from '../state'

export interface DialogueOption {
  id: 'present-document' | 'explain-duty' | 'appeal-authority'
  answer: CoverClaim['answer']
  available: boolean
  label: { fr: string; en: string }
  basis: 'document' | 'obligation' | 'faction-knowledge'
}

/**
 * Builds bounded dialogue from facts the rules engine already grants.
 * A text generator may phrase these options, but cannot add an authorization.
 */
export function dialogueOptions(state: InfiltrationState, witnessId: WitnessId): DialogueOption[] {
  const witness = state.witnesses.find((candidate) => candidate.id === witnessId)
  if (!witness) return []
  const factionReports = state.factionKnowledge[witness.faction]
  const hasDocument =
    state.cover.evidence.includes('work-order') ||
    (state.hatsu.forgedOrder && state.hatsu.forgerySurface !== 'door-sign')
  const hasDuty =
    state.cover.allowedSpaces.includes(state.player.spaceId ?? '') &&
    state.cover.obligations.length > 0

  return [
    {
      id: 'present-document',
      answer: 'workOrder',
      available: hasDocument,
      label: {
        fr: `Présenter l’ordre : ${state.cover.assignment}`,
        en: `Present order: ${state.cover.assignment}`,
      },
      basis: 'document',
    },
    {
      id: 'explain-duty',
      answer: 'bluff',
      available: hasDuty,
      label: {
        fr: `Expliquer la tâche : ${state.cover.obligations[0] ?? 'aucune'}`,
        en: `Explain duty: ${state.cover.obligations[0] ?? 'none'}`,
      },
      basis: 'obligation',
    },
    {
      id: 'appeal-authority',
      answer: 'bluff',
      available: factionReports.length === 0,
      label: {
        fr: `Invoquer l’autorité de ${state.cover.superior}`,
        en: `Invoke ${state.cover.superior}'s authority`,
      },
      basis: 'faction-knowledge',
    },
  ]
}
