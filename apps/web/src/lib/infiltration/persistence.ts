import type { InfiltrationState } from './state'
import { emptyMemory } from './actors/memory'
import { securityPolicy } from './security'
import { emptyFactionKnowledge } from './factions'

export const INFILTRATION_SAVE_VERSION = 3
export interface InfiltrationSave {
  version: 3
  savedAt: string
  state: InfiltrationState
}

export function encodeSave(state: InfiltrationState, savedAt = new Date().toISOString()): string {
  return JSON.stringify({
    version: INFILTRATION_SAVE_VERSION,
    savedAt,
    state,
  } satisfies InfiltrationSave)
}

export function decodeSave(raw: string): InfiltrationSave | null {
  try {
    const value = JSON.parse(raw) as {
      version?: number
      savedAt?: string
      state?: InfiltrationState
    }
    if (
      (value.version !== 2 && value.version !== 3) ||
      !value.state?.mission ||
      !Array.isArray(value.state.objectives)
    )
      return null
    const state = value.state as InfiltrationState
    if (value.version === 2) {
      state.memories = { steward: emptyMemory(), guard: emptyMemory(), nenGuard: emptyMemory() }
      state.cover = {
        role: 'maintenance',
        superior: 'deck-operations',
        assignment: 'legacy-operation',
        allowedSpaces: [state.extractionSpaceId],
        evidence: ['work-order'],
        obligations: [],
      }
      state.security = securityPolicy(state.alertLevel, state.extractionSpaceId)
      state.journal = []
    }
    // Saves written before walks left the journal carry one entry per frame.
    state.journal = (state.journal ?? []).filter((event) => event.type !== 'WALKED')
    state.hatsu.scout ??= null
    state.hatsu.forgerySurface ??= 'work-order'
    state.hatsu.disguiseIdentity ??= 'maintenance'
    state.hatsu.effect ??= null
    state.hatsu.targetWitnessId ??= null
    state.hatsu.targetSpaceId ??= null
    state.factionKnowledge ??= emptyFactionKnowledge()
    state.witnesses = state.witnesses.map((witness) => ({
      ...witness,
      faction:
        witness.faction ??
        (witness.id === 'steward'
          ? 'royal-staff'
          : witness.id === 'guard'
            ? 'security'
            : 'hunter-association'),
    }))
    return { version: 3, savedAt: value.savedAt ?? new Date(0).toISOString(), state }
  } catch {
    return null
  }
}
