import type { CoverClaim, InfiltrationState, Witness, WitnessId } from '../state'

type Answer = CoverClaim['answer']

/**
 * The claims a witness can hold the visitor to: the ones made to it, and the
 * ones made to a witness who has since reported — a report carries what was
 * said. A story told to the steward alone is not something the Nen guard
 * heard, so answering each of them as they expect is not a contradiction.
 */
export function heardClaims(state: InfiltrationState, witnessId: WitnessId): CoverClaim[] {
  const reporters = new Set(
    state.witnesses.filter((witness) => witness.belief.reported).map((witness) => witness.id),
  )
  return state.claims.filter(
    (claim) => claim.witnessId === witnessId || reporters.has(claim.witnessId),
  )
}

function supportedByDocument(state: InfiltrationState, answer: Answer): boolean {
  if (!state.hatsu.forgedOrder || answer !== 'workOrder') return false
  return (
    state.hatsu.forgerySurface === 'work-order' || state.hatsu.forgerySurface === 'register-copy'
  )
}

function judged(witness: Witness, correct: boolean): Witness {
  return {
    ...witness,
    challenged: true,
    belief: {
      ...witness.belief,
      identity: correct ? 'maintenance' : 'intruder',
      certainty: correct
        ? Math.max(10, witness.belief.certainty - 30)
        : Math.min(100, witness.belief.certainty + 48),
    },
  }
}

export function answerChallenge(state: InfiltrationState, answer: Answer): InfiltrationState {
  const challenge = state.challenge
  if (!challenge) return state
  const prior = heardClaims(state, challenge.witnessId).at(-1)
  const contradiction = !!prior && prior.answer !== answer
  const documentSupport = supportedByDocument(state, answer)
  const verification =
    documentSupport && state.hatsu.forgerySurface === 'work-order'
      ? { witnessId: challenge.witnessId, left: 15 }
      : state.verification
  const witnesses = state.witnesses.map((witness) => {
    if (witness.id !== challenge.witnessId) return witness
    const expected: Answer = witness.usesEn ? 'bluff' : 'workOrder'
    return judged(witness, !contradiction && (documentSupport || answer === expected))
  })
  return {
    ...state,
    witnesses,
    challenge: null,
    verification,
    claims: [...state.claims, { witnessId: challenge.witnessId, answer, at: state.clock }],
    metrics: {
      ...state.metrics,
      challenges: state.metrics.challenges + 1,
      contradictions: state.metrics.contradictions + (contradiction ? 1 : 0),
    },
  }
}
