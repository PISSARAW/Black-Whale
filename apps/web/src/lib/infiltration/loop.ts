import type { NavGraph } from '../hunt/navmesh'
import type { Arena } from '../hunt/arena'
import { patrolWitness } from './patrol'
import { hearingStrength } from './sound'
import { activeDisguise } from './hatsu'
import { canSee } from './vision'
import type { InfiltrationState, Witness } from './state'
import { assessAlert } from './alerts'
import { activeTraces } from './traces'
import { remember } from './actors/memory'
import { securityPolicy } from './security'
import { inspectForgery, recognizesDisguise, type InspectionMethod } from './hatsuSpatial'

export const INFILTRATION_DT = 1 / 30
const REPORT_THRESHOLD = 72
export interface InfiltrationWorld {
  dt: number
  graph: NavGraph
  arena: Arena
}

export function updateInfiltration(
  state: InfiltrationState,
  world: InfiltrationWorld,
): InfiltrationState {
  if (state.outcome !== 'playing') return state
  const dt = world.dt
  const challenged = advanceVerification(expireChallenge(expireHatsuEffect(state), dt), dt)
  const clock = challenged.clock + dt
  const diversion = challenged.diversion
    ? { ...challenged.diversion, left: Math.max(0, challenged.diversion.left - dt) }
    : null
  const moved = challenged.witnesses.map((witness) => moveWitness(challenged, witness, world))
  const searched = discoverTraces({
    ...challenged,
    witnesses: moved,
    traces: activeTraces(challenged.traces, clock),
  })
  const witnesses = searched.witnesses.map((witness) => observe(searched, witness, world))
  const reports = witnesses.reduce((all, witness, index) => {
    if (!witness.belief.reported || challenged.witnesses[index].belief.reported) return all
    return [...all, { witnessId: witness.id, at: clock, certainty: witness.belief.certainty }]
  }, searched.reports)
  const challenge = challengeFor(searched, witnesses, dt)
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
  const alertLevel = assessAlert(
    reports,
    witnesses.filter((witness) => witness.belief.identity === 'intruder').length,
  ).level
  const alertChanged = alertLevel !== state.alertLevel
  let memories = searched.memories
  for (const report of reports.slice(searched.reports.length)) {
    memories = {
      ...memories,
      [report.witnessId]: remember(memories[report.witnessId], {
        id: `report:${report.witnessId}:${report.at.toFixed(3)}`,
        at: report.at,
        observerId: report.witnessId,
        kind: 'report',
        subject: 'player',
        value: 'intruder',
        certainty: report.certainty,
      }),
    }
  }
  const newlyDiscovered = searched.traces.reduce((count, trace, index) => {
    const before = challenged.traces[index]?.discoveredBy?.length ?? 0
    return count + Math.max(0, (trace.discoveredBy?.length ?? 0) - before)
  }, 0)
  return {
    ...searched,
    clock,
    diversion: diversion?.left ? diversion : null,
    witnesses,
    alert,
    alertLevel,
    memories,
    security: securityPolicy(alertLevel, searched.extractionSpaceId),
    journal: alertChanged
      ? [
          ...searched.journal,
          {
            id: `alert:${clock.toFixed(3)}`,
            at: clock,
            type: 'ALERT_CHANGED',
            actor: 'system',
            payload: `${state.alertLevel}>${alertLevel}`,
          },
        ]
      : searched.journal,
    coverIntegrity,
    challenge,
    reports,
    metrics: {
      ...searched.metrics,
      maxAlert: Math.max(searched.metrics.maxAlert, alert),
      tracesDiscovered: searched.metrics.tracesDiscovered + newlyDiscovered,
    },
    outcome: clock >= searched.mission.duration ? 'timeUp' : state.outcome,
  }
}

function expireHatsuEffect(state: InfiltrationState): InfiltrationState {
  const effect = state.hatsu.effect
  if (!effect?.expiresAt || effect.expiresAt > state.clock) return state
  return { ...state, hatsu: { ...state.hatsu, effect: null } }
}

function discoverTraces(state: InfiltrationState): InfiltrationState {
  let witnesses = state.witnesses
  const traces = state.traces.map((trace) => {
    const discoverers = witnesses.filter((witness) => {
      if (witness.spaceId !== trace.spaceId || trace.discoveredBy?.includes(witness.id))
        return false
      return trace.kind !== 'aura' || witness.usesEn
    })
    if (discoverers.length === 0) return trace
    const ids = discoverers.map((witness) => witness.id)
    witnesses = witnesses.map((witness) => {
      if (!ids.includes(witness.id)) return witness
      const certainty = Math.min(100, witness.belief.certainty + trace.strength * 0.45)
      return {
        ...witness,
        belief: {
          ...witness.belief,
          identity: 'intruder',
          certainty,
          lastSpaceId: trace.spaceId,
          reported: witness.belief.reported || certainty >= REPORT_THRESHOLD,
        },
      }
    })
    return { ...trace, discoveredBy: [...(trace.discoveredBy ?? []), ...ids] }
  })
  return { ...state, traces, witnesses }
}

function advanceVerification(state: InfiltrationState, dt: number): InfiltrationState {
  if (!state.verification) return state
  if (state.verification.left > dt) {
    return { ...state, verification: { ...state.verification, left: state.verification.left - dt } }
  }
  const witness = state.witnesses.find(
    (candidate) => candidate.id === state.verification?.witnessId,
  )
  const method: InspectionMethod =
    witness?.id === 'steward' ? 'visual' : witness?.id === 'guard' ? 'touch' : 'registry'
  const verdict = inspectForgery(method, false)
  if (verdict === 'accepted') return { ...state, verification: null }
  return {
    ...state,
    verification: null,
    hatsu: { ...state.hatsu, forgedOrder: false },
    witnesses: state.witnesses.map((witness) =>
      witness.id === state.verification?.witnessId
        ? {
            ...witness,
            belief: {
              ...witness.belief,
              identity: 'intruder',
              certainty: Math.min(100, witness.belief.certainty + 65),
              reported: true,
            },
          }
        : witness,
    ),
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
  const heard = hearingStrength(witness, state.player, world.graph) >= 0.2
  const informed = heard ? { ...witness, investigating: state.player.spaceId } : witness
  return patrolWitness(informed, world)
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
    if (activeDisguise(state)) {
      const knowsModel =
        (state.hatsu.disguiseIdentity === 'service' && witness.id === 'steward') ||
        (state.hatsu.disguiseIdentity === 'security' && witness.id === 'guard') ||
        (state.hatsu.disguiseIdentity === 'maintenance' && witness.id === 'steward')
      const mismatch = state.player.spaceId === state.objectiveSpaceId || state.player.speed > 3
      if (!recognizesDisguise(knowsModel, mismatch, witness.usesEn, true)) return false
    }
    return (
      Math.hypot(
        witness.position[0] - state.player.position[0],
        witness.position[1] - state.player.position[1],
      ) < 3
    )
  })
  return challenger ? { witnessId: challenger.id, left: 7 } : null
}

function observe(state: InfiltrationState, witness: Witness, world: InfiltrationWorld): Witness {
  const dt = world.dt
  const distracted = state.diversion?.spaceId === witness.spaceId && state.diversion.left > 0
  if (distracted || !canSee(witness, state.player, world.arena.walls)) return cool(witness, dt)

  const auraHidden = state.player.nen === 'zetsu'
  const sociallyWrong =
    witness.social &&
    !!state.player.spaceId &&
    !state.cover.allowedSpaces.includes(state.player.spaceId)
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
    claims: state.claims,
    discoveredTraces: state.traces.filter((trace) => (trace.discoveredBy?.length ?? 0) > 0).length,
    score: Math.max(
      0,
      Math.round(100 - state.alert - state.traces.reduce((n, t) => n + t.strength * 0.1, 0)),
    ),
  }
}
