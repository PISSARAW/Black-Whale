import type { InfiltrationState, Witness } from './state'

export const INFILTRATION_DT = 1 / 30
export const MISSION_LENGTH = 8 * 60
const REPORT_THRESHOLD = 72

export function updateInfiltration(
  state: InfiltrationState,
  dt = INFILTRATION_DT,
): InfiltrationState {
  if (state.outcome !== 'playing') return state
  const clock = state.clock + dt
  const diversion = state.diversion
    ? { ...state.diversion, left: Math.max(0, state.diversion.left - dt) }
    : null
  const witnesses = state.witnesses.map((witness) => observe(state, witness, dt))
  const alert = Math.min(
    100,
    witnesses.reduce((sum, witness) => {
      return sum + (witness.belief.reported ? witness.belief.certainty * 0.45 : 0)
    }, 0),
  )
  const coverIntegrity = Math.max(
    0,
    100 -
      witnesses.reduce((sum, witness) => {
        return sum + (witness.belief.identity === 'intruder' ? witness.belief.certainty * 0.34 : 0)
      }, 0),
  )
  return {
    ...state,
    clock,
    diversion: diversion?.left ? diversion : null,
    witnesses,
    alert,
    coverIntegrity,
    outcome: clock >= MISSION_LENGTH ? 'timeUp' : alert >= 100 ? 'identified' : state.outcome,
  }
}

function observe(state: InfiltrationState, witness: Witness, dt: number): Witness {
  const distracted = state.diversion?.spaceId === witness.spaceId && state.diversion.left > 0
  const sameRoom = state.player.spaceId === witness.spaceId
  if (!sameRoom || distracted) return cool(witness, dt)

  const distance = Math.hypot(
    state.player.position[0] - witness.position[0],
    state.player.position[1] - witness.position[1],
  )
  if (distance > witness.sight) return cool(witness, dt)

  const auraHidden = state.player.nen === 'zetsu'
  const sociallyWrong = witness.social && state.player.spaceId === state.objectiveSpaceId
  const nenWrong = witness.usesEn && !auraHidden
  const identity = sociallyWrong || nenWrong ? 'intruder' : 'maintenance'
  const rate = identity === 'intruder' ? 24 : 7
  const certainty = Math.min(100, witness.belief.certainty + rate * dt)
  return {
    ...witness,
    belief: {
      identity,
      certainty,
      lastSpaceId: state.player.spaceId,
      reported: witness.belief.reported || certainty >= REPORT_THRESHOLD,
    },
  }
}

function cool(witness: Witness, dt: number): Witness {
  if (witness.belief.reported) return witness
  return {
    ...witness,
    belief: { ...witness.belief, certainty: Math.max(0, witness.belief.certainty - 3 * dt) },
  }
}

export function reconstruction(state: InfiltrationState) {
  const compromised = state.witnesses.filter((witness) => witness.belief.identity === 'intruder')
  return {
    witnesses: state.witnesses,
    traces: state.traces,
    identified: compromised.some((witness) => witness.belief.reported),
    score: Math.max(
      0,
      Math.round(100 - state.alert - state.traces.reduce((n, t) => n + t.strength * 0.1, 0)),
    ),
  }
}
