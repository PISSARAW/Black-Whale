import type { InfiltrationState, Witness } from './state'

export interface NenCounterResult {
  state: InfiltrationState
  countered: 'scout' | 'surveillance' | null
}

/** A Nen guard counters only manifestations physically present in its own space. */
export function counterNenManifestation(
  state: InfiltrationState,
  witnessId: Witness['id'],
): NenCounterResult {
  const witness = state.witnesses.find((candidate) => candidate.id === witnessId)
  if (!witness?.usesEn) return { state, countered: null }
  const scoutPresent = state.hatsu.scout?.active && state.hatsu.scout.spaceId === witness.spaceId
  const networkPresent =
    state.hatsu.effect?.kind === 'paper-network' && state.hatsu.effect.spaceId === witness.spaceId
  if (!scoutPresent && !networkPresent) return { state, countered: null }

  const certainty = Math.min(100, witness.belief.certainty + (scoutPresent ? 42 : 28))
  const countered = scoutPresent ? 'scout' : 'surveillance'
  return {
    countered,
    state: {
      ...state,
      witnesses: state.witnesses.map((candidate) =>
        candidate.id === witness.id
          ? {
              ...candidate,
              belief: {
                ...candidate.belief,
                identity: 'intruder',
                certainty,
                lastSpaceId: witness.spaceId,
                reported: candidate.belief.reported || certainty >= 72,
              },
            }
          : candidate,
      ),
      hatsu: {
        ...state.hatsu,
        scout:
          scoutPresent && state.hatsu.scout
            ? { ...state.hatsu.scout, active: false }
            : state.hatsu.scout,
        effect: networkPresent ? null : state.hatsu.effect,
      },
      journal: [
        ...state.journal,
        {
          id: `nen-counter:${witness.id}:${state.clock.toFixed(3)}`,
          at: state.clock,
          type: 'HATSU_COUNTERED',
          actor: witness.id,
          sourceId: state.hatsu.id,
          payload: countered,
        },
      ],
    },
  }
}
