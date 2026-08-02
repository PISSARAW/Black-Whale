import type { NavGraph } from '../hunt/navmesh'
import { hearsMovement, patrolWitness } from './patrol'
import { activeDisguise } from './hatsu'
import type { InfiltrationState, Witness } from './state'

export const INFILTRATION_DT = 1 / 30
export const MISSION_LENGTH = 8 * 60
const REPORT_THRESHOLD = 72
export interface InfiltrationWorld {
  dt: number
  graph: NavGraph
}

export function updateInfiltration(
  state: InfiltrationState,
  world: InfiltrationWorld,
): InfiltrationState {
  if (state.outcome !== 'playing') return state
  const dt = world.dt
  const challenged = expireChallenge(state, dt)
  const clock = challenged.clock + dt
  const diversion = challenged.diversion
    ? { ...challenged.diversion, left: Math.max(0, challenged.diversion.left - dt) }
    : null
  const moved = challenged.witnesses.map((witness) => moveWitness(challenged, witness, world))
  const witnesses = moved.map((witness) => observe(challenged, witness, dt))
  const reports = witnesses.reduce((all, witness, index) => {
    if (!witness.belief.reported || challenged.witnesses[index].belief.reported) return all
    return [...all, { witnessId: witness.id, at: clock, certainty: witness.belief.certainty }]
  }, challenged.reports)
  const challenge = challengeFor(challenged, witnesses, dt)
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
    ...challenged,
    clock,
    diversion: diversion?.left ? diversion : null,
    witnesses,
    alert,
    coverIntegrity,
    challenge,
    reports,
    outcome: clock >= MISSION_LENGTH ? 'timeUp' : alert >= 100 ? 'identified' : state.outcome,
  }
}

function expireChallenge(state: InfiltrationState, dt: number): InfiltrationState {
  if (!state.challenge || state.challenge.left > dt) return state
  return {
    ...state,
    challenge: null,
    witnesses: state.witnesses.map((witness) =>
      witness.id === state.challenge?.witnessId
        ? {
            ...witness,
            challenged: true,
            belief: {
              ...witness.belief,
              identity: 'intruder',
              certainty: Math.min(100, witness.belief.certainty + 55),
            },
          }
        : witness,
    ),
  }
}

function moveWitness(
  state: InfiltrationState,
  witness: Witness,
  world: InfiltrationWorld,
): Witness {
  const distracted = state.diversion?.spaceId === witness.spaceId && state.diversion.left > 0
  if (distracted) return { ...witness, investigating: state.diversion!.spaceId }
  const heard = state.player.moving && hearsMovement(witness, state.player.spaceId, world.graph)
  const informed = heard ? { ...witness, investigating: state.player.spaceId } : witness
  return patrolWitness(informed, world.graph, world.dt)
}

function challengeFor(
  state: InfiltrationState,
  witnesses: Witness[],
  dt: number,
): InfiltrationState['challenge'] {
  if (state.challenge) {
    return { ...state.challenge, left: state.challenge.left - dt }
  }
  const challenger = witnesses.find((witness) => {
    if (!witness.social || witness.challenged || witness.spaceId !== state.player.spaceId)
      return false
    if (activeDisguise(state) && !witness.usesEn) return false
    return (
      Math.hypot(
        witness.position[0] - state.player.position[0],
        witness.position[1] - state.player.position[1],
      ) < 3
    )
  })
  return challenger ? { witnessId: challenger.id, left: 7 } : null
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
    reports: state.reports,
    score: Math.max(
      0,
      Math.round(100 - state.alert - state.traces.reduce((n, t) => n + t.strength * 0.1, 0)),
    ),
  }
}
