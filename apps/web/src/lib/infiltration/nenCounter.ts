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
  const countered = counteredKind(state, witness)
  if (!countered) return { state, countered: null }
  const certainty = Math.min(100, witness.belief.certainty + (countered === 'scout' ? 42 : 28))
  return {
    countered,
    state: applyCounter(state, witness, { countered, certainty }),
  }
}

function counteredKind(state: InfiltrationState, witness: Witness): NenCounterResult['countered'] {
  if (state.hatsu.scout?.active && state.hatsu.scout.spaceId === witness.spaceId) return 'scout'
  if (state.hatsu.effect?.kind !== 'paper-network') return null
  return state.hatsu.effect.spaceId === witness.spaceId ? 'surveillance' : null
}

function applyCounter(
  state: InfiltrationState,
  witness: Witness,
  result: { countered: Exclude<NenCounterResult['countered'], null>; certainty: number },
): InfiltrationState {
  return {
    ...state,
    witnesses: state.witnesses.map((candidate) =>
      candidate.id === witness.id
        ? {
            ...candidate,
            belief: {
              ...candidate.belief,
              identity: 'intruder',
              certainty: result.certainty,
              lastSpaceId: witness.spaceId,
              reported: candidate.belief.reported || result.certainty >= 72,
            },
          }
        : candidate,
    ),
    hatsu: {
      ...state.hatsu,
      scout:
        result.countered === 'scout' && state.hatsu.scout
          ? { ...state.hatsu.scout, active: false }
          : state.hatsu.scout,
      effect: result.countered === 'surveillance' ? null : state.hatsu.effect,
    },
    journal: [
      ...state.journal,
      {
        id: `nen-counter:${witness.id}:${state.clock.toFixed(3)}`,
        at: state.clock,
        type: 'HATSU_COUNTERED',
        actor: witness.id,
        sourceId: state.hatsu.id,
        payload: result.countered,
      },
    ],
  }
}
